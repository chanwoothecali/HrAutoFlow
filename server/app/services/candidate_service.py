# app/services/candidate_service.py
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from pathlib import Path
import asyncio

from app.models import Resume, ResumeAnalysis
from app.services.llm_service import llm_service
from app.services.upload_service import upload_service


class CandidateService:

    @staticmethod
    async def process_resume_pipeline(
            resume_id: int,
            file_path: str,
            position: str,
            db: Session
    ):
        """
        ⭐ 완전한 이력서 처리 파이프라인
        1. 텍스트 추출
        2. 텍스트 스플리팅
        3. 임베딩 (OllamaEmbeddings)
        4. Vector DB 저장 (PGVector)
        5. 자동 분석 (요약, 강점, 면접질문, 스킬)
        6. ResumeAnalysis DB 저장
        """
        from app.db import DATABASE_URL

        resume = None

        try:
            print(f"\n{'=' * 60}")
            print(f"[Pipeline] 시작: resume_id={resume_id}")
            print(f"{'=' * 60}\n")

            # Resume 조회
            resume = db.query(Resume).filter(Resume.id == resume_id).first()
            if not resume:
                raise Exception(f"Resume not found: {resume_id}")

            # ============================================
            # 1. 텍스트 추출
            # ============================================
            print(f"[Step 1] 텍스트 추출 중...")
            resume.processing_status = "extracting"
            db.commit()

            text = await upload_service.extract_text_from_file(file_path)

            if not text or len(text) < 50:
                raise Exception("추출된 텍스트가 너무 짧습니다.")

            print(f"[Step 1] ✅ 추출 완료: {len(text)} characters")

            # DB에 extracted_text 저장
            resume.extracted_text = text
            db.commit()

            # ============================================
            # 2. 텍스트 스플리팅
            # ============================================
            print(f"\n[Step 2] 텍스트 분할 중...")
            resume.processing_status = "chunking"
            db.commit()

            doc_id = f"resume_{resume_id}"
            documents = llm_service.split_text(
                text=text,
                metadata={
                    "doc_id": doc_id,
                    "resume_id": resume_id,
                    "doc_name": Path(file_path).name,
                    "position": position
                }
            )

            print(f"[Step 2] ✅ 분할 완료: {len(documents)} chunks")
            for i, doc in enumerate(documents[:3]):  # 처음 3개만 출력
                print(f"  - Chunk {i}: {len(doc.page_content)} chars")

            # ============================================
            # 3. 임베딩 & Vector DB 저장
            # ============================================
            print(f"\n[Step 3] 임베딩 & Vector DB 저장 중...")
            resume.processing_status = "embedding"
            db.commit()

            # PGVector 초기화
            vectorstore = llm_service.get_vectorstore(
                connection_string=DATABASE_URL,
                collection_name="resume_vectors"
            )

            # ⭐ 문서 추가 (자동으로 OllamaEmbeddings로 임베딩 생성 후 저장)
            await vectorstore.aadd_documents(documents)

            print(f"[Step 3] ✅ Vector DB 저장 완료: {len(documents)} vectors")

            # ============================================
            # 4. 이력서 자동 분석 (병렬 실행)
            # ============================================
            print(f"\n[Step 4] 이력서 분석 중...")
            resume.processing_status = "analyzing"
            db.commit()

            # 병렬 실행으로 성능 향상
            summary_task = llm_service.generate_summary(text)
            strengths_task = llm_service.analyze_strengths(text)
            questions_task = llm_service.generate_interview_questions(text, position)
            skills_task = llm_service.extract_skills(text)
            experience_task = llm_service.extract_work_experience(text)

            summary, strengths, questions, skills, experiences = await asyncio.gather(
                summary_task,
                strengths_task,
                questions_task,
                skills_task,
                experience_task,
                return_exceptions=True
            )

            # Exception 처리
            if isinstance(summary, Exception):
                print(f"  ⚠️ 요약 생성 실패: {summary}")
                summary = "요약 생성 실패"

            if isinstance(strengths, Exception):
                print(f"  ⚠️ 강점 분석 실패: {strengths}")
                strengths = "강점 분석 실패"

            if isinstance(questions, Exception):
                print(f"  ⚠️ 면접 질문 생성 실패: {questions}")
                questions = []

            if isinstance(skills, Exception):
                print(f"  ⚠️ 스킬 추출 실패: {skills}")
                skills = {}

            if isinstance(experiences, Exception):
                print(f"  ⚠️ 경력 추출 실패: {experiences}")
                experiences = []

            print(f"[Step 4] ✅ 분석 완료")
            print(f"  - 요약: {len(summary)} chars")
            print(f"  - 강점: {len(strengths)} chars")
            print(f"  - 면접 질문: {len(questions)}개")
            print(f"  - 스킬: {len(skills)}개")
            print(f"  - 경력: {len(experiences)}개")

            # ============================================
            # 5. ResumeAnalysis DB 저장
            # ============================================
            print(f"\n[Step 5] 분석 결과 DB 저장 중...")

            # 기존 분석 결과 삭제 (있을 경우)
            db.query(ResumeAnalysis).filter(ResumeAnalysis.resume_id == resume_id).delete()

            analysis = ResumeAnalysis(
                resume_id=resume_id,
                summary=summary,
                strengths=strengths,
                interview_questions=questions,
                skills_summary=skills,
                work_experience=experiences,
                top_tags=list(skills.keys())[:5] if skills else [],
                analysis_version="1.0"
            )
            db.add(analysis)

            resume.processing_status = "completed"
            db.commit()

            print(f"[Step 5] ✅ DB 저장 완료: analysis_id={analysis.id}")

            print(f"\n{'=' * 60}")
            print(f"[Pipeline] ✅ 완료: resume_id={resume_id}")
            print(f"{'=' * 60}\n")

            return {
                "success": True,
                "resume_id": resume_id,
                "summary": summary,
                "skills": skills
            }

        except Exception as e:
            print(f"\n{'=' * 60}")
            print(f"[Pipeline] ❌ 실패: resume_id={resume_id}")
            print(f"오류: {str(e)}")
            print(f"{'=' * 60}\n")

            if resume:
                resume.processing_status = "failed"
                resume.error_message = str(e)
                db.commit()

            raise


candidate_service = CandidateService()
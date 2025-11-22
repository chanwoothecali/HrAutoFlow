# app/routers/llm_router.py
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db import get_db, DATABASE_URL
from app.services.llm_service import llm_service
from app.schemas.candidate_schema import QuestionRequest, FeedbackRequest
from app.models import VectorStore

router = APIRouter(prefix="/api/llm", tags=["LLM"])


@router.post("/ask")
async def ask_question(
        request: QuestionRequest,
        db: Session = Depends(get_db)
):
    """RAG 기반 질의응답 (동기 방식)"""

    try:
        answers = []

        for resume_id in request.resume_ids:
            doc_id = f"resume_{resume_id}"

            print(f"[RAG] 질문 처리 중: resume_id={resume_id}")

            # 동기 방식으로 RAG 쿼리 실행
            try:
                # 1. 질문 임베딩 생성 (동기)
                query_embedding = llm_service.embeddings.embed_query(request.question)

                # 2. Vector 유사도 검색 (동기)
                stmt = select(
                    VectorStore.content,
                    VectorStore.meta_data,
                    (1 - VectorStore.embedding.cosine_distance(query_embedding)).label('similarity')
                ).where(
                    VectorStore.doc_id == doc_id
                ).order_by(
                    VectorStore.embedding.cosine_distance(query_embedding)
                ).limit(5)

                result = db.execute(stmt)
                rows = result.all()

                if not rows:
                    answer_text = "해당 이력서에서 관련 정보를 찾을 수 없습니다."
                    chunks = []
                    relevance_score = 0.0
                else:
                    # 3. 검색된 청크로 컨텍스트 구성
                    chunks = [row.content for row in rows]
                    context = "\n\n".join(chunks)

                    # 4. LLM으로 답변 생성
                    from langchain_core.prompts import ChatPromptTemplate
                    from langchain_core.output_parsers import StrOutputParser

                    prompt = ChatPromptTemplate.from_template("""다음 이력서 정보를 바탕으로 질문에 답변해주세요.

컨텍스트:
{context}

질문: {question}

답변 (한국어):""")

                    chain = prompt | llm_service.llm | StrOutputParser()
                    answer_text = await chain.ainvoke({
                        "context": context,
                        "question": request.question
                    })

                    relevance_score = float(rows[0].similarity) if rows else 0.0

                print(f"[RAG] 답변 생성 완료: resume_id={resume_id}")

                # QA History 저장 (선택사항)
                # from app.models import QAHistory
                # qa_history = QAHistory(
                #     resume_id=resume_id,
                #     question=request.question,
                #     answer=answer_text,
                #     retrieved_chunks=chunks,
                #     relevance_score=relevance_score
                # )
                # db.add(qa_history)
                # db.commit()
                # db.refresh(qa_history)

                answers.append({
                    "qa_id": 1,  # qa_history.id 사용하려면 위 주석 해제
                    "resume_id": resume_id,
                    "answer": answer_text.strip(),
                    "sources": chunks[:3],  # 상위 3개만
                    "relevance_score": relevance_score
                })

            except Exception as e:
                print(f"[RAG] ⚠️ resume_id={resume_id} 처리 실패: {e}")
                answers.append({
                    "qa_id": None,
                    "resume_id": resume_id,
                    "answer": f"답변 생성 중 오류가 발생했습니다: {str(e)}",
                    "sources": [],
                    "relevance_score": 0.0
                })

        return {
            "success": True,
            "question": request.question,
            "answers": answers
        }

    except Exception as e:
        print(f"[RAG] ❌ 전체 오류: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/feedback")
async def submit_feedback(
        request: FeedbackRequest,
        db: Session = Depends(get_db)
):
    """피드백 제출 (Good Case 저장)"""

    from app.models import QAHistory, GoodCaseVector

    try:
        # QA History 조회
        qa = db.query(QAHistory).filter(QAHistory.id == request.qa_id).first()
        if not qa:
            raise HTTPException(status_code=404, detail="Q&A를 찾을 수 없습니다.")

        # 피드백 업데이트
        qa.is_good_case = request.is_good_case
        qa.feedback_rating = request.rating
        db.commit()

        # Good Case면 Vector DB에 저장
        if request.is_good_case:
            print(f"[Feedback] Good Case 저장 중: qa_id={request.qa_id}")

            # 질문 + 답변 임베딩 생성
            combined_text = f"질문: {qa.question}\n답변: {qa.answer}"
            embedding = llm_service.embeddings.embed_query(combined_text)

            # Good Case Vector 저장
            good_case = GoodCaseVector(
                qa_id=qa.id,
                question=qa.question,
                answer=qa.answer,
                context="\n".join(qa.retrieved_chunks) if qa.retrieved_chunks else "",
                embedding=embedding,
                meta_data={
                    "resume_id": qa.resume_id,
                    "relevance_score": qa.relevance_score,
                    "rating": request.rating
                }
            )
            db.add(good_case)
            db.commit()

            print(f"[Feedback] Good Case 저장 완료")

        return {
            "success": True,
            "message": "피드백이 저장되었습니다."
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"[Feedback] ❌ 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{resume_id}")
async def get_qa_history(resume_id: int, db: Session = Depends(get_db)):
    """특정 이력서의 Q&A 히스토리 조회"""

    from app.models import QAHistory

    try:
        history = db.query(QAHistory) \
            .filter(QAHistory.resume_id == resume_id) \
            .order_by(QAHistory.created_at.desc()) \
            .all()

        return [
            {
                "id": qa.id,
                "question": qa.question,
                "answer": qa.answer,
                "relevance_score": qa.relevance_score,
                "is_good_case": qa.is_good_case,
                "feedback_rating": qa.feedback_rating,
                "created_at": qa.created_at
            }
            for qa in history
        ]

    except Exception as e:
        print(f"[History] ❌ 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))
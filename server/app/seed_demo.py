from __future__ import annotations

import argparse
from datetime import date, datetime, timedelta, timezone
from typing import Iterable

from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.init_db import init_db
from app.models import (
    Admin,
    Applicant,
    DashboardStats,
    GoodCaseVector,
    HumanEvaluation,
    Interview,
    Position,
    QAHistory,
    Resume,
    ResumeAnalysis,
    UploadedFile,
    VectorStore,
)
from app.services.llm_service import llm_service


DEMO_POSITION_TITLES = [
    "Backend Engineer",
    "Frontend Engineer",
    "AI Platform Engineer",
]

DEMO_APPLICANT_EMAILS = [
    "minjun.backend@demo.hrautoflow.local",
    "seoyeon.backend@demo.hrautoflow.local",
    "jiwoo.frontend@demo.hrautoflow.local",
    "dohyun.ai@demo.hrautoflow.local",
    "hayoon.ai@demo.hrautoflow.local",
]

DEMO_ADMIN_EMAILS = [
    "recruiter@demo.hrautoflow.local",
    "techlead@demo.hrautoflow.local",
]


def reset_demo_data(db: Session) -> None:
    resumes = (
        db.query(Resume)
        .join(Applicant, Resume.applicant_id == Applicant.id)
        .filter(Applicant.email.in_(DEMO_APPLICANT_EMAILS))
        .all()
    )
    resume_ids = [resume.id for resume in resumes]
    uploaded_file_ids = [resume.uploaded_file_id for resume in resumes]
    applicant_ids = [resume.applicant_id for resume in resumes]
    doc_ids = [f"resume_{resume_id}" for resume_id in resume_ids]

    if resume_ids:
        qa_ids = [
            row[0]
            for row in db.query(QAHistory.id)
            .filter(QAHistory.resume_id.in_(resume_ids))
            .all()
        ]
        if qa_ids:
            db.query(GoodCaseVector).filter(GoodCaseVector.qa_id.in_(qa_ids)).delete(synchronize_session=False)
        db.query(QAHistory).filter(QAHistory.resume_id.in_(resume_ids)).delete(synchronize_session=False)
        db.query(ResumeAnalysis).filter(ResumeAnalysis.resume_id.in_(resume_ids)).delete(synchronize_session=False)
        db.query(VectorStore).filter(VectorStore.doc_id.in_(doc_ids)).delete(synchronize_session=False)
        db.query(Resume).filter(Resume.id.in_(resume_ids)).delete(synchronize_session=False)

    if applicant_ids:
        db.query(HumanEvaluation).filter(HumanEvaluation.applicant_id.in_(applicant_ids)).delete(synchronize_session=False)
        db.query(Interview).filter(Interview.applicant_id.in_(applicant_ids)).delete(synchronize_session=False)
        db.query(Applicant).filter(Applicant.id.in_(applicant_ids)).delete(synchronize_session=False)

    if uploaded_file_ids:
        db.query(UploadedFile).filter(UploadedFile.id.in_(uploaded_file_ids)).delete(synchronize_session=False)

    db.query(Admin).filter(Admin.email.in_(DEMO_ADMIN_EMAILS)).delete(synchronize_session=False)
    db.query(Position).filter(Position.title.in_(DEMO_POSITION_TITLES)).delete(synchronize_session=False)
    db.query(DashboardStats).filter(DashboardStats.stat_date == date.today()).delete(synchronize_session=False)
    db.commit()


def embed_if_requested(text: str, with_embeddings: bool) -> list[float] | None:
    if not with_embeddings:
        return None
    return llm_service.embeddings.embed_query(text)


def add_all(db: Session, objects: Iterable[object]) -> None:
    for obj in objects:
        db.add(obj)


def seed_demo_data(db: Session, with_embeddings: bool) -> None:
    now = datetime.now(timezone.utc)

    backend = Position(
        title="Backend Engineer",
        department="Engineering",
        description="Spring, FastAPI, PostgreSQL 기반 백엔드 개발자를 모집합니다.",
        required_skills=["Java", "Spring Boot", "SQL", "Docker"],
        preferred_skills=["PostgreSQL", "AWS", "RAG"],
        min_years=3,
        project_experience="운영 서비스 API 설계, 배치, 장애 대응 경험",
        status="Open",
    )
    frontend = Position(
        title="Frontend Engineer",
        department="Product Engineering",
        description="채용 운영 도구의 프론트엔드 경험을 개선할 개발자를 모집합니다.",
        required_skills=["React", "TypeScript", "Next.js"],
        preferred_skills=["Tailwind CSS", "Dashboard UI", "Data Visualization"],
        min_years=2,
        project_experience="관리자 도구 또는 대시보드 개발 경험",
        status="Open",
    )
    ai_platform = Position(
        title="AI Platform Engineer",
        department="AI Platform",
        description="LLM 기반 문서 분석과 RAG 파이프라인을 함께 개발할 엔지니어를 모집합니다.",
        required_skills=["Python", "FastAPI", "PostgreSQL", "Vector Search"],
        preferred_skills=["Ollama", "LangChain", "LoRA"],
        min_years=2,
        project_experience="문서 임베딩, 벡터 검색, LLM 서비스 연동 경험",
        status="Open",
    )
    add_all(db, [backend, frontend, ai_platform])
    db.flush()

    admins = [
        Admin(name="김채용", email="recruiter@demo.hrautoflow.local", role="recruiter"),
        Admin(name="이기술", email="techlead@demo.hrautoflow.local", role="tech_lead"),
    ]
    add_all(db, admins)
    db.flush()

    applicants = [
        Applicant(
            name="김민준",
            email="minjun.backend@demo.hrautoflow.local",
            phone="010-1000-1001",
            position=backend.title,
            position_id=backend.id,
            experience_years=5,
            education="Bachelor",
            status="Interview",
            score=91,
        ),
        Applicant(
            name="박서연",
            email="seoyeon.backend@demo.hrautoflow.local",
            phone="010-1000-1002",
            position=backend.title,
            position_id=backend.id,
            experience_years=3,
            education="Bachelor",
            status="In Progress",
            score=84,
        ),
        Applicant(
            name="한지우",
            email="jiwoo.frontend@demo.hrautoflow.local",
            phone="010-1000-1003",
            position=frontend.title,
            position_id=frontend.id,
            experience_years=4,
            education="Bachelor",
            status="New",
            score=87,
        ),
        Applicant(
            name="최도현",
            email="dohyun.ai@demo.hrautoflow.local",
            phone="010-1000-1004",
            position=ai_platform.title,
            position_id=ai_platform.id,
            experience_years=4,
            education="Master",
            status="In Progress",
            score=93,
        ),
        Applicant(
            name="윤하윤",
            email="hayoon.ai@demo.hrautoflow.local",
            phone="010-1000-1005",
            position=ai_platform.title,
            position_id=ai_platform.id,
            experience_years=2,
            education="Bachelor",
            status="pending",
            score=72,
        ),
    ]
    add_all(db, applicants)
    db.flush()

    resume_specs = [
        (
            applicants[0],
            "김민준_이력서.pdf",
            """김민준 | Backend Engineer
5년차 백엔드 개발자로 Java, Spring Boot, PostgreSQL 기반 결제/정산 API를 개발했습니다.
주문 API 병목 구간을 분석해 인덱스와 쿼리 구조를 개선했고, Docker 기반 배포 환경과 장애 대응 프로세스를 운영했습니다.""",
            {
                "Java": 92,
                "Spring Boot": 90,
                "PostgreSQL": 86,
                "Docker": 82,
            },
            ["Spring Boot 운영 경험", "SQL 튜닝", "장애 대응"],
        ),
        (
            applicants[1],
            "박서연_이력서.pdf",
            """박서연 | Backend Engineer
3년차 서버 개발자로 Python, FastAPI, PostgreSQL 기반 사내 운영 API를 개발했습니다.
관리자 도구와 배치성 데이터 처리 경험이 있으며 API 문서화와 테스트 코드 작성에 관심이 많습니다.""",
            {
                "Python": 84,
                "FastAPI": 82,
                "PostgreSQL": 78,
                "REST API": 80,
            },
            ["빠른 API 구현", "운영 도구 개발", "문서화"],
        ),
        (
            applicants[2],
            "한지우_이력서.pdf",
            """한지우 | Frontend Engineer
React, TypeScript, Next.js 기반 채용 대시보드와 데이터 시각화 화면을 개발했습니다.
디자인 시스템 컴포넌트를 정리하고 지원자 테이블, 필터, 상세 패널의 사용성을 개선했습니다.""",
            {
                "React": 88,
                "TypeScript": 86,
                "Next.js": 84,
                "Data Visualization": 79,
            },
            ["대시보드 UI", "컴포넌트 설계", "사용성 개선"],
        ),
        (
            applicants[3],
            "최도현_이력서.pdf",
            """최도현 | AI Platform Engineer
LLM 기반 문서 분석 파이프라인을 구축하며 청킹, 임베딩, PGVector 검색, RAG 응답 생성을 담당했습니다.
Ollama 기반 로컬 모델 운영과 LoRA 어댑터 실험을 통해 도메인 응답 일관성 개선 가능성을 검토했습니다.""",
            {
                "Python": 90,
                "RAG": 92,
                "PGVector": 88,
                "Ollama": 86,
            },
            ["RAG 파이프라인", "로컬 LLM 운영", "벡터 검색"],
        ),
        (
            applicants[4],
            "윤하윤_이력서.pdf",
            """윤하윤 | AI Engineer
Python 기반 데이터 전처리와 프롬프트 실험을 수행했습니다.
이력서 분석 태스크에서 요약, 강점 추출, 면접 질문 생성 프롬프트를 비교하며 결과 품질을 검토했습니다.""",
            {
                "Python": 76,
                "Prompt Engineering": 78,
                "Data Processing": 74,
                "LLM": 72,
            },
            ["프롬프트 실험", "데이터 전처리", "LLM 이해"],
        ),
    ]

    resumes: list[Resume] = []
    for index, (applicant, filename, extracted_text, skills, tags) in enumerate(resume_specs, start=1):
        uploaded_file = UploadedFile(
            original_filename=filename,
            stored_filename=f"demo_resume_{index}.pdf",
            file_type="application/pdf",
            file_size=120000 + index * 4096,
            storage_path=f"storage/demo/demo_resume_{index}.pdf",
            upload_status="uploaded",
        )
        db.add(uploaded_file)
        db.flush()

        resume = Resume(
            applicant_id=applicant.id,
            uploaded_file_id=uploaded_file.id,
            extracted_text=extracted_text,
            processing_status="completed",
        )
        db.add(resume)
        db.flush()
        resumes.append(resume)

        db.add(
            ResumeAnalysis(
                resume_id=resume.id,
                summary=f"{applicant.name} 후보자는 {applicant.position} 포지션에 적합한 경험을 보유하고 있습니다. 핵심 기술은 {', '.join(tags)}이며, 실무 적용 경험이 확인됩니다.",
                strengths="\n".join([f"• {tag}: 이력서에서 관련 프로젝트와 업무 경험이 확인됩니다." for tag in tags]),
                interview_questions=[
                    {
                        "question": f"{tags[0]} 경험에서 가장 어려웠던 문제와 해결 과정을 설명해주세요.",
                        "category": "experience",
                        "difficulty": "medium",
                    },
                    {
                        "question": f"{applicant.position} 역할에서 본인이 가장 강점을 보일 수 있는 영역은 무엇인가요?",
                        "category": "behavioral",
                        "difficulty": "easy",
                    },
                ],
                skills_summary=skills,
                work_experience=[
                    {
                        "company": "Demo Company",
                        "period": "2022.01 - Present",
                        "role": applicant.position,
                        "description": extracted_text.splitlines()[1],
                    }
                ],
                education_info={"degree": applicant.education, "major": "Software Engineering"},
                top_tags=tags,
                analysis_version="demo-v1",
            )
        )

        chunks = [chunk.strip() for chunk in extracted_text.splitlines() if chunk.strip()]
        for chunk_index, chunk in enumerate(chunks):
            db.add(
                VectorStore(
                    doc_id=f"resume_{resume.id}",
                    doc_name=filename,
                    chunk_index=chunk_index,
                    content=chunk,
                    embedding=embed_if_requested(chunk, with_embeddings),
                    meta_data={
                        "demo": True,
                        "resume_id": resume.id,
                        "applicant_id": applicant.id,
                        "position": applicant.position,
                    },
                )
            )

    interview = Interview(
        applicant_id=applicants[0].id,
        admin_id=admins[1].id,
        status="scheduled",
        scheduled_at=now + timedelta(days=2),
        interview_kit={
            "questions": [
                "Spring Boot 운영 서비스에서 장애 대응한 경험을 설명해주세요.",
                "PostgreSQL 쿼리 튜닝을 어떤 기준으로 진행했나요?",
            ],
            "duration": 60,
        },
    )
    db.add(interview)

    db.add(
        HumanEvaluation(
            applicant_id=applicants[3].id,
            evaluator="이기술",
            score=94,
            recommendation="hire",
            feedback="RAG와 로컬 LLM 운영 경험이 프로젝트 방향과 잘 맞습니다.",
        )
    )

    qa = QAHistory(
        resume_id=resumes[3].id,
        admin_id=admins[0].id,
        question="RAG 파이프라인 경험이 있나요?",
        answer="네, 최도현 후보자는 청킹, 임베딩, PGVector 검색, RAG 응답 생성 경험을 보유하고 있습니다.",
        retrieved_chunks=["청킹, 임베딩, PGVector 검색, RAG 응답 생성을 담당했습니다."],
        relevance_score=0.91,
        feedback_rating=5,
        is_good_case=True,
    )
    db.add(qa)
    db.flush()

    db.add(
        GoodCaseVector(
            qa_id=qa.id,
            question=qa.question,
            answer=qa.answer,
            context="\n".join(qa.retrieved_chunks or []),
            embedding=None,
            meta_data={"demo": True, "resume_id": resumes[3].id},
        )
    )

    db.add(
        DashboardStats(
            stat_date=date.today(),
            total_applicants=len(applicants),
            applicants_by_position={
                backend.title: 2,
                frontend.title: 1,
                ai_platform.title: 2,
            },
            applicants_by_status={
                "New": 1,
                "In Progress": 2,
                "Interview": 1,
                "pending": 1,
            },
            avg_score=85.4,
            top_skills={
                "Python": 3,
                "PostgreSQL": 3,
                "RAG": 1,
                "Spring Boot": 1,
                "React": 1,
            },
        )
    )

    for position in [backend, frontend, ai_platform]:
        position.applicant_count = len(position.applicants)

    db.commit()


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed demo data for HR AutoFlow.")
    parser.add_argument(
        "--with-embeddings",
        action="store_true",
        help="Generate real Ollama embeddings for demo resume chunks.",
    )
    args = parser.parse_args()

    init_db()
    db = SessionLocal()
    try:
        reset_demo_data(db)
        seed_demo_data(db, with_embeddings=args.with_embeddings)
        print("Demo data seeded successfully.")
        if not args.with_embeddings:
            print("Vector rows were inserted without embeddings. Use --with-embeddings to enable RAG demo search.")
    finally:
        db.close()


if __name__ == "__main__":
    main()

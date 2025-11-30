# app/routers/llm_router.py
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db, DATABASE_URL
from app.services.llm_service import llm_service
from app.schemas.candidate_schema import QuestionRequest, FeedbackRequest

router = APIRouter(prefix="/api/llm", tags=["LLM"])


@router.post("/ask")
async def ask_question(
        request: QuestionRequest,
        db: Session = Depends(get_db)
):
    """RAG 기반 질의응답"""

    try:
        answers = []

        for resume_id in request.resume_ids:
            doc_id = f"resume_{resume_id}"

            print(f"[RAG] 질문 처리 중: resume_id={resume_id}")

            try:
                # rag_query 메서드 사용 (커스텀 VectorStore 사용)
                result = await llm_service.rag_query(
                    question=request.question,
                    doc_id=doc_id,
                    k=5,
                    db_session=db
                )

                print(f"[RAG] 답변 생성 완료: resume_id={resume_id}")

                # QA History 저장 (선택사항)
                # from app.models import QAHistory
                # qa_history = QAHistory(
                #     resume_id=resume_id,
                #     question=request.question,
                #     answer=result["answer"],
                #     retrieved_chunks=result["chunks"],
                #     relevance_score=result["relevance_score"]
                # )
                # db.add(qa_history)
                # db.commit()
                # db.refresh(qa_history)

                answers.append({
                    "qa_id": 1,  # qa_history.id 사용하려면 위 주석 해제
                    "resume_id": resume_id,
                    "answer": result["answer"],
                    "sources": result["chunks"][:3],  # 상위 3개만
                    "relevance_score": result["relevance_score"]
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
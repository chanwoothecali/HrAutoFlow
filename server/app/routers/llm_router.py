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
        vectorstore = llm_service.get_vectorstore(
            connection_string=DATABASE_URL,
            collection_name="resume_vectors"
        )

        answers = []

        for resume_id in request.resume_ids:
            doc_id = f"resume_{resume_id}"

            print(f"[RAG] 질문 처리 중: resume_id={resume_id}")

            # RAG 쿼리
            result = await llm_service.rag_query(
                vectorstore=vectorstore,
                question=request.question,
                doc_id=doc_id,
                k=5
            )

            # QA History 저장
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
                "qa_id": 1,  # qa_history.id
                "resume_id": resume_id,
                "answer": result["answer"],
                "sources": result["chunks"][:3],
                "relevance_score": result["relevance_score"]
            })

        return {
            "success": True,
            "question": request.question,
            "answers": answers
        }

    except Exception as e:
        print(f"[RAG] 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/feedback")
async def submit_feedback(
        request: FeedbackRequest,
        db: Session = Depends(get_db)
):
    """피드백 제출 (Good Case 저장)"""

    # qa = db.query(QAHistory).filter(QAHistory.id == request.qa_id).first()
    # if not qa:
    #     raise HTTPException(status_code=404, detail="Q&A를 찾을 수 없습니다.")
    # 
    # qa.is_good_case = request.is_good_case
    # qa.feedback_rating = request.rating
    # db.commit()

    # Good Case면 good_case_vectors에 임베딩 저장
    if request.is_good_case:
        # question + answer 임베딩 생성
        # embedding = await llm_service.embeddings.aembed_query(qa.question + " " + qa.answer)
        # good_case = GoodCaseVector(
        #     qa_id=qa.id,
        #     question=qa.question,
        #     answer=qa.answer,
        #     embedding=embedding,
        #     metadata={...}
        # )
        # db.add(good_case)
        # db.commit()
        pass

    return {
        "success": True,
        "message": "피드백이 저장되었습니다."
    }


@router.get("/history/{resume_id}")
async def get_qa_history(resume_id: int, db: Session = Depends(get_db)):
    """특정 이력서의 Q&A 히스토리 조회"""

    # history = db.query(QAHistory)\
    #     .filter(QAHistory.resume_id == resume_id)\
    #     .order_by(QAHistory.created_at.desc())\
    #     .all()

    return []
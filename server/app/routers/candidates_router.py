# app/routers/candidates_router.py
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.candidate_schema import (
    CandidateResponse,
    CandidateDetailResponse,
    CandidateListResponse,
    UpdateStatusRequest
)

router = APIRouter(prefix="/api/candidates", tags=["Candidates"])


@router.get("/", response_model=CandidateListResponse)
async def get_candidates(
        position: Optional[str] = None,
        status: Optional[str] = None,
        min_score: Optional[int] = None,
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=100),
        db: Session = Depends(get_db)
):
    """지원자 리스트 조회 (필터링 지원)"""

    # 실제 구현
    # query = db.query(Applicant)
    # if position:
    #     query = query.filter(Applicant.position == position)
    # if status:
    #     query = query.filter(Applicant.status == status)
    # if min_score:
    #     query = query.filter(Applicant.score >= min_score)
    #
    # total = query.count()
    # candidates = query.order_by(Applicant.score.desc()).offset(skip).limit(limit).all()

    # Mock 데이터
    return {
        "total": 0,
        "candidates": []
    }


@router.get("/{candidate_id}", response_model=CandidateDetailResponse)
async def get_candidate_detail(candidate_id: int, db: Session = Depends(get_db)):
    """지원자 상세 정보 조회 (이력서 분석 결과 포함)"""

    # 실제 구현
    # applicant = db.query(Applicant).filter(Applicant.id == candidate_id).first()
    # if not applicant:
    #     raise HTTPException(status_code=404, detail="지원자를 찾을 수 없습니다.")
    #
    # resume = db.query(Resume).filter(Resume.applicant_id == candidate_id).first()
    # analysis = db.query(ResumeAnalysis).filter(ResumeAnalysis.resume_id == resume.id).first()
    # file = db.query(UploadedFile).filter(UploadedFile.id == resume.uploaded_file_id).first()

    raise HTTPException(status_code=404, detail="지원자를 찾을 수 없습니다.")


@router.patch("/{candidate_id}/status")
async def update_candidate_status(
        candidate_id: int,
        request: UpdateStatusRequest,
        db: Session = Depends(get_db)
):
    """지원자 상태 업데이트 (Mark as In Progress 버튼)"""

    # applicant = db.query(Applicant).filter(Applicant.id == candidate_id).first()
    # if not applicant:
    #     raise HTTPException(status_code=404, detail="지원자를 찾을 수 없습니다.")
    #
    # applicant.status = request.status
    # db.commit()

    return {
        "success": True,
        "candidate_id": candidate_id,
        "status": request.status
    }


@router.delete("/{candidate_id}")
async def delete_candidate(candidate_id: int, db: Session = Depends(get_db)):
    """지원자 삭제"""

    # applicant = db.query(Applicant).filter(Applicant.id == candidate_id).first()
    # if not applicant:
    #     raise HTTPException(status_code=404, detail="지원자를 찾을 수 없습니다.")
    #
    # db.delete(applicant)
    # db.commit()

    return {
        "success": True,
        "message": "지원자가 삭제되었습니다."
    }
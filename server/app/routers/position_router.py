# app/api/v1/positions.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, case
from typing import List, Optional
from datetime import datetime

from app.db import get_db
from app.models import Position, Applicant, Resume, ResumeAnalysis
from app.schemas.position_schemas import (
    PositionStatsResponse,
    PositionResponse,
    CandidateListItem,
    RecommendedCandidate,
    CandidateDetailResponse,
)

router = APIRouter(prefix="/api", tags=["Position"])


# ==========================================
# 1. 통계 API
# ==========================================
@router.get("/stats/positions", response_model=PositionStatsResponse)
async def get_position_stats(db: Session = Depends(get_db)):
    """
    GET /stats/positions
    채용 포지션 통계 조회
    """
    stats = db.query(
        func.count(case((Applicant.status == 'New', 1))).label('new'),
        func.count(case((Applicant.status == 'In Progress', 1))).label('inProgress'),
        func.count(case((Applicant.status == 'Interview', 1))).label('finalInterview'),
        func.count(case((Applicant.status == 'Hired', 1))).label('hired')
    ).first()

    return {
        "new": stats.new or 0,
        "inProgress": stats.inProgress or 0,
        "finalInterview": stats.finalInterview or 0,
        "hired": stats.hired or 0
    }


# ==========================================
# 2. 포지션 목록 API
# ==========================================
@router.get("/positions", response_model=List[PositionResponse])
async def get_positions(db: Session = Depends(get_db)):
    """
    GET /positions
    전체 채용 포지션 목록 조회
    """
    positions = db.query(Position).options(
        joinedload(Position.applicants)
    ).filter(Position.status == 'Open').all()

    result = []
    for pos in positions:
        # title을 소문자로 변환하고 공백 제거하여 id 생성
        position_id = pos.title.lower().replace(" ", "")

        result.append({
            "id": position_id,
            "title": pos.title,
            "department": pos.department or "",
            "techStack": ", ".join(pos.required_skills) if pos.required_skills else "",
            "minYears": f"{pos.min_years}years" if pos.min_years else "",
            "projectExperience": pos.project_experience or "",
            "preferred": ", ".join(pos.preferred_skills) if pos.preferred_skills else "",
            "headcount": str(len(pos.applicants)),  # 현재 지원자 수로 표시
            "status": pos.status,
            "applicants": len(pos.applicants)
        })

    return result


# ==========================================
# 3. 특정 포지션의 지원자 목록
# ==========================================
@router.get("/positions/{position_id}/candidates", response_model=List[CandidateListItem])
async def get_candidates_by_position(
        position_id: str,
        db: Session = Depends(get_db)
):
    """
    GET /positions/{position_id}/candidates
    특정 포지션의 지원자 목록 조회

    예: GET /positions/backend/candidates
    """
    # position_id (예: "backend")로 Position 찾기
    position = db.query(Position).filter(
        func.lower(func.replace(Position.title, ' ', '')) == position_id.lower()
    ).first()

    if not position:
        raise HTTPException(status_code=404, detail="Position not found")

    # 해당 포지션의 지원자들 조회
    candidates = db.query(Applicant).filter(
        Applicant.position_id == position.id
    ).options(joinedload(Applicant.position_rel)).all()

    return [
        {
            "id": str(c.id),
            "positionId": position_id,
            "name": c.name,
            "email": c.email or "",
            "positionTitle": c.position_rel.title,
            "department": c.position_rel.department or "",
            "status": c.status,
            "score": c.score or 0
        }
        for c in candidates
    ]


# ==========================================
# 4. 추천 지원자 목록
# ==========================================
@router.get("/candidates/recommended", response_model=List[RecommendedCandidate])
async def get_recommended_candidates(
        limit: int = Query(5, ge=1, le=20),
        db: Session = Depends(get_db)
):
    """
    GET /candidates/recommended
    점수 기준 상위 추천 지원자 목록
    """
    candidates = db.query(Applicant).options(
        joinedload(Applicant.position_rel)
    ).order_by(Applicant.score.desc()).limit(limit).all()

    return [
        {
            "id": str(c.id),
            "name": c.name,
            "email": c.email or "",
            "role": c.position_rel.title,
            "score": c.score or 0,
            "positionId": c.position_rel.title.lower().replace(" ", "")
        }
        for c in candidates
    ]


# ==========================================
# 5. 지원자 상세 정보
# ==========================================
@router.get("/candidates/{candidate_id}", response_model=CandidateDetailResponse)
async def get_candidate_detail(
        candidate_id: int,
        db: Session = Depends(get_db)
):
    """
    GET /candidates/{candidate_id}
    지원자 상세 정보 조회 (이력서 분석 포함)
    """
    candidate = db.query(Applicant).options(
        joinedload(Applicant.position_rel),
        joinedload(Applicant.resumes).joinedload(Resume.analysis)
    ).filter(Applicant.id == candidate_id).first()

    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # 첫 번째 이력서의 분석 결과 가져오기
    analysis = None
    if candidate.resumes and len(candidate.resumes) > 0:
        analysis = candidate.resumes[0].analysis

    # position_id 생성
    position_id = candidate.position_rel.title.lower().replace(" ", "")

    # skills_summary를 summaryChart로 변환
    summary_chart = []
    if analysis and analysis.skills_summary:
        for skill, score in analysis.skills_summary.items():
            summary_chart.append({"skill": skill, "score": score})

    # strengths를 리스트로 변환
    strengths = []
    if analysis and analysis.strengths:
        if isinstance(analysis.strengths, str):
            # 줄바꿈으로 split하고 bullet point 제거
            strengths = [
                s.strip().lstrip('•').strip()
                for s in analysis.strengths.split('\n')
                if s.strip()
            ]
        else:
            strengths = analysis.strengths

    # work_experience 처리
    work_experience = []
    if analysis and analysis.work_experience:
        work_experience = analysis.work_experience

    return {
        "id": str(candidate.id),
        "name": candidate.name,
        "email": candidate.email or "",
        "title": candidate.position_rel.title,
        "positionId": position_id,
        "positionTitle": candidate.position_rel.title,
        "experienceYears": candidate.experience_years or 0,
        "experienceLabel": f"{candidate.experience_years} years" if candidate.experience_years else "0 years",
        "education": candidate.education or "",
        "status": candidate.status,
        "score": candidate.score or 0,
        "keywords": analysis.top_tags if analysis and analysis.top_tags else [],
        "skills": analysis.top_tags if analysis and analysis.top_tags else [],
        "recommendation": analysis.summary if analysis else "",
        "sections": {
            "overview": {
                "summary": analysis.summary if analysis else "",
                "summaryChart": summary_chart,
                "strength": strengths,
                "workExperience": work_experience
            }
        }
    }


# ==========================================
# 6. 전체 지원자 목록
# ==========================================
@router.get("/applicants", response_model=List[CandidateListItem])
async def get_all_applicants(
        status: Optional[str] = Query(None, description="Filter by status"),
        position_id: Optional[str] = Query(None, description="Filter by position"),
        db: Session = Depends(get_db)
):
    """
    GET /applicants
    전체 지원자 목록 조회 (필터링 옵션 포함)
    """
    query = db.query(Applicant).options(
        joinedload(Applicant.position_rel)
    )

    # status 필터
    if status:
        query = query.filter(Applicant.status == status)

    # position 필터
    if position_id:
        position = db.query(Position).filter(
            func.lower(func.replace(Position.title, ' ', '')) == position_id.lower()
        ).first()
        if position:
            query = query.filter(Applicant.position_id == position.id)

    applicants = query.all()

    return [
        {
            "id": str(a.id),
            "positionId": a.position_rel.title.lower().replace(" ", ""),
            "name": a.name,
            "email": a.email or "",
            "positionTitle": a.position_rel.title,
            "department": a.position_rel.department or "",
            "status": a.status,
            "score": a.score or 0
        }
        for a in applicants
    ]
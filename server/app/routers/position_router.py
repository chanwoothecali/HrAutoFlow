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
        result.append({
            "id": str(pos.id),  # 실제 DB ID를 문자열로 변환
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
        position_id: int,
        db: Session = Depends(get_db)
):
    """
    GET /positions/{position_id}/candidates
    특정 포지션의 지원자 목록 조회

    예: GET /positions/1/candidates
    """
    # position_id로 Position 찾기
    position = db.query(Position).filter(Position.id == position_id).first()

    if not position:
        raise HTTPException(status_code=404, detail="Position not found")

    # 해당 포지션의 지원자들 조회
    candidates = db.query(Applicant).filter(
        Applicant.position_id == position.id
    ).options(joinedload(Applicant.position_rel)).all()

    return [
        {
            "id": str(c.id),
            "positionId": str(position_id),
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
    # position_id가 있고 유효한 점수가 있는 지원자만 조회
    candidates = db.query(Applicant).options(
        joinedload(Applicant.position_rel)
    ).filter(
        Applicant.position_id.isnot(None),  # position_id 필수
        Applicant.score.isnot(None),         # score가 null이 아닌 것만
        Applicant.score > 0                   # score가 0보다 큰 것만
    ).order_by(Applicant.score.desc()).limit(limit).all()

    return [
        {
            "id": str(c.id),
            "name": c.name,
            "email": c.email or "",
            "role": c.position_rel.title if c.position_rel else "Unknown",
            "score": c.score or 0,
            "positionId": str(c.position_id) if c.position_id else "0",
            "education": c.education or "",
            "experienceYears": c.experience_years or 0
        }
        for c in candidates
    ]


# ==========================================
# 5. 지원자 상세 정보
# ==========================================
@router.get("/candidates/{candidate_id}")
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
    resume_id = None
    if candidate.resumes and len(candidate.resumes) > 0:
        resume_id = candidate.resumes[0].id
        analysis = candidate.resumes[0].analysis

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
        "positionId": str(candidate.position_id),
        "positionTitle": candidate.position_rel.title,
        "experienceYears": candidate.experience_years or 0,
        "experienceLabel": f"{candidate.experience_years} years" if candidate.experience_years else "0 years",
        "education": candidate.education or "",
        "status": candidate.status,
        "score": candidate.score or 0,
        "keywords": analysis.top_tags if analysis and analysis.top_tags else [],
        "skills": analysis.top_tags if analysis and analysis.top_tags else [],
        "recommendation": analysis.summary if analysis else "",
        "resumeId": resume_id,
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
        position_id: Optional[int] = Query(None, description="Filter by position ID"),
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
        query = query.filter(Applicant.position_id == position_id)

    applicants = query.all()

    return [
        {
            "id": str(a.id),
            "positionId": str(a.position_id),
            "name": a.name,
            "email": a.email or "",
            "positionTitle": a.position_rel.title,
            "department": a.position_rel.department or "",
            "status": a.status,
            "score": a.score or 0
        }
        for a in applicants
    ]


# ==========================================
# 7. 인터뷰 일정 조회
# ==========================================
from datetime import datetime, timedelta
from app.models import Interview, Admin


@router.get("/interviews/upcoming")
async def get_upcoming_interviews(
        days: int = Query(1, ge=1, le=7, description="조회 기간 (1=오늘, 7=이번주)"),
        db: Session = Depends(get_db)
):
    """
    GET /interviews/upcoming
    다가오는 인터뷰 일정 조회
    """
    now = datetime.now()
    end_date = now + timedelta(days=days)

    interviews = db.query(Interview).options(
        joinedload(Interview.applicant).joinedload(Applicant.position_rel),
        joinedload(Interview.admin)
    ).filter(
        Interview.scheduled_at >= now,
        Interview.scheduled_at <= end_date,
        Interview.status.in_(['scheduled', 'in_progress'])
    ).order_by(Interview.scheduled_at).all()

    result = []
    for interview in interviews:
        applicant = interview.applicant
        position = applicant.position_rel
        admin = interview.admin

        # 시간 포맷팅
        scheduled_time = interview.scheduled_at
        time_diff = scheduled_time - now

        if time_diff.days == 0:
            time_label = scheduled_time.strftime('%H:%M') + ' Today'
            badge = 'Today'
        elif time_diff.days == 1:
            time_label = scheduled_time.strftime('%H:%M') + ' Tomorrow'
            badge = None
        else:
            time_label = scheduled_time.strftime('%m/%d %H:%M')
            badge = None

        # interview_kit에서 정보 추출
        kit = interview.interview_kit or {}
        duration = kit.get('duration', 45)
        location = kit.get('location', 'Zoom')

        result.append({
            'id': interview.id,
            'timeLabel': time_label,
            'title': f"{applicant.name} · {position.title if position else '포지션 미정'} 인터뷰",
            'description': f"인터뷰어: {admin.name if admin else '미정'} · {location} · {duration}분 미팅",
            'badge': badge,
            'scheduledAt': scheduled_time.isoformat()
        })

    return result


# ==========================================
# 8. 지원자 삭제
# ==========================================
@router.delete("/applicants/{applicant_id}")
async def delete_applicant(
        applicant_id: str,
        db: Session = Depends(get_db)
):
    """
    DELETE /applicants/{applicant_id}
    지원자 삭제 (CASCADE로 연관 데이터 모두 삭제)
    """
    # str을 int로 변환
    try:
        applicant_id_int = int(applicant_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid applicant ID")

    applicant = db.query(Applicant).filter(Applicant.id == applicant_id_int).first()

    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")

    try:
        db.delete(applicant)
        db.commit()

        return {"message": f"Applicant {applicant_id} deleted successfully"}

    except Exception as e:
        db.rollback()
        print(f"Error deleting applicant: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete applicant: {str(e)}")


# ==========================================
# 9. 사람 평가 저장/조회
# ==========================================
from app.models import HumanEvaluation
from pydantic import BaseModel


class HumanFeedbackCreate(BaseModel):
    score: int
    recommendation: str
    feedback: str
    evaluator: str = '평가자'


@router.post("/candidates/{candidate_id}/feedback")
async def save_human_feedback(
        candidate_id: int,
        data: HumanFeedbackCreate,
        db: Session = Depends(get_db)
):
    """사람 평가 저장 (여러 평가 가능)"""

    # 지원자 존재 확인
    applicant = db.query(Applicant).filter(Applicant.id == candidate_id).first()
    if not applicant:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # 항상 새로운 평가 생성 (여러 평가 가능)
    evaluation = HumanEvaluation(
        applicant_id=candidate_id,
        evaluator=data.evaluator,
        score=data.score,
        recommendation=data.recommendation,
        feedback=data.feedback
    )
    db.add(evaluation)

    try:
        db.commit()
        db.refresh(evaluation)
        return {
            "message": "Feedback created",
            "success": True,
            "evaluation": {
                "id": evaluation.id,
                "evaluator": evaluation.evaluator,
                "score": evaluation.score,
                "created_at": evaluation.created_at.isoformat() if evaluation.created_at else None
            }
        }
    except Exception as e:
        db.rollback()
        print(f"Error saving feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/candidates/{candidate_id}/feedback")
async def get_human_feedback(
        candidate_id: int,
        db: Session = Depends(get_db)
):
    """사람 평가 조회 (통계 포함)"""
    evaluations = db.query(HumanEvaluation).filter(
        HumanEvaluation.applicant_id == candidate_id
    ).order_by(HumanEvaluation.created_at.desc()).all()

    # 통계 계산
    total_count = len(evaluations)
    avg_score = sum(e.score for e in evaluations) / total_count if total_count > 0 else 0

    # 평가자별 통계
    evaluator_stats = {}
    for e in evaluations:
        if e.evaluator not in evaluator_stats:
            evaluator_stats[e.evaluator] = {
                'count': 0,
                'total_score': 0,
                'latest_date': None
            }
        evaluator_stats[e.evaluator]['count'] += 1
        evaluator_stats[e.evaluator]['total_score'] += e.score
        if not evaluator_stats[e.evaluator]['latest_date'] or e.created_at > evaluator_stats[e.evaluator]['latest_date']:
            evaluator_stats[e.evaluator]['latest_date'] = e.created_at

    return {
        "evaluations": [
            {
                "id": e.id,
                "evaluator": e.evaluator,
                "score": e.score,
                "recommendation": e.recommendation,
                "feedback": e.feedback,
                "created_at": e.created_at.isoformat() if e.created_at else None,
                "updated_at": e.updated_at.isoformat() if e.updated_at else None
            }
            for e in evaluations
        ],
        "statistics": {
            "total_count": total_count,
            "average_score": round(avg_score, 1),
            "evaluator_count": len(evaluator_stats),
            "by_evaluator": {
                evaluator: {
                    "count": stats['count'],
                    "avg_score": round(stats['total_score'] / stats['count'], 1),
                    "latest_evaluation": stats['latest_date'].isoformat() if stats['latest_date'] else None
                }
                for evaluator, stats in evaluator_stats.items()
            }
        }
    }


# ==========================================
# 10. 평가 삭제 API
# ==========================================
@router.delete("/feedback/{evaluation_id}")
async def delete_evaluation(
        evaluation_id: int,
        db: Session = Depends(get_db)
):
    """특정 평가 삭제"""
    evaluation = db.query(HumanEvaluation).filter(
        HumanEvaluation.id == evaluation_id
    ).first()

    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")

    try:
        db.delete(evaluation)
        db.commit()
        return {"message": "Evaluation deleted successfully", "success": True}
    except Exception as e:
        db.rollback()
        print(f"Error deleting evaluation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# 11. 전체 평가 목록 조회 (평가 전용 탭용)
# ==========================================
@router.get("/evaluations")
async def get_all_evaluations(
        candidate_id: Optional[str] = Query(None, description="Filter by candidate ID"),
        min_score: Optional[int] = Query(None, ge=0, le=100, description="Minimum score filter"),
        limit: int = Query(50, ge=1, le=200, description="Number of results"),
        offset: int = Query(0, ge=0, description="Offset for pagination"),
        db: Session = Depends(get_db)
):
    """
    전체 평가 목록 조회 (평가 전용 탭용)
    - 지원자별 필터링
    - 점수 필터링
    - 페이지네이션 지원
    """
    query = db.query(HumanEvaluation).options(
        joinedload(HumanEvaluation.applicant).joinedload(Applicant.position_rel)
    )

    # 필터 적용
    if candidate_id:
        try:
            query = query.filter(HumanEvaluation.applicant_id == int(candidate_id))
        except ValueError:
            pass  # 잘못된 ID는 무시

    if min_score is not None:
        query = query.filter(HumanEvaluation.score >= min_score)

    # 전체 개수 조회
    total_count = query.count()

    # 정렬 및 페이지네이션
    evaluations = query.order_by(
        HumanEvaluation.created_at.desc()
    ).limit(limit).offset(offset).all()

    # 지원자 목록 조회 (필터용)
    candidates = db.query(
        Applicant.id,
        Applicant.name
    ).join(
        HumanEvaluation,
        HumanEvaluation.applicant_id == Applicant.id
    ).distinct().all()

    candidate_list = [
        {"id": str(c.id), "name": c.name}
        for c in candidates
    ]

    return {
        "evaluations": [
            {
                "id": e.id,
                "applicant_id": e.applicant_id,
                "applicant_name": e.applicant.name,
                "position_title": e.applicant.position_rel.title if e.applicant.position_rel else "N/A",
                "evaluator": e.evaluator,
                "score": e.score,
                "recommendation": e.recommendation,
                "feedback": e.feedback,
                "created_at": e.created_at.isoformat() if e.created_at else None
            }
            for e in evaluations
        ],
        "pagination": {
            "total": total_count,
            "limit": limit,
            "offset": offset,
            "has_more": (offset + limit) < total_count
        },
        "filters": {
            "available_candidates": candidate_list
        }
    }
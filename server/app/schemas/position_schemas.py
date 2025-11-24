# app/schemas/positions.py
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime


# ==========================================
# 통계 관련 스키마
# ==========================================
class PositionStatsResponse(BaseModel):
    """포지션 통계 응답"""
    new: int = Field(default=0, description="New 상태 지원자 수")
    inProgress: int = Field(default=0, alias="inProgress", description="In Progress 상태 지원자 수")
    finalInterview: int = Field(default=0, alias="finalInterview", description="Interview 상태 지원자 수")
    hired: int = Field(default=0, description="Hired 상태 지원자 수")

    model_config = ConfigDict(populate_by_name=True)


# ==========================================
# 포지션 관련 스키마
# ==========================================
class PositionResponse(BaseModel):
    """포지션 목록 응답"""
    id: str = Field(..., description="포지션 ID (예: backend, data)")
    title: str = Field(..., description="포지션 제목")
    department: str = Field(..., description="부서명")
    techStack: str = Field(..., description="기술 스택")
    minYears: str = Field(..., description="최소 경력 (예: 3years)")
    projectExperience: str = Field(..., description="프로젝트 경험 요구사항")
    preferred: str = Field(..., description="우대사항")
    headcount: str = Field(..., description="채용 인원")
    status: str = Field(..., description="포지션 상태")
    applicants: int = Field(..., description="지원자 수")

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# 지원자 관련 스키마
# ==========================================
class CandidateListItem(BaseModel):
    """지원자 목록 아이템"""
    id: str = Field(..., description="지원자 ID")
    positionId: str = Field(..., description="포지션 ID")
    name: str = Field(..., description="지원자 이름")
    email: str = Field(..., description="이메일")
    positionTitle: str = Field(..., description="포지션 제목")
    department: str = Field(..., description="부서명")
    status: str = Field(..., description="지원 상태")
    score: int = Field(..., description="평가 점수")

    model_config = ConfigDict(from_attributes=True)


class RecommendedCandidate(BaseModel):
    """추천 지원자"""
    id: str = Field(..., description="지원자 ID")
    name: str = Field(..., description="지원자 이름")
    email: str = Field(..., description="이메일")
    role: str = Field(..., description="지원 포지션")
    score: int = Field(..., description="평가 점수")
    positionId: str = Field(..., description="포지션 ID")

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# 지원자 상세 관련 스키마
# ==========================================
class SkillScore(BaseModel):
    """스킬 점수"""
    skill: str = Field(..., description="스킬명")
    score: int = Field(..., description="점수 (0-100)")


class WorkExperience(BaseModel):
    """경력 사항"""
    company: str = Field(..., description="회사명")
    period: str = Field(..., description="재직 기간")
    role: str = Field(..., description="직무")
    description: str = Field(..., description="업무 설명")


class OverviewSection(BaseModel):
    """개요 섹션"""
    summary: str = Field(..., description="요약")
    summaryChart: List[SkillScore] = Field(..., description="스킬 차트")
    strength: List[str] = Field(..., description="강점 목록")
    workExperience: List[WorkExperience] = Field(..., description="경력 사항")


class CandidateDetailResponse(BaseModel):
    """지원자 상세 정보"""
    id: str = Field(..., description="지원자 ID")
    name: str = Field(..., description="지원자 이름")
    email: str = Field(..., description="이메일")
    title: str = Field(..., description="현재 직무")
    positionId: str = Field(..., description="지원 포지션 ID")
    positionTitle: str = Field(..., description="지원 포지션 제목")
    experienceYears: int = Field(..., description="경력 연수")
    experienceLabel: str = Field(..., description="경력 레이블")
    education: str = Field(..., description="학력")
    status: str = Field(..., description="지원 상태")
    score: int = Field(..., description="평가 점수")
    keywords: List[str] = Field(..., description="키워드")
    skills: List[str] = Field(..., description="기술 스택")
    recommendation: str = Field(..., description="추천 코멘트")
    sections: Dict[str, Any] = Field(..., description="상세 섹션")

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Request 스키마 (추후 확장용)
# ==========================================
class PositionCreate(BaseModel):
    """포지션 생성 요청"""
    title: str = Field(..., min_length=1, max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    required_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    min_years: Optional[int] = Field(None, ge=0)
    project_experience: Optional[str] = None
    status: str = Field(default="active")


class PositionUpdate(BaseModel):
    """포지션 수정 요청"""
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    required_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    min_years: Optional[int] = Field(None, ge=0)
    project_experience: Optional[str] = None
    status: Optional[str] = None


class ApplicantCreate(BaseModel):
    """지원자 생성 요청"""
    name: str = Field(..., min_length=1, max_length=100)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    position_id: int = Field(..., description="지원 포지션 ID")
    experience_years: Optional[int] = Field(None, ge=0)
    education: Optional[str] = Field(None, max_length=255)
    status: str = Field(default="pending")


class ApplicantUpdate(BaseModel):
    """지원자 수정 요청"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    experience_years: Optional[int] = Field(None, ge=0)
    education: Optional[str] = Field(None, max_length=255)
    status: Optional[str] = None
    score: Optional[int] = Field(None, ge=0, le=100)
# app/schemas/candidate_schema.py
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr


class CandidateBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    position: str
    experience_years: Optional[int] = None
    education: Optional[str] = None


class CandidateCreate(CandidateBase):
    pass


class CandidateResponse(CandidateBase):
    id: int
    status: str
    score: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CandidateDetailResponse(CandidateResponse):
    resume_summary: Optional[str] = None
    strengths: Optional[str] = None
    interview_questions: Optional[List[Dict[str, Any]]] = None
    skills_summary: Optional[Dict[str, Any]] = None
    work_experience: Optional[List[Dict[str, Any]]] = None
    top_tags: Optional[List[str]] = None
    file_name: Optional[str] = None


class CandidateListResponse(BaseModel):
    total: int
    candidates: List[CandidateResponse]


class UpdateStatusRequest(BaseModel):
    status: str


class QuestionRequest(BaseModel):
    resume_ids: List[int]
    question: str


class FeedbackRequest(BaseModel):
    qa_id: int
    is_good_case: bool
    rating: Optional[int] = None
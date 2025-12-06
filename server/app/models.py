# app/models.py
from sqlalchemy import Column, Integer, String, BigInteger, Text, Boolean, Float, TIMESTAMP, ForeignKey, Date, \
    UniqueConstraint, CheckConstraint, Index, DateTime
from sqlalchemy.dialects.postgresql import JSONB, ARRAY, UUID as PGUUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
import uuid

from app.db import Base


class UploadedFile(Base):
    """업로드된 파일 정보"""
    __tablename__ = "uploaded_file"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    file_type = Column(String(100))
    file_size = Column(BigInteger)
    storage_path = Column(Text, nullable=False)
    upload_status = Column(String(50), default='uploaded')
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationships
    resumes = relationship("Resume", back_populates="uploaded_file")


class Position(Base):
    """채용 포지션"""
    __tablename__ = "positions"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    title = Column(String(100), nullable=False, unique=True)
    department = Column(String(100))
    description = Column(Text)
    required_skills = Column(ARRAY(Text))
    preferred_skills = Column(ARRAY(Text))
    min_years = Column(Integer)
    project_experience = Column(Text)
    status = Column(String(50), default='active')
    applicant_count = Column(Integer, default=0)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationships
    applicants = relationship("Applicant", back_populates="position_rel")

    # Indexes
    __table_args__ = (
        Index('idx_positions_status', 'status'),
    )


class Applicant(Base):
    """지원자"""
    __tablename__ = "applicants"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255))
    phone = Column(String(50))
    position = Column(String(100), nullable=False)  # 현재 DB에 존재 (레거시)
    experience_years = Column(Integer)
    education = Column(String(255))
    status = Column(String(50), default='pending')
    score = Column(Integer)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    position_id = Column(BigInteger, ForeignKey('positions.id'))

    # Relationships
    resumes = relationship("Resume", back_populates="applicant", cascade="all, delete-orphan")
    position_rel = relationship("Position", back_populates="applicants")
    interviews = relationship("Interview", back_populates="applicant", cascade="all, delete-orphan")
    human_evaluations = relationship("HumanEvaluation", back_populates="applicant", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index('idx_applicants_position', 'position'),
        Index('idx_applicants_status', 'status'),
        Index('idx_applicants_score', 'score'),
        Index('idx_applicants_position_id', 'position_id'),
    )


class Resume(Base):
    """이력서"""
    __tablename__ = "resumes"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    applicant_id = Column(BigInteger, ForeignKey('applicants.id', ondelete='CASCADE'), nullable=False)
    uploaded_file_id = Column(BigInteger, ForeignKey('uploaded_file.id', ondelete='CASCADE'), nullable=False)
    extracted_text = Column(Text)
    processing_status = Column(String(50), default='pending')
    error_message = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationships
    applicant = relationship("Applicant", back_populates="resumes")
    uploaded_file = relationship("UploadedFile", back_populates="resumes")
    analysis = relationship("ResumeAnalysis", back_populates="resume", uselist=False, cascade="all, delete-orphan")
    qa_histories = relationship("QAHistory", back_populates="resume")

    # Indexes and Constraints
    __table_args__ = (
        UniqueConstraint('applicant_id', 'uploaded_file_id', name='_applicant_file_uc'),
        Index('idx_resumes_applicant', 'applicant_id'),
        Index('idx_resumes_status', 'processing_status'),
    )


class ResumeAnalysis(Base):
    """이력서 AI 분석 결과"""
    __tablename__ = "resume_analysis"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    resume_id = Column(BigInteger, ForeignKey('resumes.id', ondelete='CASCADE'), nullable=False, unique=True)
    summary = Column(Text)
    strengths = Column(Text)
    interview_questions = Column(JSONB)
    skills_summary = Column(JSONB)
    work_experience = Column(JSONB)
    education_info = Column(JSONB)
    top_tags = Column(ARRAY(Text))
    analyzed_at = Column(TIMESTAMP, server_default=func.now())
    analysis_version = Column(String(50))

    # Relationships
    resume = relationship("Resume", back_populates="analysis")

    # Indexes
    __table_args__ = (
        Index('idx_resume_analysis_resume', 'resume_id'),
    )


class Admin(Base):
    """관리자"""
    __tablename__ = "admins"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    role = Column(String(50), default='admin')
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    interviews = relationship("Interview", back_populates="admin")


class Interview(Base):
    """면접"""
    __tablename__ = "interviews"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    applicant_id = Column(BigInteger, ForeignKey('applicants.id', ondelete='CASCADE'), nullable=False)
    admin_id = Column(BigInteger, ForeignKey('admins.id'))
    status = Column(String(50), default='scheduled')
    scheduled_at = Column(TIMESTAMP)
    completed_at = Column(TIMESTAMP)
    interview_kit = Column(JSONB)
    notes = Column(Text)
    rating = Column(Integer)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationships
    applicant = relationship("Applicant", back_populates="interviews")
    admin = relationship("Admin", back_populates="interviews")

    # Indexes and Constraints
    __table_args__ = (
        CheckConstraint('rating >= 1 AND rating <= 5', name='interviews_rating_check'),
        Index('idx_interviews_applicant', 'applicant_id'),
        Index('idx_interviews_status', 'status'),
    )


class DashboardStats(Base):
    """대시보드 통계"""
    __tablename__ = "dashboard_stats"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    stat_date = Column(Date, nullable=False, unique=True)
    total_applicants = Column(Integer, default=0)
    applicants_by_position = Column(JSONB)
    applicants_by_status = Column(JSONB)
    avg_score = Column(Float)
    top_skills = Column(JSONB)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Indexes
    __table_args__ = (
        Index('idx_dashboard_date', 'stat_date', postgresql_ops={'stat_date': 'DESC'}),
    )


class VectorStore(Base):
    """벡터 저장소 (이력서 임베딩)"""
    __tablename__ = "vector_store"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doc_id = Column(Text, nullable=False)
    doc_name = Column(Text)
    chunk_index = Column(BigInteger)
    content = Column(Text)
    embedding = Column(Vector(768))
    meta_data = Column(JSONB)
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Indexes
    __table_args__ = (
        Index('ix_vector_store_doc_id', 'doc_id'),
    )


class QAHistory(Base):
    """이력서 질의응답 히스토리"""
    __tablename__ = "qa_history"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    resume_id = Column(BigInteger, ForeignKey('resumes.id', ondelete='CASCADE'), nullable=False)
    admin_id = Column(BigInteger)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    retrieved_chunks = Column(ARRAY(Text))
    relevance_score = Column(Float)
    feedback_rating = Column(Integer)
    is_good_case = Column(Boolean, default=None)
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    resume = relationship("Resume", back_populates="qa_histories")
    good_case_vector = relationship("GoodCaseVector", back_populates="qa", uselist=False)

    # Indexes and Constraints
    __table_args__ = (
        CheckConstraint('feedback_rating >= 1 AND feedback_rating <= 5', name='qa_history_feedback_rating_check'),
        Index('idx_qa_history_resume', 'resume_id'),
        Index('idx_qa_history_good_case', 'is_good_case', postgresql_where='is_good_case = true'),
        Index('idx_qa_history_created', 'created_at', postgresql_ops={'created_at': 'DESC'}),
    )


class GoodCaseVector(Base):
    """우수 질의응답 벡터"""
    __tablename__ = "good_case_vectors"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    qa_id = Column(BigInteger, ForeignKey('qa_history.id', ondelete='CASCADE'), nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    context = Column(Text)
    embedding = Column(Text)
    meta_data = Column(JSONB)
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    qa = relationship("QAHistory", back_populates="good_case_vector")


class LangchainPgCollection(Base):
    """Langchain PostgreSQL 컬렉션"""
    __tablename__ = "langchain_pg_collection"

    uuid = Column(PGUUID(as_uuid=True), primary_key=True, nullable=False)
    name = Column(String, nullable=False, unique=True)
    cmetadata = Column(JSONB)

    # Relationships
    embeddings = relationship("LangchainPgEmbedding", back_populates="collection", cascade="all, delete-orphan")


class LangchainPgEmbedding(Base):
    """Langchain PostgreSQL 임베딩"""
    __tablename__ = "langchain_pg_embedding"

    id = Column(String, primary_key=True, nullable=False)
    collection_id = Column(PGUUID(as_uuid=True), ForeignKey('langchain_pg_collection.uuid', ondelete='CASCADE'))
    embedding = Column(Vector)
    document = Column(String)
    cmetadata = Column(JSONB)

    # Relationships
    collection = relationship("LangchainPgCollection", back_populates="embeddings")

    # Indexes
    __table_args__ = (
        Index('ix_cmetadata_gin', 'cmetadata', postgresql_using='gin', postgresql_ops={'cmetadata': 'jsonb_path_ops'}),
    )

class HumanEvaluation(Base):
    __tablename__ = "human_evaluations"

    id = Column(BigInteger, primary_key=True, index=True)
    applicant_id = Column(BigInteger, ForeignKey("applicants.id", ondelete="CASCADE"), nullable=False)
    evaluator = Column(String(100), nullable=False, default='평가자')
    score = Column(Integer, nullable=False)
    recommendation = Column(String(50))
    feedback = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship
    applicant = relationship("Applicant", back_populates="human_evaluations")
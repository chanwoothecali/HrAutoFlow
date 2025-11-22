# app/models.py
from sqlalchemy import Column, Integer, String, BigInteger, Text, Boolean, Float, TIMESTAMP, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB, ARRAY, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
import uuid

from app.db import Base


class UploadedFile(Base):
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

    # Relationship
    resumes = relationship("Resume", back_populates="uploaded_file")


class Position(Base):
    __tablename__ = "positions"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    title = Column(String(100), nullable=False, unique=True)
    description = Column(Text)
    required_skills = Column(ARRAY(Text))
    preferred_skills = Column(ARRAY(Text))
    status = Column(String(50), default='active')
    applicant_count = Column(Integer, default=0)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationships
    applicants = relationship("Applicant", back_populates="position_rel")


class Applicant(Base):
    __tablename__ = "applicants"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255))
    phone = Column(String(50))
    position = Column(String(100), nullable=False)
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


class Resume(Base):
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


class ResumeAnalysis(Base):
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


class VectorStore(Base):
    __tablename__ = "vector_store"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doc_id = Column(Text, nullable=False, index=True)
    doc_name = Column(Text)
    chunk_index = Column(BigInteger)
    content = Column(Text)
    embedding = Column(Vector(768))  # pgvector Vector type
    meta_data = Column(JSONB)  #  metadata → meta_data 로 변경
    created_at = Column(TIMESTAMP, server_default=func.now())


class QAHistory(Base):
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
    resume = relationship("Resume")


class GoodCaseVector(Base):
    __tablename__ = "good_case_vectors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    qa_id = Column(BigInteger, ForeignKey('qa_history.id', ondelete='CASCADE'), nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    context = Column(Text)
    embedding = Column(Text)  # pgvector Vector type
    meta_data = Column(JSONB)  #  metadata → meta_data 로 변경
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    qa = relationship("QAHistory")
# app/routers/upload_router.py
import shutil
import uuid
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Depends, Form
from sqlalchemy.orm import Session
from starlette.responses import JSONResponse

from app.db import get_db
from app.models import UploadedFile, Applicant, Resume, Position
from app.services.upload_service import upload_service
from app.services.candidate_service import candidate_service

router = APIRouter(prefix="/api/upload", tags=["Upload"])

UPLOAD_DIR = Path("storage")
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/")
async def upload_resume(
        file: UploadFile = File(...),
        name: str = Form(...),
        email: Optional[str] = Form(None),
        position: str = Form(...),
        phone: Optional[str] = Form(None),
        experience_years: Optional[int] = Form(None),
        education: Optional[str] = Form(None),
        background_tasks: BackgroundTasks = BackgroundTasks(),
        db: Session = Depends(get_db)
):
    """
    이력서 파일 업로드
    완전한 플로우:
    1. 파일 저장
    2. DB 저장 (uploaded_file, applicants, resumes)
    3. 백그라운드 파이프라인 실행 (텍스트 추출 → 분할 → 임베딩 → Vector DB 저장 → 분석)
    """

    try:
        # 1. 파일 검증
        if not upload_service.validate_file(file.filename):
            raise HTTPException(
                status_code=400,
                detail="허용되지 않는 파일 형식입니다. (pdf, docx, txt, md, jpg, png만 가능)"
            )

        # 2. 파일 저장
        file_ext = Path(file.filename).suffix.lower()
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = UPLOAD_DIR / unique_filename

        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_size = file_path.stat().st_size

        print(f"[Upload] 파일 저장 완료: {file_path}")

        # 3. DB 저장 - uploaded_file 테이블
        uploaded_file = UploadedFile(
            original_filename=file.filename,
            stored_filename=unique_filename,
            file_type=file.content_type,
            file_size=file_size,
            storage_path=str(file_path),
            upload_status="uploaded"
        )
        db.add(uploaded_file)
        db.flush()  # ID 생성을 위해

        print(f"[Upload] uploaded_file 저장: id={uploaded_file.id}")

        # 4. Position 찾기 또는 생성
        position_obj = db.query(Position).filter(Position.title == position).first()
        if not position_obj:
            position_obj = Position(title=position, status='active')
            db.add(position_obj)
            db.flush()

        # 5. DB 저장 - applicants 테이블
        applicant = Applicant(
            name=name,
            email=email,
            phone=phone,
            position=position,
            position_id=position_obj.id,
            experience_years=experience_years,
            education=education,
            status="pending",
            score=None  # 분석 후 계산
        )
        db.add(applicant)
        db.flush()

        print(f"[Upload] applicant 저장: id={applicant.id}")

        # 6. DB 저장 - resumes 테이블
        resume = Resume(
            applicant_id=applicant.id,
            uploaded_file_id=uploaded_file.id,
            processing_status="pending"
        )
        db.add(resume)
        db.commit()
        db.refresh(resume)

        print(f"[Upload] resume 저장: id={resume.id}")

        # 7. 백그라운드 작업 - 이력서 처리 파이프라인 실행
        # ⭐ 여기서 텍스트 추출 → 분할 → 임베딩 → Vector DB 저장이 일어남
        background_tasks.add_task(
            candidate_service.process_resume_pipeline,
            resume_id=resume.id,
            file_path=str(file_path),
            position=position,
            db=db
        )

        return JSONResponse(content={
            "success": True,
            "message": "파일 업로드 성공. 백그라운드에서 분석 중입니다.",
            "applicant_id": applicant.id,
            "resume_id": resume.id,
            "uploaded_file_id": uploaded_file.id,
            "filename": file.filename,
            "file_size": file_size,
            "processing_status": "pending"
        })

    except Exception as e:
        db.rollback()
        print(f"[Upload] 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{resume_id}")
async def get_processing_status(resume_id: int, db: Session = Depends(get_db)):
    """이력서 처리 상태 조회"""

    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="이력서를 찾을 수 없습니다.")

    return {
        "resume_id": resume.id,
        "processing_status": resume.processing_status,
        "error_message": resume.error_message,
        "extracted_text_length": len(resume.extracted_text) if resume.extracted_text else 0
    }
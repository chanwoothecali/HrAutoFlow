import shutil
import uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from starlette.responses import JSONResponse

router = APIRouter()
UPLOAD_DIR = Path("storage")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        # 파일 확장자 검증 (선택사항)
        allowed_extensions = {".pdf", ".txt", ".docx", ".md", ".jpg", ".jpeg", ".png", ".gif", ".png"}
        file_ext = Path(file.filename).suffix.lower()

        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"허용되지 않는 파일 형식입니다. 허용: {allowed_extensions}"
            )

        # 고유한 파일명 생성 (UUID 사용)
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = UPLOAD_DIR / unique_filename

        # 파일 저장
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 서버에 파일저장 성공시

        # 나중에 DB에 저장할 정보 반환
        return JSONResponse(content={
            "success": True,
            "filename": file.filename,  # 원본 파일명
            "saved_filename": unique_filename,  # 저장된 파일명
            "file_path": str(file_path),  # 전체 경로
            "file_size": file_path.stat().st_size,  # 파일 크기
            "content_type": file.content_type
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
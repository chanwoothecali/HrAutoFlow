# app/services/upload_service.py
from pathlib import Path
from typing import Optional
from PIL import Image
import pytesseract
import pypdf
from docx import Document as DocxDocument

# 추후 test에 있는 upstage로 변경예정
class UploadService:

    @staticmethod
    async def extract_text_from_file(file_path: str) -> str:
        """파일에서 텍스트 추출"""
        file_path = Path(file_path)
        extension = file_path.suffix.lower()

        try:
            if extension == '.pdf':
                return UploadService._extract_from_pdf(file_path)
            elif extension == '.docx':
                return UploadService._extract_from_docx(file_path)
            elif extension in ['.txt', '.md']:
                return UploadService._extract_from_text(file_path)
            elif extension in ['.jpg', '.jpeg', '.png']:
                return UploadService._extract_from_image(file_path)
            else:
                raise ValueError(f"지원하지 않는 파일 형식: {extension}")

        except Exception as e:
            raise Exception(f"텍스트 추출 실패: {str(e)}")

    @staticmethod
    def _extract_from_pdf(file_path: Path) -> str:
        """PDF에서 텍스트 추출"""
        text = ""
        try:
            with open(file_path, 'rb') as f:
                pdf_reader = pypdf.PdfReader(f)
                for page in pdf_reader.pages:
                    extracted = page.extract_text()
                    if extracted:
                        text += extracted + "\n"
        except Exception as e:
            raise Exception(f"PDF 추출 실패: {e}")

        return text.strip()

    @staticmethod
    def _extract_from_docx(file_path: Path) -> str:
        """DOCX에서 텍스트 추출"""
        try:
            doc = DocxDocument(file_path)
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            return text.strip()
        except Exception as e:
            raise Exception(f"DOCX 추출 실패: {e}")

    @staticmethod
    def _extract_from_text(file_path: Path) -> str:
        """텍스트 파일 읽기"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read().strip()
        except Exception as e:
            raise Exception(f"텍스트 파일 읽기 실패: {e}")

    @staticmethod
    def _extract_from_image(file_path: Path) -> str:
        """이미지에서 OCR로 텍스트 추출"""
        try:
            image = Image.open(file_path)
            text = pytesseract.image_to_string(image, lang='eng+kor')
            return text.strip()
        except Exception as e:
            raise Exception(f"OCR 추출 실패: {e}")

    @staticmethod
    def validate_file(filename: str, max_size_mb: int = 10) -> bool:
        """파일 검증"""
        allowed_extensions = {'.pdf', '.txt', '.docx', '.md', '.jpg', '.jpeg', '.png'}
        extension = Path(filename).suffix.lower()
        return extension in allowed_extensions


upload_service = UploadService()
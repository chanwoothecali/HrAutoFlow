# app/services/upload_service.py
from pathlib import Path
from typing import Optional
from PIL import Image
import pytesseract
import pypdf
from docx import Document as DocxDocument
import requests
import os
from bs4 import BeautifulSoup


class UploadService:

    @staticmethod
    async def extract_text_from_file(file_path: str, use_upstage: bool = True) -> str:
        """
        파일에서 텍스트 추출

        Args:
            file_path: 파일 경로
            use_upstage: True면 Upstage API 사용, False면 기본 파서 사용
        """
        file_path = Path(file_path)
        extension = file_path.suffix.lower()

        try:
            # Upstage API 사용 (모든 파일 형식 지원)
            if use_upstage:
                return UploadService._extract_from_files_with_upstage(str(file_path))

            # 기본 파서 사용 (확장자별 분기)
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
    def _extract_from_files_with_upstage(file_path: str) -> str:
        """
        Upstage Document Parse API를 사용한 파일 파싱
        모든 파일 형식 호환 가능 (PDF, DOCX, 이미지 등)
        """
        try:
            # 환경 변수에서 API 키 가져오기
            from app.config import settings
            UPSTAGE_API_KEY = settings.UPSTAGE_API_KEY

            if not UPSTAGE_API_KEY:
                raise ValueError("UPSTAGE_API_KEY가 설정되지 않았습니다.")

            # Upstage Document Digitization API 엔드포인트
            DOCUMENT_URL = "https://api.upstage.ai/v1/document-digitization"

            # API 요청 헤더 및 데이터 준비
            headers = {"Authorization": f"Bearer {UPSTAGE_API_KEY}"}

            with open(file_path, "rb") as f:
                files = {"document": f}
                data = {"model": "document-parse"}

                # API 요청
                response = requests.post(
                    DOCUMENT_URL,
                    headers=headers,
                    files=files,
                    data=data,
                    timeout=60  # 타임아웃 60초
                )

            # 응답 확인
            if response.status_code != 200:
                raise Exception(f"Upstage API 오류: {response.status_code} - {response.text}")

            result = response.json()

            # HTML 콘텐츠 추출
            html_content = result.get("content", {}).get("html", "")

            if not html_content:
                raise Exception("Upstage API에서 콘텐츠를 추출할 수 없습니다.")

            # HTML 태그 제거 후 순수 텍스트 추출
            soup = BeautifulSoup(html_content, "html.parser")
            clean_text = soup.get_text(separator="\n").strip()

            return clean_text

        except requests.exceptions.Timeout:
            raise Exception("Upstage API 요청 시간 초과")
        except requests.exceptions.RequestException as e:
            raise Exception(f"Upstage API 요청 실패: {str(e)}")
        except Exception as e:
            raise Exception(f"Upstage 파싱 실패: {str(e)}")

    @staticmethod
    def validate_file(filename: str, max_size_mb: int = 10) -> bool:
        """파일 검증"""
        allowed_extensions = {'.pdf', '.txt', '.docx', '.md', '.jpg', '.jpeg', '.png'}
        extension = Path(filename).suffix.lower()
        return extension in allowed_extensions


upload_service = UploadService()
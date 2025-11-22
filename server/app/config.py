# app/config.py
from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional
from urllib.parse import quote_plus


class Settings(BaseSettings):
    # Database
    DB_USER: str = "postgres"
    DB_PASSWORD: str
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "postgres"

    # Ollama
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3"

    # API Keys
    UPSTAGE_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"  # 또는 "gpt-4", "gpt-3.5-turbo"

    # LLM Provider 선택 추가
    LLM_PROVIDER: str = "ollama"  # "ollama" 또는 "openai"

    # LangSmith
    LANGSMITH_TRACING: Optional[str] = None
    LANGSMITH_ENDPOINT: Optional[str] = None
    LANGSMITH_API_KEY: Optional[str] = None
    LANGSMITH_PROJECT: Optional[str] = None

    # App
    APP_NAME: str = "HR AutoFlow"
    DEBUG: bool = False

    @property
    def database_url(self) -> str:
        """
        DATABASE_URL 생성 (비밀번호 특수문자 자동 인코딩)
        """
        # 비밀번호에 특수문자가 있을 경우 URL 인코딩
        encoded_password = quote_plus(self.DB_PASSWORD)
        encoded_user = quote_plus(self.DB_USER)

        url = f"postgresql+psycopg2://{encoded_user}:{encoded_password}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

        return url

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()

#  초기화 시 비밀번호 인코딩 확인 (디버깅용)
if __name__ == "__main__":
    print(f"DB_PASSWORD (원본): {settings.DB_PASSWORD}")
    print(f"DB_PASSWORD (인코딩): {quote_plus(settings.DB_PASSWORD)}")
    print(f"DATABASE_URL: {settings.database_url}")
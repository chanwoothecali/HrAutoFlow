from fastapi import FastAPI, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from starlette.middleware.cors import CORSMiddleware
from app.db import get_db

from app.routers import llm_router

app = FastAPI(title="HrAutoFlow LLM API")

# CORS 설정
origins = [
    "http://localhost:3000",  # Next.js dev 서버
    # 필요하면 "*"로 전체 허용 가능, 하지만 개발 환경에서만 권장
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      # 허용할 도메인
    allow_credentials=True,
    allow_methods=["*"],        # GET, POST 등 모두 허용
    allow_headers=["*"],        # 헤더 모두 허용
)

# 라우터 등록
app.include_router(llm_router.router, prefix="/llm", tags=["LLM"])

@app.get("/")
def read_root():
    return {"message": "Welcome to HrAutoFlow API"}

@app.get("/test-db")
def test_db(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT 1")).fetchone()
    return {"result": result[0]}
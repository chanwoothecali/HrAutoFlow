# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import upload_router, llm_router, position_router

app = FastAPI(
    title="HR AutoFlow API",
    description="AI 기반 이력서 분석 시스템 (langchain_ollama + Llama3)",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js
        "http://localhost:3001",  # Mock API (개발용)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(upload_router.router)
app.include_router(position_router.router)
app.include_router(llm_router.router)


@app.get("/")
async def root():
    return {
        "message": "HR AutoFlow API",
        "version": "1.0.0",
        "llm": "Ollama Llama3",
        "framework": "langchain_ollama",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
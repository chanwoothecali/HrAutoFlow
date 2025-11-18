# HrAutoFlow Server

FastAPI + LangChain 프로젝트

🚀 설치 및 실행사전 요구사항
Python 3.11+
Docker & Docker Compose
Poetry
Ollama
1. 저장소 클론bashgit clone https://github.com/your-repo/HrAutoFlow.git
cd HrAutoFlow/server2. Poetry 설치 및 의존성 설치bash# Poetry 설치 (없는 경우)
curl -sSL https://install.python-poetry.org | python3 -

# 의존성 설치
poetry install3. PostgreSQL + PGVector 실행bash# Docker로 PostgreSQL + PGVector 실행
docker run -d \
  --name pgvector \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=hr_autoflow \
  -p 5432:5432 \
  ankane/pgvector

# 실행 확인
docker ps | grep pgvector

# 접속 테스트
docker exec -it pgvector psql -U postgres -d hr_autoflow -c "SELECT version();"4. Ollama 설치 및 모델 다운로드bash# Ollama 설치 (macOS/Linux)
curl -fsSL https://ollama.com/install.sh | sh

# Ollama 서버 실행
ollama serve

# 별도 터미널에서 모델 다운로드
ollama pull llama3              # LLM 모델 (텍스트 생성)
ollama pull nomic-embed-text    # 임베딩 모델 (768-dim)

# 모델 확인
ollama list5. 환경 변수 설정bash# .env 파일 생성
cat > .env << 'EOF'
# Database
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hr_autoflow

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3

# API Keys (선택사항)
UPSTAGE_API_KEY=your_upstage_key
OPENAI_API_KEY=your_openai_key

# LangSmith (디버깅용, 선택사항)
LANGSMITH_TRACING=false
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
LANGSMITH_API_KEY=your_langsmith_key
LANGSMITH_PROJECT=hr-autoflow
EOF6. 데이터베이스 초기화bash# 테이블 생성
poetry run python -m app.init_db

# 또는 초기화 (모든 테이블 삭제 후 재생성)
poetry run python -m app.init_db reset

# 테이블 확인
docker exec -it pgvector psql -U postgres -d hr_autoflow -c "\dt"7. FastAPI 서버 실행bash# 개발 모드 (hot reload)
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 또는 직접 실행
poetry run python -m uvicorn app.main:app --reload서버 실행 후 접속:

API 문서: http://localhost:8000/docs
ReDoc: http://localhost:8000/redoc
Health Check: http://localhost:8000/health

🗄️ PostgreSQL + PGVector 실행 (SSH 환경)SSH 환경에서 백그라운드 실행bash# 1. SSH 접속
ssh your-username@your-server-ip

# 2. Docker 백그라운드로 PostgreSQL + PGVector 실행
docker run -d \
  --name pgvector \
  --restart unless-stopped \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=postgres \
  -p 5432:5432 \
  ankane/pgvector

# 3. 컨테이너 상태 확인
docker ps | grep pgvector

# 4. 로그 확인
docker logs pgvector

# 5. PostgreSQL 준비 상태 확인 (ready 될 때까지 대기)
docker exec pgvector pg_isready -U postgres

# 6. PGVector extension 설치 확인
docker exec -it pgvector psql -U postgres -d hr_autoflow -c "CREATE EXTENSION IF NOT EXISTS vector;"

# 7. 접속 테스트
docker exec -it pgvector psql -U postgres -d hr_autoflow -c "SELECT version();"
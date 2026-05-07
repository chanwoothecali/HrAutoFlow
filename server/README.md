# HrAutoFlow Server

`HrAutoFlow`의 FastAPI 백엔드 서버입니다. 이력서 업로드부터 텍스트 추출, 청킹, 임베딩 생성, PGVector 저장, LLM 분석, RAG 질의응답까지 이어지는 AI 이력서 분석 파이프라인을 담당합니다.

현재 서버는 Python 기반 AI PoC 역할을 하며, 이후 Spring Boot / Spring AI 기반 백엔드로 재구성할 때 비교 기준이 되는 구현체로 활용할 수 있습니다.

## 주요 기능

- PDF, DOCX, TXT, MD, 이미지 파일 업로드
- 이력서 텍스트 추출 및 전처리
- 텍스트 청킹 및 임베딩 생성
- PostgreSQL + PGVector 기반 벡터 저장
- Ollama Llama3 기반 이력서 요약, 강점 분석, 면접 질문 생성, 스킬 점수화
- 이력서 기반 RAG 질의응답
- 포지션, 지원자, 추천 지원자, 평가 데이터 조회 API

## 기술 스택

- Python 3.11+
- FastAPI
- SQLAlchemy
- PostgreSQL
- PGVector
- LangChain
- Ollama
- Pydantic
- Poetry

## 프로젝트 구조

```text
server/
├── app/
│   ├── main.py                 # FastAPI application entrypoint
│   ├── config.py               # environment configuration
│   ├── db.py                   # database session
│   ├── models.py               # SQLAlchemy models
│   ├── init_db.py              # database initialization
│   ├── routers/                # API routers
│   ├── schemas/                # request/response schemas
│   └── services/               # upload, candidate, llm services
├── test/                       # experiments and LoRA assets
├── pyproject.toml
└── README.md
```

## API 영역

- `GET /health`: 서버 상태 확인
- `POST /api/upload/`: 이력서 업로드 및 분석 파이프라인 시작
- `GET /api/upload/status/{resume_id}`: 이력서 처리 상태 조회
- `POST /api/llm/ask`: 이력서 기반 질의응답
- `POST /api/llm/feedback`: Q&A 피드백 저장
- `GET /api/stats/positions`: 포지션별 통계 조회
- `GET /api/positions`: 포지션 목록 조회
- `GET /api/positions/{position_id}/candidates`: 포지션별 지원자 조회
- `GET /api/candidates/recommended`: 추천 지원자 조회
- `GET /api/candidates/{candidate_id}`: 지원자 상세 조회
- `GET /api/evaluations`: 평가 내역 조회

## 실행 준비

### 1. 사전 요구사항

- Python 3.11+
- Poetry
- Docker
- Ollama

### 2. 의존성 설치

```bash
poetry install
```

### 3. PostgreSQL + PGVector 실행

```bash
docker run -d \
  --name pgvector \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=hr_autoflow \
  -p 5432:5432 \
  ankane/pgvector
```

PGVector extension을 활성화합니다.

```bash
docker exec -it pgvector psql -U postgres -d hr_autoflow \
  -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### 4. Ollama 모델 준비

```bash
ollama serve
ollama pull llama3
ollama pull nomic-embed-text
```

### 5. 환경 변수 설정

`server/.env` 파일을 생성합니다.

```env
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hr_autoflow

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
LLM_PROVIDER=ollama

UPSTAGE_API_KEY=
OPENAI_API_KEY=

LANGSMITH_TRACING=false
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
LANGSMITH_API_KEY=
LANGSMITH_PROJECT=hr-autoflow
```

### 6. 데이터베이스 초기화

```bash
poetry run python -m app.init_db
```

전체 테이블을 삭제하고 다시 생성하려면 아래 명령을 사용합니다.

```bash
poetry run python -m app.init_db reset
```

### 7. 서버 실행

```bash
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

실행 후 아래 주소에서 확인할 수 있습니다.

- API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- Health Check: [http://localhost:8000/health](http://localhost:8000/health)

## 처리 흐름

```text
Resume Upload
  -> Text Extraction
  -> Chunking
  -> Embedding
  -> PGVector Storage
  -> LLM Analysis
  -> Candidate Review / Resume Q&A
```

## 개선 방향

- 핵심 서비스 단위 테스트 및 API 통합 테스트 추가
- 업로드 이후 분석 파이프라인을 명시적인 비동기 작업 구조로 분리
- 실패 재시도, 상태 관리, 분석 로그 보강
- Docker Compose 기반 로컬 실행 환경 정리
- Spring Boot / Spring AI 기반 백엔드 재구성
- Kafka 또는 Redpanda 기반 이벤트 처리 파이프라인 실험

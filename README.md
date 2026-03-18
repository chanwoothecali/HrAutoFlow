# HrAutoFlow

AI 기반 채용 지원자 분석 시스템입니다.

이 프로젝트는 이력서 업로드부터 텍스트 추출, 임베딩 저장, LLM 기반 분석, 지원자 점수화, RAG 질의응답까지 이어지는 채용 보조 워크플로우를 목표로 합니다.

## Overview

`HrAutoFlow`는 채용 담당자가 여러 지원자의 이력서를 더 빠르게 검토할 수 있도록 만든 웹 애플리케이션입니다.

핵심 흐름:

1. 이력서 업로드
2. 텍스트 추출
3. 청킹 및 임베딩 생성
4. PGVector 저장
5. LLM 기반 요약, 강점 분석, 면접 질문 생성, 스킬 점수화
6. 지원자 상세 조회 및 이력서 Q&A

## Key Features

### 1. Resume upload and parsing

- PDF, DOCX, TXT, MD, JPG, PNG 업로드 지원
- Upstage Document Parse API 또는 기본 파서/OCR 기반 텍스트 추출
- 업로드 이후 백그라운드 파이프라인으로 분석 진행

### 2. AI resume analysis

- 이력서 요약 생성
- 핵심 강점 분석
- 면접 질문 자동 생성
- 기술 스택 추출 및 점수화
- 경력 정보 구조화

### 3. Vector search and resume Q&A

- 이력서 청크 임베딩을 PGVector에 저장
- 자연어 질문에 대해 관련 청크를 검색하는 RAG 기반 질의응답 제공

### 4. Candidate management

- 포지션별 지원자 조회
- 추천 지원자 목록 제공
- AI 분석 결과와 사람 평가를 함께 확인 가능

### 5. Local LLM experiment

- Ollama 기반 로컬 모델 연동
- 저장소 내 테스트 자산을 통해 LoRA 기반 튜닝 실험 흔적 보존

## Tech Stack

### Backend

- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- PGVector
- LangChain
- Ollama

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### AI / Parsing

- Ollama Llama3
- `nomic-embed-text`
- Upstage Document Parse API
- Tesseract OCR

## Project Structure

```text
HrAutoFlow/
├── client/   # Next.js frontend
├── server/   # FastAPI backend
└── README.md
```

### Backend highlights

- `server/app/services/upload_service.py`
  - 파일 검증 및 텍스트 추출
- `server/app/services/candidate_service.py`
  - 이력서 처리 파이프라인
- `server/app/services/llm_service.py`
  - 요약, 강점, 질문 생성, RAG 처리
- `server/app/models.py`
  - 지원자, 이력서, 분석 결과, 벡터 저장 구조 정의

### Frontend highlights

- `client/src/app/dashboard`
  - 대시보드
- `client/src/app/candidates`
  - 지원자 목록 및 상세 보기
- `client/src/components/candidates/ResumeQA.tsx`
  - 이력서 기반 Q&A UI
- `client/src/components/candidates/HumanEvaluation.tsx`
  - 사람 평가 UI

## Architecture

```text
Next.js Client
  -> Next.js API Routes
  -> FastAPI
  -> PostgreSQL / PGVector
  -> Ollama / Upstage
```

설명:

- 프론트엔드는 Next.js App Router 기반으로 구성되어 있습니다.
- 브라우저 요청은 먼저 Next.js API Route를 거쳐 FastAPI 백엔드로 전달됩니다.
- 백엔드는 이력서 메타데이터와 분석 결과를 PostgreSQL에 저장하고, 임베딩은 PGVector에 저장합니다.
- LLM 분석은 기본적으로 Ollama를 사용하며, 문서 파싱은 Upstage API를 사용할 수 있습니다.

## Getting Started

### 1. Clone

```bash
git clone <repo-url>
cd HrAutoFlow
```

### 2. Start PostgreSQL + PGVector

```bash
docker run -d \
  --name pgvector \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=hr_autoflow \
  -p 5432:5432 \
  ankane/pgvector
```

### 3. Start Ollama

```bash
ollama serve
ollama pull llama3
ollama pull nomic-embed-text
```

### 4. Run backend

```bash
cd server
poetry install
```

Create `.env` in `server/`:

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
```

Initialize DB:

```bash
poetry run python -m app.init_db
```

Start API server:

```bash
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Run frontend

```bash
cd client
npm install
npm run dev
```

If needed, set:

```env
FASTAPI_BASE_URL=http://localhost:8000/api
```

## Main API Areas

- `/api/upload`
  - 이력서 업로드 및 처리 상태 조회
- `/api/positions`
  - 포지션 목록 및 포지션별 지원자 조회
- `/api/candidates`
  - 지원자 상세 및 추천 지원자 조회
- `/api/llm/ask`
  - 이력서 기반 질의응답
- `/api/llm/feedback`
  - Q&A 피드백 저장

## Current Limitations

- LoRA 어댑터 실험 자산은 저장소에 포함되어 있지만, 현재 메인 서비스 코드에서 직접 서빙되지는 않습니다.
- 일부 프롬프트 및 스코어링 로직은 실험 성격이 강해 추가적인 검증이 필요합니다.
- 예외 처리, 테스트 코드, 배포 문서화는 더 보완할 여지가 있습니다.

## Documents

- [server/README.md](server/README.md)
- [client/README.md](client/README.md)
- `server/test/yujun/`
  - 학습 데이터 및 LoRA 실험 자산

## Purpose

이 프로젝트는 단순 이력서 저장 시스템이 아니라, LLM과 벡터 검색을 실제 HR 도메인에 적용해보는 학술/실험형 팀 프로젝트 성격을 함께 가집니다.

특히 다음 경험을 목표로 합니다.

- 로컬 LLM 활용
- HR 도메인에 맞는 프롬프트 설계
- 벡터 검색 기반 이력서 질의응답
- 백엔드 파이프라인과 AI 기능 통합

# LLM/RAG 통합 검증

이 폴더는 HR AutoFlow의 로컬 LLM/RAG 흐름을 백엔드 관점에서 검증하기 위한 문서와 스모크 테스트를 담고 있습니다.

목표는 모델 학습 자체가 아니라, Docker Compose 환경에서 서비스를 재현하고 데모 데이터를 주입한 뒤 API 기준으로 정상 동작을 확인하는 것입니다.

## 검증 범위

- Ollama 모델 설치 여부 확인
- FastAPI 헬스 체크 확인
- 시드 이력서 데이터 조회 확인
- `/api/llm/ask` 기반 RAG 질문 흐름 확인
- 로컬 LLM 응답 지연 시간과 운영상 주의점 기록

## 작성 목적

다른 실험 폴더가 노트북, LoRA 학습, 데이터 준비에 가깝다면 이 폴더는 서비스 통합 관점에 초점을 둡니다.

- Docker Compose 실행 환경
- 데모 시드 데이터
- Ollama 모델 의존성
- API 레벨 RAG 동작
- 졸업 프로젝트 데모 재현성

프로젝트 발표나 포트폴리오 녹화 전에 백엔드 담당자가 확인해야 하는 최소 검증 항목을 정리한 목적입니다.

## 사전 준비

로컬 스택을 실행합니다.

```bash
docker compose up --build
```

필요한 Ollama 모델을 내려받습니다.

```bash
docker compose exec ollama ollama pull llama3
docker compose exec ollama ollama pull nomic-embed-text
```

데모 데이터를 주입합니다.

```bash
docker compose exec server python -m app.seed_demo --with-embeddings
```

## 스모크 테스트

프로젝트 루트에서 실행합니다.

```bash
python server/test/chanwoo/rag_smoke_test.py
```

또는 서버 컨테이너 내부에서 실행합니다.

```bash
docker compose exec server python test/chanwoo/rag_smoke_test.py
```

기본값은 RAG 질문 1개만 실행합니다. 로컬 `llama3` 응답이 느릴 수 있기 때문입니다. 모든 데모 질문을 확인하려면 아래 명령을 사용합니다.

```bash
docker compose exec server python test/chanwoo/rag_smoke_test.py --all
```

스크립트는 다음 항목을 확인합니다.

- 서버 헬스 체크
- Ollama 모델 목록
- 채용 포지션 API
- 추천 후보자 API
- 샘플 질문 기반 RAG 질의 API

## 참고 사항

- 첫 Ollama 요청은 모델을 메모리에 올리는 과정 때문에 느릴 수 있습니다.
- `nomic-embed-text`는 임베딩과 RAG 검색에 필요합니다.
- `OLLAMA_MODEL`을 변경하지 않으면 답변 생성에는 `llama3`가 사용됩니다.
- 더 빠른 데모가 필요하면 더 작은 Ollama 모델을 실험할 수 있지만 답변 품질은 낮아질 수 있습니다.

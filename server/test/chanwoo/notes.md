# 로컬 LLM 통합 검증 노트

## 확인한 흐름

1. Docker Compose 서비스를 실행한다.
2. Ollama 모델을 내려받는다.
3. 임베딩을 포함한 데모 데이터를 주입한다.
4. 후보자 상세 페이지를 연다.
5. 이력서 내용 기반 질문을 입력한다.
6. 서버와 Ollama 로그에서 요청 흐름을 확인한다.

## 자주 발생한 오류

### `model "nomic-embed-text" not found`

원인:

- Ollama 컨테이너는 실행 중이지만 임베딩 모델이 아직 내려받아지지 않은 상태입니다.

해결:

```bash
docker compose exec ollama ollama pull nomic-embed-text
```

이후 모델 목록을 확인합니다.

```bash
docker compose exec ollama ollama list
```

## 응답 지연 관찰

로컬 LLM 응답은 느릴 수 있으며, 특히 Docker Desktop 내부에서 실행할 때 체감 지연이 커질 수 있습니다.

가능성이 높은 원인:

- 첫 요청에서 모델을 메모리에 적재한다.
- `llama3` 답변 생성은 임베딩보다 연산량이 크다.
- Docker 환경의 Ollama는 네이티브 Ollama보다 느릴 수 있다.
- CPU 기반 추론은 GPU 가속 추론보다 훨씬 느리다.

## 이력서에 안전하게 쓸 수 있는 표현

권장 표현:

- "Docker Compose 기반 데모 환경에서 로컬 LLM 의존성과 RAG API 동작을 검증"
- "AI 이력서 Q&A 흐름을 재현할 수 있도록 시드 데이터와 스모크 테스트 정리"
- "로컬 LLM 응답 지연을 관찰하고 데모 환경에서의 모델 크기별 trade-off 문서화"

피해야 할 표현:

- "LoRA 파인튜닝을 주도"
- "모델 성능을 개선"
- "파인튜닝 모델을 운영 환경에 배포"

이 폴더에서 방어 가능한 포지션은 모델 학습 소유권이 아니라 백엔드 통합, 재현성, 데모 검증입니다.

# HrAutoFlow Client

`HrAutoFlow`의 프론트엔드 애플리케이션입니다. 채용 담당자가 포지션별 지원자를 확인하고, 이력서를 업로드한 뒤 AI 분석 결과와 사람 평가를 함께 검토할 수 있는 화면을 제공합니다.

현재 클라이언트는 Next.js App Router 기반으로 구성되어 있으며, 브라우저에서 직접 FastAPI 서버를 호출하지 않고 Next.js API Routes를 통해 백엔드 요청을 중계합니다.

## 주요 기능

- 대시보드에서 포지션별 지원자 현황 확인
- 포지션, 지원자, 추천 지원자 목록 조회
- 이력서 업로드 및 처리 상태 확인
- AI 기반 이력서 요약, 강점 분석, 면접 질문, 스킬 점수 확인
- 지원자별 RAG 기반 이력서 질의응답
- 사람 평가 입력 및 평가 내역 조회

## 기술 스택

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Recharts
- Axios / Fetch API

## 프로젝트 구조

```text
client/
├── src/app/                 # Next.js App Router pages and API routes
├── src/app/api/             # FastAPI backend proxy routes
├── src/components/          # dashboard, candidates, evaluations UI
├── src/lib/api-client.ts    # frontend API client
├── src/types/               # shared frontend types
└── public/                  # static assets
```

## API 연동 구조

```text
Browser
  -> Next.js API Routes (/api/*)
  -> FastAPI Server (http://localhost:8000/api/*)
```

기본 백엔드 주소는 `http://localhost:8000/api`입니다. 필요한 경우 `.env.local`에 아래 값을 설정합니다.

```env
FASTAPI_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 실행 방법

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속합니다.

## 사용 가능한 스크립트

```bash
npm run dev      # 개발 서버 실행
npm run build    # 프로덕션 빌드
npm run start    # 빌드 결과 실행
npm run lint     # ESLint 검사
```

## 주요 화면

- `/dashboard`: 포지션 및 지원자 현황 대시보드
- `/positions`: 채용 포지션 관리
- `/candidates`: 지원자 목록 및 상세 조회
- `/evaluations`: 사람 평가 내역 조회
- `/applicants`: 지원자 등록 및 관리

## 개선 방향

- 공통 API 응답 타입 정리
- 업로드 및 분석 진행 상태 UI 개선
- 실패 상태, 재시도, 빈 상태 화면 보강
- E2E 테스트와 주요 사용자 흐름 테스트 추가
- Spring AI 기반 백엔드 전환 시 API 계약 문서화

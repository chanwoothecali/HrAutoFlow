# app/services/llm_service.py
from typing import List, Dict, Any, Optional
from langchain_ollama import OllamaLLM, OllamaEmbeddings
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate, PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_postgres import PGVector
from app.config import settings
import json
import re


class LLMService:
    def __init__(self):
        """langchain_ollama 기반 LLM 서비스 초기화"""

        if settings.LLM_PROVIDER == "openai":
            # OpenAI LLM
            self.llm = ChatOpenAI(
                model=settings.OPENAI_MODEL,
                temperature=0.7,
                api_key=settings.OPENAI_API_KEY,
                max_tokens=2000,
            )

            # Ollama Embeddings
            self.embeddings = OllamaEmbeddings(
                model="nomic-embed-text",
                base_url=settings.OLLAMA_BASE_URL,
            )

            print("OpenAI LLM 및 Embeddings 초기화 완료")

        else:  # ollama (기본값)
            # Ollama LLM
            self.llm = OllamaLLM(
                model=settings.OLLAMA_MODEL,
                temperature=0.3,  # 더 결정적인 출력을 위해 낮춤
                base_url=settings.OLLAMA_BASE_URL,
                num_predict=1024,  # 토큰 수 증가
            )

            # Ollama Embeddings
            self.embeddings = OllamaEmbeddings(
                model="nomic-embed-text",
                base_url=settings.OLLAMA_BASE_URL,
            )

            print("Ollama LLM 및 Embeddings 초기화 완료")

        # Text Splitter (공통)
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""]
        )

    def split_text(self, text: str, metadata: Dict[str, Any]) -> List[Document]:
        """텍스트를 청크로 분할"""
        chunks = self.text_splitter.split_text(text)

        documents = []
        for i, chunk in enumerate(chunks):
            doc = Document(
                page_content=chunk,
                metadata={
                    **metadata,
                    "chunk_index": i,
                    "total_chunks": len(chunks)
                }
            )
            documents.append(doc)

        return documents

    async def generate_summary(self, text: str) -> str:
        """이력서 요약 생성 - 강화된 프롬프트"""
        prompt = PromptTemplate(
            template="""# 역할
당신은 20년 경력의 HR 전문가이자 이력서 분석 전문가입니다.

# 작업
아래 이력서를 **3-4문장**으로 정확하고 간결하게 요약하세요.

# 분석 기준
1. **핵심 경력**: 주요 직무와 총 경력 기간
2. **기술 역량**: 보유한 핵심 기술 스택 (3-5개)
3. **주요 성과**: 정량적 성과나 대표 프로젝트
4. **차별점**: 이 지원자만의 강점

# 요약 형식
- 첫 문장: [이름]은(는) [총 경력]의 [주요 직무] 전문가입니다.
- 둘째 문장: [핵심 기술 스택]에 능숙하며...
- 셋째 문장: [주요 프로젝트/성과]를 달성했습니다.
- 넷째 문장: [차별화된 강점]을 보유하고 있습니다.

# 이력서 내용
{text}

# 요약 (한국어, 3-4문장, 명확하고 간결하게)
""",
            input_variables=["text"]
        )

        chain = prompt | self.llm | StrOutputParser()

        try:
            summary = await chain.ainvoke({"text": text[:4000]})

            # 불필요한 프리픽스 제거
            summary = summary.strip()
            summary = re.sub(r'^(요약:|Summary:)\s*', '', summary, flags=re.IGNORECASE)

            return summary
        except Exception as e:
            print(f"요약 생성 실패: {e}")
            return "이력서 요약 생성 중 오류가 발생했습니다."

    async def analyze_strengths(self, text: str) -> str:
        """강점 분석 - 강화된 프롬프트"""
        prompt = PromptTemplate(
            template="""# 역할
당신은 기술 인재 평가 전문가입니다. 20년간 수천 명의 개발자를 평가해왔습니다.

# 작업
아래 이력서를 분석하여 **3가지 핵심 강점**을 찾아내세요.

# 분석 기준
각 강점은 반드시 다음을 포함해야 합니다:
1. **구체적 근거**: 이력서에서 확인 가능한 사실
2. **정량적 지표**: 경력 기간, 프로젝트 수, 성과 등
3. **차별화 요소**: 다른 지원자와 구분되는 점

# 출력 형식
각 강점을 다음 형식으로 작성하세요:
• [강점 제목]: [구체적 설명 2-3줄, 근거 포함]

# 예시
• 풀스택 개발 역량: 5년간 React, Node.js, PostgreSQL을 활용한 10개 이상의 프로젝트를 성공적으로 완수했으며, 프론트엔드부터 백엔드, 데이터베이스까지 전 영역을 독립적으로 처리할 수 있습니다.

# 이력서 내용
{text}

# 3가지 핵심 강점 (한국어, 각 2-3줄, 구체적 근거 포함)
""",
            input_variables=["text"]
        )

        chain = prompt | self.llm | StrOutputParser()

        try:
            strengths = await chain.ainvoke({"text": text[:4000]})

            # 클린업
            strengths = strengths.strip()
            strengths = re.sub(r'^(강점:|Strengths:)\s*', '', strengths, flags=re.IGNORECASE)

            return strengths
        except Exception as e:
            print(f"강점 분석 실패: {e}")
            return "강점 분석 중 오류가 발생했습니다."

    async def generate_interview_questions(
            self,
            text: str,
            position: str
    ) -> List[Dict[str, str]]:
        """면접 질문 생성 - 강화된 프롬프트"""
        prompt = PromptTemplate(
            template="""# 역할
당신은 {position} 포지션의 면접관입니다. 지원자의 역량을 정확히 평가할 수 있는 질문을 만들어야 합니다.

# 작업
아래 이력서를 기반으로 **5개의 면접 질문**을 생성하세요.

# 질문 요구사항
1. **기술 질문 (2개)**: 이력서에 언급된 구체적 기술이나 프로젝트 관련
2. **경험 질문 (2개)**: 실제 경험과 문제 해결 능력 확인
3. **행동 질문 (1개)**: 협업, 리더십, 태도 관련

# 질문 난이도
- easy: 기본 지식이나 경험 확인
- medium: 실무 적용 능력 평가
- hard: 깊이 있는 이해도와 문제 해결 능력

# 이력서 내용
{text}

# 출력 형식
반드시 **유효한 JSON 배열만** 출력하세요. 다른 텍스트는 절대 포함하지 마세요.

[
    {{"question": "구체적인 질문 (한국어)", "category": "technical", "difficulty": "medium"}},
    {{"question": "구체적인 질문 (한국어)", "category": "technical", "difficulty": "hard"}},
    {{"question": "구체적인 질문 (한국어)", "category": "experience", "difficulty": "medium"}},
    {{"question": "구체적인 질문 (한국어)", "category": "experience", "difficulty": "hard"}},
    {{"question": "구체적인 질문 (한국어)", "category": "behavioral", "difficulty": "medium"}}
]

# 예시 (참고용)
[
    {{"question": "이력서에 언급된 FastAPI 프로젝트에서 가장 어려웠던 성능 최적화 경험을 구체적으로 설명해주세요.", "category": "technical", "difficulty": "hard"}},
    {{"question": "PostgreSQL과 Redis를 함께 사용하셨다고 했는데, 각각 어떤 용도로 활용하셨나요?", "category": "technical", "difficulty": "medium"}},
    {{"question": "프로젝트 일정이 촉박한 상황에서 예상치 못한 기술적 문제가 발생했을 때 어떻게 대처하셨나요?", "category": "experience", "difficulty": "medium"}},
    {{"question": "주니어 개발자와 함께 작업할 때 코드 리뷰를 어떻게 진행하셨나요? 구체적인 예시를 들어주세요.", "category": "experience", "difficulty": "hard"}},
    {{"question": "팀원과 기술적 의견 충돌이 있었던 경험과 해결 과정을 말씀해주세요.", "category": "behavioral", "difficulty": "medium"}}
]

# JSON 출력 (다른 텍스트 없이 JSON만)
""",
            input_variables=["text", "position"]
        )

        chain = prompt | self.llm | StrOutputParser()

        try:
            result = await chain.ainvoke({"text": text[:4000], "position": position})

            # JSON 추출 (마크다운 코드블록 제거)
            result = result.strip()
            result = re.sub(r'```json\s*', '', result)
            result = re.sub(r'```\s*', '', result)

            # JSON 파싱
            json_match = re.search(r'\[.*\]', result, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                questions = json.loads(json_str)

                # 유효성 검증
                if len(questions) >= 5:
                    return questions[:5]
                else:
                    return self._get_default_questions(position)
            else:
                return self._get_default_questions(position)

        except Exception as e:
            print(f"면접 질문 생성 실패: {e}")
            return self._get_default_questions(position)

    def _get_default_questions(self, position: str) -> List[Dict[str, str]]:
        """기본 면접 질문 - 개선된 버전"""
        return [
            {
                "question": f"{position} 포지션에 지원하신 이유와 이 직무에서 이루고 싶은 목표를 구체적으로 말씀해주세요.",
                "category": "behavioral",
                "difficulty": "easy"
            },
            {
                "question": "가장 기술적으로 도전적이었던 프로젝트 경험을 선택해서, 문제 상황, 해결 과정, 결과를 단계별로 설명해주세요.",
                "category": "experience",
                "difficulty": "hard"
            },
            {
                "question": "최근 학습한 기술이나 도구가 있다면, 왜 배우게 되었고 어떻게 활용하고 있는지 말씀해주세요.",
                "category": "technical",
                "difficulty": "medium"
            },
            {
                "question": "프로젝트 데드라인이 촉박한 상황에서 예상치 못한 버그가 발생했을 때, 어떤 우선순위로 문제를 해결하시나요?",
                "category": "experience",
                "difficulty": "medium"
            },
            {
                "question": "동료와 기술적 의견이 충돌했던 경험이 있다면, 어떻게 합의점을 찾으셨는지 구체적으로 설명해주세요.",
                "category": "behavioral",
                "difficulty": "medium"
            }
        ]

    async def extract_skills(self, text: str) -> Dict[str, int]:
        """스킬 추출 및 점수화 - 강화된 프롬프트"""
        prompt = PromptTemplate(
            template="""# 역할
당신은 기술 스택 평가 전문가입니다. 이력서에서 기술 역량을 정확히 분석해야 합니다.

# 작업
아래 이력서에서 **기술 스킬**을 추출하고 숙련도를 평가하세요.

# 분석 기준
각 기술의 점수(0-100)는 다음을 고려하여 책정:
1. **사용 기간**: 언급된 경력 기간
2. **프로젝트 수**: 해당 기술을 사용한 프로젝트 개수
3. **깊이**: 단순 사용 vs 심화 활용 (최적화, 아키텍처 설계 등)
4. **최신성**: 최근에도 사용 중인지

# 점수 가이드
- 90-100점: 5년 이상, 전문가 수준, 다수 프로젝트, 최신 활용
- 80-89점: 3-5년, 능숙, 여러 프로젝트
- 70-79점: 2-3년, 실무 가능
- 60-69점: 1-2년, 기본 활용
- 50-59점: 1년 미만, 학습 중

# 이력서 내용
{text}

# 출력 형식
반드시 **유효한 JSON 객체만** 출력하세요. 다른 텍스트는 절대 포함하지 마세요.

{{"Python": 90, "FastAPI": 85, "PostgreSQL": 80, "Docker": 75, "AWS": 70, "React": 65}}

# 주의사항
- 프로그래밍 언어, 프레임워크, 데이터베이스, 도구 등만 포함
- 소프트 스킬(커뮤니케이션 등)은 제외
- 이력서에 명시된 기술만 포함 (추측 금지)
- 최소 3개, 최대 15개 기술
- 점수는 반드시 정수 (0-100)

# JSON 출력 (다른 텍스트 없이 JSON만)
""",
            input_variables=["text"]
        )

        chain = prompt | self.llm | StrOutputParser()

        try:
            result = await chain.ainvoke({"text": text[:4000]})

            # JSON 추출
            result = result.strip()
            result = re.sub(r'```json\s*', '', result)
            result = re.sub(r'```\s*', '', result)

            json_match = re.search(r'\{.*\}', result, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                skills = json.loads(json_str)

                # 유효성 검증 (점수가 0-100 범위인지)
                validated_skills = {
                    k: min(100, max(0, v))
                    for k, v in skills.items()
                    if isinstance(v, (int, float))
                }

                return validated_skills
            else:
                return {}

        except Exception as e:
            print(f"스킬 추출 실패: {e}")
            return {}

    async def extract_work_experience(self, text: str) -> List[Dict[str, Any]]:
        """경력 추출 - 강화된 프롬프트"""
        prompt = PromptTemplate(
            template="""# 역할
당신은 경력 사항 분석 전문가입니다. 이력서에서 직무 경력을 정확히 추출해야 합니다.

# 작업
아래 이력서에서 **직무 경력**을 시간순으로 추출하세요.

# 추출 정보
각 경력마다 다음 정보를 포함:
1. **직책/포지션**: 정확한 직책명
2. **회사명**: 근무한 회사 또는 조직
3. **근무 기간**: "YYYY.MM - YYYY.MM" 또는 "YYYY.MM - Present" 형식
4. **주요 성과**: 구체적인 성과나 프로젝트 (2-5개)

# 이력서 내용
{text}

# 출력 형식
반드시 **유효한 JSON 배열만** 출력하세요. 다른 텍스트는 절대 포함하지 마세요.

[
    {{
        "title": "Senior Backend Engineer",
        "company": "테크컴퍼니",
        "period": "2022.03 - Present",
        "achievements": [
            "MSA 아키텍처 기반 주문 시스템 설계 및 구축 (일 10만 건 처리)",
            "FastAPI + PostgreSQL 조합으로 API 응답 속도 70% 개선",
            "Docker + Kubernetes 기반 CI/CD 파이프라인 구축"
        ]
    }},
    {{
        "title": "Backend Developer",
        "company": "스타트업",
        "period": "2020.01 - 2022.02",
        "achievements": [
            "Django 기반 관리자 시스템 개발 및 유지보수",
            "RESTful API 20개 이상 설계 및 구현",
            "MySQL 데이터베이스 쿼리 최적화로 조회 속도 50% 향상"
        ]
    }}
]

# 주의사항
- 최신 경력부터 시간순으로 나열
- 인턴, 프리랜서, 정규직 모두 포함
- 성과는 구체적이고 정량적으로 작성
- 이력서에 없는 정보는 추측하지 말 것

# JSON 출력 (다른 텍스트 없이 JSON만)
""",
            input_variables=["text"]
        )

        chain = prompt | self.llm | StrOutputParser()

        try:
            result = await chain.ainvoke({"text": text[:4000]})

            # JSON 추출
            result = result.strip()
            result = re.sub(r'```json\s*', '', result)
            result = re.sub(r'```\s*', '', result)

            json_match = re.search(r'\[.*\]', result, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                experiences = json.loads(json_str)
                return experiences
            else:
                return []

        except Exception as e:
            print(f"경력 추출 실패: {e}")
            return []

    def get_vectorstore(
            self,
            connection_string: str,
            collection_name: str = "resume_vectors"
    ) -> PGVector:
        """PGVector 초기화 (langchain_postgres 사용)

        Args:
            connection_string: Database connection string
            collection_name: Collection name for vectors
        """
        # Use synchronous psycopg2 connection for compatibility
        vectorstore = PGVector(
            embeddings=self.embeddings,
            collection_name=collection_name,
            connection=connection_string,
            use_jsonb=True,
        )
        return vectorstore

    async def rag_query(
            self,
            question: str,
            doc_id: str,
            k: int = 5,
            db_session = None
    ) -> Dict[str, Any]:
        """RAG 기반 질의응답 - 커스텀 VectorStore 사용

        Args:
            question: 질문
            doc_id: 문서 ID (예: resume_1)
            k: 검색할 문서 수
            db_session: Database session
        """

        try:
            from app.models import VectorStore
            import numpy as np

            # 질문 임베딩 생성
            question_embedding = self.embeddings.embed_query(question)

            # VectorStore에서 doc_id로 필터링하여 벡터 조회
            vectors = db_session.query(VectorStore).filter(
                VectorStore.doc_id == doc_id
            ).all()

            if not vectors:
                return {
                    "answer": "해당 이력서에서 관련된 정보를 찾을 수 없습니다.",
                    "chunks": [],
                    "relevance_score": 0.0
                }

            # 코사인 유사도 계산 및 정렬
            similarities = []
            for vec in vectors:
                # Skip if embedding is None or invalid
                if vec.embedding is None or len(vec.embedding) == 0:
                    continue

                try:
                    # 코사인 유사도 계산
                    vec_norm = np.linalg.norm(vec.embedding)
                    q_norm = np.linalg.norm(question_embedding)

                    if vec_norm == 0 or q_norm == 0:
                        continue

                    similarity = np.dot(question_embedding, vec.embedding) / (q_norm * vec_norm)
                    similarities.append((vec, similarity))
                except Exception as e:
                    print(f"[RAG] 유사도 계산 실패: {e}")
                    continue

            # 유사도 높은 순으로 정렬하고 상위 k개 선택
            similarities.sort(key=lambda x: x[1], reverse=True)
            top_docs = similarities[:k]

            if not top_docs:
                return {
                    "answer": "해당 이력서에서 관련된 정보를 찾을 수 없습니다.",
                    "chunks": [],
                    "relevance_score": 0.0
                }

            # Document 객체 생성
            from langchain_core.documents import Document
            docs = [Document(page_content=vec.content, metadata=vec.meta_data or {})
                   for vec, _ in top_docs]

            if not docs:
                return {
                    "answer": "해당 이력서에서 관련된 정보를 찾을 수 없습니다.",
                    "chunks": [],
                    "relevance_score": 0.0
                }

            # 컨텍스트 구성
            context = "\n\n".join([doc.page_content for doc in docs])

            # RAG 프롬프트 - 강화 버전
            prompt = ChatPromptTemplate.from_template(
                """# 역할
당신은 이력서 분석 전문가입니다. 주어진 이력서 정보를 바탕으로 정확하게 답변해야 합니다.

# 지침
1. **사실 기반 답변**: 아래 이력서 내용에만 근거하여 답변
2. **근거 명시**: 답변의 근거가 되는 부분을 언급
3. **정직한 답변**: 정보가 없으면 "이력서에 해당 정보가 없습니다"라고 답변
4. **구체적 답변**: 모호하지 않고 명확하게 답변
5. **한국어 답변**: 자연스러운 한국어로 작성

# 이력서 내용 (참고용)
{context}

# 질문
{question}

# 답변 (한국어, 2-4문장, 근거 포함)
""")

            chain = prompt | self.llm | StrOutputParser()
            answer = await chain.ainvoke({
                "context": context,
                "question": question
            })

            return {
                "answer": answer.strip(),
                "chunks": [doc.page_content for doc in docs],
                "relevance_score": 0.95
            }

        except Exception as e:
            print(f"RAG 쿼리 실패: {e}")
            return {
                "answer": f"답변 생성 중 오류가 발생했습니다: {str(e)}",
                "chunks": [],
                "relevance_score": 0.0
            }


# 싱글톤 인스턴스
llm_service = LLMService()
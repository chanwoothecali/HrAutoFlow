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
                max_tokens=2000,  # 최대 토큰 수
            )

            # # OpenAI Embeddings
            # self.embeddings = OpenAIEmbeddings(
            #     model="text-embedding-3-small",  # 또는 "text-embedding-ada-002"
            #     api_key=settings.OPENAI_API_KEY,
            # )

            # Ollama Embeddings
            self.embeddings = OllamaEmbeddings(
                model="nomic-embed-text",
                base_url=settings.OLLAMA_BASE_URL,
            )

            print("✅ OpenAI LLM 및 Embeddings 초기화 완료")

        else:  # ollama (기본값)
            # Ollama LLM (Llama3)
            self.llm = OllamaLLM(
                model=settings.OLLAMA_MODEL,
                temperature=0.7,
                base_url=settings.OLLAMA_BASE_URL,
                num_predict=512,
            )

            # Ollama Embeddings
            self.embeddings = OllamaEmbeddings(
                model="nomic-embed-text",
                base_url=settings.OLLAMA_BASE_URL,
            )

            print("✅ Ollama LLM 및 Embeddings 초기화 완료")

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
        """이력서 요약 생성"""
        prompt = PromptTemplate(
            template="""You are an expert HR analyst. Summarize the following resume in 3-4 concise sentences.
Focus on: key experience, technical skills, and main strengths.

Resume:
{text}

Summary (in Korean):""",
            input_variables=["text"]
        )

        chain = prompt | self.llm | StrOutputParser()

        try:
            summary = await chain.ainvoke({"text": text[:3000]})
            return summary.strip()
        except Exception as e:
            print(f"요약 생성 실패: {e}")
            return "이력서 요약 생성 중 오류가 발생했습니다."

    async def analyze_strengths(self, text: str) -> str:
        """강점 분석"""
        prompt = PromptTemplate(
            template="""Analyze the following resume and identify 3 main strengths.
Each strength should be backed by specific experience or achievements.

Resume:
{text}

Format (in Korean):
1. [첫 번째 강점]
2. [두 번째 강점]
3. [세 번째 강점]

Strengths:""",
            input_variables=["text"]
        )

        chain = prompt | self.llm | StrOutputParser()

        try:
            strengths = await chain.ainvoke({"text": text[:3000]})
            return strengths.strip()
        except Exception as e:
            print(f"강점 분석 실패: {e}")
            return "강점 분석 중 오류가 발생했습니다."

    async def generate_interview_questions(
            self,
            text: str,
            position: str
    ) -> List[Dict[str, str]]:
        """면접 질문 생성"""
        prompt = PromptTemplate(
            template="""Based on this resume and the position ({position}), generate 5 interview questions.

Resume:
{text}

Return ONLY a valid JSON array in this exact format:
[
    {{"question": "question text in Korean", "category": "technical", "difficulty": "medium"}},
    {{"question": "question text in Korean", "category": "behavioral", "difficulty": "easy"}},
    {{"question": "question text in Korean", "category": "experience", "difficulty": "hard"}},
    {{"question": "question text in Korean", "category": "technical", "difficulty": "medium"}},
    {{"question": "question text in Korean", "category": "behavioral", "difficulty": "medium"}}
]

JSON:""",
            input_variables=["text", "position"]
        )

        chain = prompt | self.llm | StrOutputParser()

        try:
            result = await chain.ainvoke({"text": text[:3000], "position": position})

            # JSON 추출
            json_match = re.search(r'\[.*\]', result, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                questions = json.loads(json_str)
                return questions
            else:
                return self._get_default_questions(position)

        except Exception as e:
            print(f"면접 질문 생성 실패: {e}")
            return self._get_default_questions(position)

    def _get_default_questions(self, position: str) -> List[Dict[str, str]]:
        """기본 면접 질문"""
        return [
            {
                "question": f"{position} 포지션에 지원하신 동기는 무엇인가요?",
                "category": "behavioral",
                "difficulty": "easy"
            },
            {
                "question": "가장 도전적이었던 프로젝트 경험을 공유해주세요.",
                "category": "experience",
                "difficulty": "medium"
            },
            {
                "question": "기술적으로 어려웠던 문제를 해결한 경험이 있나요?",
                "category": "technical",
                "difficulty": "hard"
            },
            {
                "question": "팀원들과 협업할 때 중요하게 생각하는 가치는?",
                "category": "behavioral",
                "difficulty": "medium"
            },
            {
                "question": "향후 5년간의 커리어 목표를 말씀해주세요.",
                "category": "behavioral",
                "difficulty": "easy"
            }
        ]

    async def extract_skills(self, text: str) -> Dict[str, int]:
        """스킬 추출 및 점수화"""
        prompt = PromptTemplate(
            template="""Extract technical skills from this resume and rate proficiency (0-100).

Resume:
{text}

Return ONLY a valid JSON object:
{{"Python": 90, "SQL": 85, "Docker": 75, "AWS": 70}}

JSON:""",
            input_variables=["text"]
        )

        chain = prompt | self.llm | StrOutputParser()

        try:
            result = await chain.ainvoke({"text": text[:3000]})

            # JSON 추출
            json_match = re.search(r'\{.*\}', result, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                skills = json.loads(json_str)
                return skills
            else:
                return {}

        except Exception as e:
            print(f"스킬 추출 실패: {e}")
            return {}

    async def extract_work_experience(self, text: str) -> List[Dict[str, Any]]:
        """경력 추출"""
        prompt = PromptTemplate(
            template="""Extract work experience from this resume.

Resume:
{text}

Return ONLY a valid JSON array:
[
    {{
        "title": "Backend Engineer",
        "company": "Company Name",
        "period": "2023.01 - Present",
        "achievements": ["achievement 1", "achievement 2"]
    }}
]

JSON:""",
            input_variables=["text"]
        )

        chain = prompt | self.llm | StrOutputParser()

        try:
            result = await chain.ainvoke({"text": text[:3000]})

            # JSON 추출
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
        """PGVector 초기화 (langchain_postgres 사용)"""
        vectorstore = PGVector(
            embeddings=self.embeddings,
            collection_name=collection_name,
            connection=connection_string,
            use_jsonb=True,
        )
        return vectorstore

    async def rag_query(
            self,
            vectorstore: PGVector,
            question: str,
            doc_id: str,
            k: int = 5
    ) -> Dict[str, Any]:
        """RAG 기반 질의응답"""

        try:
            # 유사도 검색
            retriever = vectorstore.as_retriever(
                search_type="similarity",
                search_kwargs={
                    "k": k,
                    "filter": {"doc_id": doc_id}
                }
            )

            # 관련 문서 검색
            docs = await retriever.ainvoke(question)

            if not docs:
                return {
                    "answer": "관련된 정보를 찾을 수 없습니다.",
                    "chunks": [],
                    "relevance_score": 0.0
                }

            # 컨텍스트 구성
            context = "\n\n".join([doc.page_content for doc in docs])

            # RAG 프롬프트
            prompt = ChatPromptTemplate.from_template(
                """Answer the question based on the following resume information.

Context:
{context}

Question: {question}

Answer (in Korean):"""
            )

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
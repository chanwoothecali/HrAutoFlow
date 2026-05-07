from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any


DEFAULT_API_BASE_URL = "http://localhost:8000"
DEFAULT_OLLAMA_BASE_URL = "http://localhost:11434"


def request_json(method: str, url: str, payload: dict[str, Any] | None = None, timeout: int = 120) -> Any:
    data = None
    headers = {"Content-Type": "application/json"}

    if payload is not None:
        data = json.dumps(payload).encode("utf-8")

    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(request, timeout=timeout) as response:
        body = response.read().decode("utf-8")
        return json.loads(body) if body else None


def timed(label: str, callback):
    start = time.perf_counter()
    try:
        result = callback()
    except urllib.error.HTTPError as exc:
        elapsed = time.perf_counter() - start
        body = exc.read().decode("utf-8")
        print(f"[실패] {label} HTTP {exc.code} ({elapsed:.2f}s)")
        print(body[:1000])
        raise
    except Exception as exc:
        elapsed = time.perf_counter() - start
        print(f"[실패] {label} {type(exc).__name__}: {exc} ({elapsed:.2f}s)")
        raise

    elapsed = time.perf_counter() - start
    print(f"[성공] {label} ({elapsed:.2f}s)")
    return result, elapsed


def load_questions() -> list[dict[str, Any]]:
    question_file = Path(__file__).with_name("demo_questions.json")
    return json.loads(question_file.read_text(encoding="utf-8"))


def assert_ollama_model(models: list[dict[str, Any]], model_name: str) -> None:
    names = {model.get("name", "").split(":")[0] for model in models}
    exact_names = {model.get("name", "") for model in models}
    if model_name not in names and model_name not in exact_names:
        available = ", ".join(sorted(exact_names)) or "없음"
        raise RuntimeError(f"Ollama 모델 '{model_name}'을 찾을 수 없습니다. 사용 가능한 모델: {available}")


def resolve_resume_ids(api_base_url: str, candidates: list[dict[str, Any]]) -> dict[str, int]:
    resume_ids: dict[str, int] = {}

    for candidate in candidates:
        detail = request_json("GET", f"{api_base_url}/api/candidates/{candidate['id']}", timeout=10)
        email = detail.get("email")
        resume_id = detail.get("resumeId")
        if email and resume_id:
            resume_ids[email] = int(resume_id)

    return resume_ids


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="HR AutoFlow 로컬 RAG 흐름을 스모크 테스트합니다.")
    parser.add_argument(
        "--all",
        action="store_true",
        help="모든 데모 질문을 실행합니다. 기본값은 빠른 확인을 위해 첫 번째 질문만 실행합니다.",
    )
    args = parser.parse_args()

    api_base_url = os.getenv("API_BASE_URL", DEFAULT_API_BASE_URL).rstrip("/")
    ollama_base_url = os.getenv("OLLAMA_BASE_URL", DEFAULT_OLLAMA_BASE_URL).rstrip("/")
    llm_model = os.getenv("OLLAMA_MODEL", "llama3")
    embedding_model = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")

    print("HR AutoFlow RAG 스모크 테스트")
    print(f"- API: {api_base_url}")
    print(f"- Ollama: {ollama_base_url}")
    print(f"- LLM 모델: {llm_model}")
    print(f"- 임베딩 모델: {embedding_model}")

    timed("FastAPI 헬스 체크", lambda: request_json("GET", f"{api_base_url}/health", timeout=10))

    ollama_tags, _ = timed("Ollama 모델 목록", lambda: request_json("GET", f"{ollama_base_url}/api/tags", timeout=10))
    models = ollama_tags.get("models", [])
    assert_ollama_model(models, llm_model)
    assert_ollama_model(models, embedding_model)

    positions, _ = timed("채용 포지션 API", lambda: request_json("GET", f"{api_base_url}/api/positions", timeout=10))
    print(f"  채용 포지션 수: {len(positions)}")

    candidates, _ = timed(
        "추천 후보자 API",
        lambda: request_json("GET", f"{api_base_url}/api/candidates/recommended?limit=10", timeout=10),
    )
    print(f"  추천 후보자 수: {len(candidates)}")

    resume_ids_by_email, _ = timed(
        "후보자 상세 이력서 ID 확인",
        lambda: resolve_resume_ids(api_base_url, candidates),
    )

    questions = load_questions()
    if not args.all:
        questions = questions[:1]

    total_elapsed = 0.0

    for item in questions:
        applicant_email = item["applicant_email"]
        resume_id = resume_ids_by_email.get(applicant_email)
        if resume_id is None:
            raise RuntimeError(f"{applicant_email}의 이력서 ID를 찾을 수 없습니다. app.seed_demo를 실행했는지 확인하세요.")

        payload = {
            "resume_ids": [resume_id],
            "question": item["question"],
        }
        response, elapsed = timed(
            f"RAG 질문: {item['label']}",
            lambda payload=payload: request_json("POST", f"{api_base_url}/api/llm/ask", payload=payload),
        )
        total_elapsed += elapsed
        answer = response["answers"][0]["answer"]
        relevance = response["answers"][0].get("relevance_score", 0)
        print(f"  관련도: {relevance}")
        print(f"  답변 미리보기: {answer[:180].replace(chr(10), ' ')}")

    average = total_elapsed / len(questions) if questions else 0
    print(f"평균 RAG 응답 시간: {average:.2f}s")


if __name__ == "__main__":
    main()

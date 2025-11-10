import requests
import json
import os
from dotenv import load_dotenv

# api key 로딩
load_dotenv()

# 환경 변수에서 API 키 로드
UPSTAGE_API_KEY = os.getenv("UPSTAGE_API_KEY")
API_URL = "https://api.upstage.ai/v1/chat/completions"
DOCUMENT_URL = "https://api.upstage.ai/v1/document-digitization"

def doc_invoke(filename):
    headers = {"Authorization": f"Bearer {UPSTAGE_API_KEY}"}
    files = {"document": open(filename, "rb")}
    data = {"ocr": "force", "base64_encoding": "['table']", "model": "document-parse"}
    response = requests.post(DOCUMENT_URL, headers=headers, files=files, data=data)
    return response.json()

# --- LangChain 'invoke' 스타일과 유사하게 수정된 함수 ---

def solar_invoke(prompt: str) -> str:
    """
    Upstage SOLAR 모델에 요청을 보내고 최종 응답 문자열을 반환합니다.
    (LangChain llm.invoke()와 유사한 사용 패턴)
    """
    if not UPSTAGE_API_KEY:
        print("Error: UPSTAGE_API_KEY not found in environment variables.")
        return "API Key Error"

    headers = {
        'Authorization': f'Bearer {UPSTAGE_API_KEY}',
        'Content-Type': 'application/json',
    }

    data = {
        "model": "solar-pro2",
        "messages": [
            {"role": "user", "content": prompt}
        ],
        # 'stream': False (스트리밍을 비활성화하고 최종 응답을 한 번에 받습니다)
    }

    try:
        # stream=False가 기본이므로, 한 번에 전체 응답을 받습니다.
        response = requests.post(
            API_URL,
            headers=headers,
            data=json.dumps(data)
        )

        # HTTP 에러 처리 (4xx 또는 5xx 상태 코드)
        response.raise_for_status()

        # JSON 응답 파싱
        result = response.json()

        # 응답 데이터에서 content 추출
        if result and 'choices' in result and result['choices']:
            # LangChain ChatMessage 객체 대신, content 문자열만 반환
            return result['choices'][0]['message']['content']
        else:
            return "Error: Could not parse model response."

    except requests.exceptions.HTTPError as err:
        print(f"HTTP Error occurred: {err}")
        print(f"Response Content: {response.text[:200]}...")  # 에러 내용 일부 출력
    except Exception as err:
        print(f"An unexpected error occurred: {err}")

    return "An error occurred during API call."

# --- 사용 예시 ---

# # LangChain 스타일:
# # llm = ChatOpenAI()
# # result = llm.invoke("프롬프트")

# # SOLAR 스타일:
# # llm = solar_invoke (함수 자체가 llm 객체의 invoke 역할을 합니다)
#
# print("--- SOLAR Invoke 테스트 ---")
# prompt_text = "안녕하세요. 저는 파이썬 개발자입니다. 저에게 맞는 재미있는 기술 질문 하나를 해주세요."
# final_answer = solar_invoke(prompt_text)
#
# print("\n[최종 SOLAR 응답]:")
# print(final_answer)

# # 참고: 기존의 스트리밍 로직을 다시 사용하고 싶다면, 이전의 `get_solar_response` 함수를 `solar_stream(prompt)`와 같이 별도의 함수로 유지하는 것이 좋습니다.
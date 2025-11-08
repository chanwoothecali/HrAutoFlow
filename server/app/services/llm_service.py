from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

# api key 로딩
load_dotenv()

# open ai chat 생성
llm = ChatOpenAI()

async def ask_llm(prompt: str) -> str:
    result = llm.invoke(prompt)
    return result
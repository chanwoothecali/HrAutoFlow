from fastapi import APIRouter
from pydantic import BaseModel
from app.services.llm_service import ask_llm

router = APIRouter()

class LLMRequest(BaseModel):
    prompt: str

class LLMResponse(BaseModel):
    answer: object

@router.post("/ask", response_model=LLMResponse)
async def ask_llm_endpoint(request: LLMRequest):
    answer = await ask_llm(request.prompt)
    return LLMResponse(answer=answer.content)



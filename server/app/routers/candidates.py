from fastapi import APIRouter
from pydantic import BaseModel
from app.services.llm_service import ask_llm

router = APIRouter()


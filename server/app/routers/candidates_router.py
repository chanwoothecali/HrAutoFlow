from typing import List

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

@router.get("/candidates",
            status_code=200,
            response_model=List[BaseModel],
            description="Get all candidates"
            )
async def get_candidates():
    return []

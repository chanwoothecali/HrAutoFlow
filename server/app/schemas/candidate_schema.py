from pydantic import BaseModel
from typing import List

class CandidateCreate(BaseModel):
    name: str
    email: str

class CandidateResponse(BaseModel):
    id: int
    name: str
    email: str
    file_path: str

class CandidateSearchResponse(BaseModel):
    id: int
    name: str
    email: str
    file_path: str
    distance: float
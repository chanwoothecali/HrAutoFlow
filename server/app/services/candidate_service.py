from sqlalchemy.orm import Session
from sqlalchemy import text
from pathlib import Path
import shutil
from langchain_openai import OpenAIEmbeddings
import os
from dotenv import load_dotenv

load_dotenv()
embeddings_model = OpenAIEmbeddings(openai_api_key=os.getenv("OPENAI_API_KEY"))
STORAGE_DIR = Path("storage")
STORAGE_DIR.mkdir(exist_ok=True)

def extract_text(file):
    content = file.file.read()
    if file.filename.endswith(".pdf"):
        images = convert_from_bytes(content)
        text_data = ""
        for img in images:
            text_data += pytesseract.image_to_string(img)
        return text_data
    else:
        img = Image.open(file.file)
        return pytesseract.image_to_string(img)

def save_candidate(db: Session, name: str, email: str, file):
    file_path = STORAGE_DIR / file.filename
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    text_data = extract_text(file)
    embedding = embeddings_model.embed_query(text_data)

    sql = text("""
        INSERT INTO candidates (name, email, file_path, embedding)
        VALUES (:name, :email, :file_path, :embedding)
        RETURNING id
    """)
    result = db.execute(sql, {"name": name, "email": email, "file_path": str(file_path), "embedding": embedding})
    db.commit()
    candidate_id = result.fetchone()[0]
    return candidate_id

def search_candidates(db: Session, prompt: str, limit: int = 5):
    query_vec = embeddings_model.embed_query(prompt)
    sql = text("""
        SELECT *, embedding <=> :vec as distance
        FROM candidates
        ORDER BY distance
        LIMIT :limit
    """)
    result = db.execute(sql, {"vec": query_vec, "limit": limit}).all()
    return result
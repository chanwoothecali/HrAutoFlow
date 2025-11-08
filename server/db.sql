-- candidates 테이블 생성
CREATE TABLE candidates (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    file_path TEXT NOT NULL,
    embedding VECTOR(1536) -- OpenAI Embedding 차원 예시
);
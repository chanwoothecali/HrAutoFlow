-- ============================================
-- 1. 기존 테이블 (수정 버전)
-- ============================================

-- 업로드된 파일 정보
CREATE TABLE uploaded_file (
    id                BIGSERIAL PRIMARY KEY,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename   VARCHAR(255) NOT NULL,
    file_type         VARCHAR(100),
    file_size         BIGINT,
    storage_path      TEXT NOT NULL,
    upload_status     VARCHAR(50) DEFAULT 'uploaded', -- uploaded, processing, completed, failed
    created_at        TIMESTAMP DEFAULT NOW(),
    updated_at        TIMESTAMP DEFAULT NOW()
);

-- Vector Store (PGVector)
CREATE TABLE vector_store (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    doc_id      TEXT NOT NULL,
    doc_name    TEXT,
    chunk_index BIGINT,
    content     TEXT,
    embedding   VECTOR(1536),
    metadata    JSONB,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_vector_store_embedding ON vector_store USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_vector_store_doc_id ON vector_store(doc_id);

-- ============================================
-- 2. 신규 테이블 (추가 필요)
-- ============================================

-- 지원자 정보
CREATE TABLE applicants (
    id               BIGSERIAL PRIMARY KEY,
    name             VARCHAR(100) NOT NULL,
    email            VARCHAR(255),
    phone            VARCHAR(50),
    position         VARCHAR(100) NOT NULL, -- Backend Developer, Data Engineer, etc.
    experience_years INT,
    education        VARCHAR(255),
    status           VARCHAR(50) DEFAULT 'pending', -- pending, in_review, interviewed, hired, rejected
    score            INT, -- 오른쪽 상단의 점수 (86, 92, 71, 84)
    created_at       TIMESTAMP DEFAULT NOW(),
    updated_at       TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_applicants_position ON applicants(position);
CREATE INDEX idx_applicants_status ON applicants(status);
CREATE INDEX idx_applicants_score ON applicants(score);

-- 이력서 정보 (uploaded_file과 applicants 연결)
CREATE TABLE resumes (
    id                  BIGSERIAL PRIMARY KEY,
    applicant_id        BIGINT NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
    uploaded_file_id    BIGINT NOT NULL REFERENCES uploaded_file(id) ON DELETE CASCADE,
    extracted_text      TEXT, -- Upstage로 추출한 원본 텍스트
    processing_status   VARCHAR(50) DEFAULT 'pending', -- pending, extracting, chunking, embedding, analyzing, completed, failed
    error_message       TEXT,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW(),
    UNIQUE(applicant_id, uploaded_file_id)
);

CREATE INDEX idx_resumes_applicant ON resumes(applicant_id);
CREATE INDEX idx_resumes_status ON resumes(processing_status);

-- 이력서 자동 분석 결과 (요약, 강점, 면접질문)
CREATE TABLE resume_analysis (
    id                    BIGSERIAL PRIMARY KEY,
    resume_id             BIGINT NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    summary               TEXT, -- 이력서 요약
    strengths             TEXT, -- 강점 분석
    interview_questions   JSONB, -- 면접 질문 리스트 [{"question": "...", "reason": "..."}]
    skills_summary        JSONB, -- Skills Summary 데이터 {"Python": 90, "SQL": 80, ...}
    work_experience       JSONB, -- Work Experience 구조화 데이터
    education_info        JSONB, -- Education 정보
    top_tags              TEXT[], -- Top Tags (Python, SQL, REST, Docker)
    analyzed_at           TIMESTAMP DEFAULT NOW(),
    analysis_version      VARCHAR(50), -- 분석 버전 관리
    UNIQUE(resume_id)
);

CREATE INDEX idx_resume_analysis_resume ON resume_analysis(resume_id);

-- Position 관리 (POSITIONS 섹션)
CREATE TABLE positions (
    id                BIGSERIAL PRIMARY KEY,
    title             VARCHAR(100) NOT NULL UNIQUE, -- Backend Developer, Data Engineer
    description       TEXT,
    required_skills   TEXT[], -- 필수 스킬
    preferred_skills  TEXT[], -- 우대 스킬
    status            VARCHAR(50) DEFAULT 'active', -- active, closed
    applicant_count   INT DEFAULT 0, -- 지원자 수
    created_at        TIMESTAMP DEFAULT NOW(),
    updated_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_positions_status ON positions(status);

-- Position과 Applicant 연결 (1 Position : N Applicants)
ALTER TABLE applicants
    ADD COLUMN position_id BIGINT REFERENCES positions(id);

CREATE INDEX idx_applicants_position_id ON applicants(position_id);

-- 관리자 Q&A 이력 (RAG 기반 질의응답)
CREATE TABLE qa_history (
    id            BIGSERIAL PRIMARY KEY,
    resume_id     BIGINT NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    admin_id      BIGINT, -- 관리자 ID (추후 admin 테이블과 연결)
    question      TEXT NOT NULL,
    answer        TEXT NOT NULL,
    retrieved_chunks TEXT[], -- RAG에서 검색된 chunk들
    relevance_score FLOAT, -- 유사도 검색 점수
    feedback_rating INT CHECK (feedback_rating >= 1 AND feedback_rating <= 5), -- 1-5 별점
    is_good_case  BOOLEAN DEFAULT NULL, -- Good case 여부
    created_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_qa_history_resume ON qa_history(resume_id);
CREATE INDEX idx_qa_history_good_case ON qa_history(is_good_case) WHERE is_good_case = true;
CREATE INDEX idx_qa_history_created ON qa_history(created_at DESC);

-- Good Case Vector Store (피드백 받은 좋은 QA를 저장)
CREATE TABLE good_case_vectors (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    qa_id       BIGINT NOT NULL REFERENCES qa_history(id) ON DELETE CASCADE,
    question    TEXT NOT NULL,
    answer      TEXT NOT NULL,
    context     TEXT, -- 원본 컨텍스트
    embedding   VECTOR(1536),
    metadata    JSONB, -- {"resume_id": 123, "position": "Backend Developer"}
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_good_case_embedding ON good_case_vectors USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_good_case_qa ON good_case_vectors(qa_id);

-- 관리자 정보 (추후 확장)
CREATE TABLE admins (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(255) UNIQUE NOT NULL,
    role       VARCHAR(50) DEFAULT 'admin', -- admin, hr_manager, interviewer
    created_at TIMESTAMP DEFAULT NOW()
);

-- 면접 진행 상태 관리 (Interview Kit 버튼 관련)
CREATE TABLE interviews (
    id            BIGSERIAL PRIMARY KEY,
    applicant_id  BIGINT NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
    admin_id      BIGINT REFERENCES admins(id),
    status        VARCHAR(50) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
    scheduled_at  TIMESTAMP,
    completed_at  TIMESTAMP,
    interview_kit JSONB, -- 생성된 면접 질문 및 자료
    notes         TEXT,
    rating        INT CHECK (rating >= 1 AND rating <= 5),
    created_at    TIMESTAMP DEFAULT NOW(),
    updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_interviews_applicant ON interviews(applicant_id);
CREATE INDEX idx_interviews_status ON interviews(status);

-- 대시보드 통계 (캐싱용)
CREATE TABLE dashboard_stats (
    id                    BIGSERIAL PRIMARY KEY,
    stat_date             DATE NOT NULL UNIQUE,
    total_applicants      INT DEFAULT 0,
    applicants_by_position JSONB, -- {"Backend Developer": 10, "Data Engineer": 7}
    applicants_by_status  JSONB, -- {"pending": 5, "in_review": 8, ...}
    avg_score             FLOAT,
    top_skills            JSONB, -- {"Python": 25, "SQL": 20, ...}
    created_at            TIMESTAMP DEFAULT NOW(),
    updated_at            TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dashboard_date ON dashboard_stats(stat_date DESC);

-- ============================================
-- 3. 트리거 및 함수
-- ============================================

-- updated_at 자동 업데이트 트리거 -> 디비의존적이니까 그냥 코드단에서 해결 할듯
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.updated_at = NOW();
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
--
-- CREATE TRIGGER update_uploaded_file_updated_at BEFORE UPDATE ON uploaded_file
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
--
-- CREATE TRIGGER update_applicants_updated_at BEFORE UPDATE ON applicants
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
--
-- CREATE TRIGGER update_resumes_updated_at BEFORE UPDATE ON resumes
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
--
-- CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
--
-- CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON interviews
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
--
-- -- Position의 applicant_count 자동 업데이트
-- CREATE OR REPLACE FUNCTION update_position_applicant_count()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     IF TG_OP = 'INSERT' THEN
--         UPDATE positions SET applicant_count = applicant_count + 1
--         WHERE id = NEW.position_id;
--     ELSIF TG_OP = 'DELETE' THEN
--         UPDATE positions SET applicant_count = applicant_count - 1
--         WHERE id = OLD.position_id;
--     ELSIF TG_OP = 'UPDATE' AND NEW.position_id != OLD.position_id THEN
--         UPDATE positions SET applicant_count = applicant_count - 1
--         WHERE id = OLD.position_id;
--         UPDATE positions SET applicant_count = applicant_count + 1
--         WHERE id = NEW.position_id;
--     END IF;
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
--
-- CREATE TRIGGER update_position_count AFTER INSERT OR UPDATE OR DELETE ON applicants
--     FOR EACH ROW EXECUTE FUNCTION update_position_applicant_count();

-- ============================================
-- 4. 초기 데이터 (샘플)
-- ============================================

-- Position 초기 데이터
INSERT INTO positions (title, required_skills, preferred_skills) VALUES
('Backend Developer', ARRAY['Python', 'SQL', 'REST API'], ARRAY['Docker', 'AWS', 'Redis']),
('Data Engineer', ARRAY['Python', 'SQL', 'Airflow'], ARRAY['Spark', 'Kafka', 'AWS']),
('ML Engineer', ARRAY['Python', 'PyTorch', 'ML'], ARRAY['Docker', 'Kubernetes', 'MLOps']);
```

---

-- ## 📐 테이블 관계 다이어그램 (ERD)
-- ```
-- positions (1) ──< (N) applicants (1) ──< (N) resumes (1) ──< (1) resume_analysis
--                                          │                   │
--                                          │                   └──< (N) qa_history ──> (1) good_case_vectors
--                                          │
--                                          └──< (N) interviews
--
-- uploaded_file (1) ──< (N) resumes
--
-- vector_store (독립적)
-- good_case_vectors (독립적, qa_history 참조)
-- dashboard_stats (독립적, 집계용)
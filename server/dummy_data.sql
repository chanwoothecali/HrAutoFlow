-- ============================================
-- 1. 기존 데이터 삭제 (테스트용)
-- ============================================
TRUNCATE TABLE good_case_vectors CASCADE;
TRUNCATE TABLE qa_history CASCADE;
TRUNCATE TABLE resume_analysis CASCADE;
TRUNCATE TABLE vector_store CASCADE;
TRUNCATE TABLE resumes CASCADE;
TRUNCATE TABLE applicants CASCADE;
TRUNCATE TABLE uploaded_file CASCADE;
TRUNCATE TABLE positions CASCADE;
TRUNCATE TABLE admins CASCADE;

-- 시퀀스 초기화
ALTER SEQUENCE uploaded_file_id_seq RESTART WITH 1;
ALTER SEQUENCE positions_id_seq RESTART WITH 1;
ALTER SEQUENCE applicants_id_seq RESTART WITH 1;
ALTER SEQUENCE resumes_id_seq RESTART WITH 1;
ALTER SEQUENCE resume_analysis_id_seq RESTART WITH 1;
ALTER SEQUENCE qa_history_id_seq RESTART WITH 1;
ALTER SEQUENCE admins_id_seq RESTART WITH 1;

-- ============================================
-- 2. Positions 데이터
-- ============================================
INSERT INTO positions (title, description, required_skills, preferred_skills, status, applicant_count, created_at) VALUES
('Backend Developer', 'Python/Java 백엔드 개발자', ARRAY['Python', 'SQL', 'REST API'], ARRAY['Docker', 'Kubernetes', 'AWS'], 'active', 0, NOW() - INTERVAL '30 days'),
('Data Engineer', '데이터 파이프라인 구축', ARRAY['Python', 'SQL', 'Airflow'], ARRAY['Spark', 'Kafka', 'GCP'], 'active', 0, NOW() - INTERVAL '25 days'),
('Frontend Developer', 'React/Next.js 프론트엔드 개발자', ARRAY['JavaScript', 'React', 'TypeScript'], ARRAY['Next.js', 'TailwindCSS'], 'active', 0, NOW() - INTERVAL '20 days'),
('ML Engineer', '머신러닝 엔지니어', ARRAY['Python', 'PyTorch', 'TensorFlow'], ARRAY['MLOps', 'Kubeflow'], 'active', 0, NOW() - INTERVAL '15 days'),
('DevOps Engineer', 'DevOps/SRE', ARRAY['Kubernetes', 'Docker', 'CI/CD'], ARRAY['Terraform', 'ArgoCD'], 'active', 0, NOW() - INTERVAL '10 days');

-- ============================================
-- 3. Uploaded File 데이터
-- ============================================
INSERT INTO uploaded_file (original_filename, stored_filename, file_type, file_size, storage_path, upload_status, created_at) VALUES
('홍길동_이력서.pdf', 'resume_001.pdf', 'application/pdf', 245760, '/storage/resume_001.pdf', 'uploaded', NOW() - INTERVAL '5 days'),
('김영희_이력서.pdf', 'resume_002.pdf', 'application/pdf', 312450, '/storage/resume_002.pdf', 'uploaded', NOW() - INTERVAL '4 days'),
('이철수_이력서.docx', 'resume_003.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 189320, '/storage/resume_003.docx', 'uploaded', NOW() - INTERVAL '3 days'),
('박민수_이력서.pdf', 'resume_004.pdf', 'application/pdf', 278910, '/storage/resume_004.pdf', 'uploaded', NOW() - INTERVAL '2 days'),
('정수현_이력서.pdf', 'resume_005.pdf', 'application/pdf', 298450, '/storage/resume_005.pdf', 'uploaded', NOW() - INTERVAL '1 day'),
('최지원_이력서.pdf', 'resume_006.pdf', 'application/pdf', 234560, '/storage/resume_006.pdf', 'uploaded', NOW() - INTERVAL '12 hours'),
('강태양_이력서.pdf', 'resume_007.pdf', 'application/pdf', 267890, '/storage/resume_007.pdf', 'uploaded', NOW() - INTERVAL '6 hours'),
('윤서연_이력서.pdf', 'resume_008.pdf', 'application/pdf', 289340, '/storage/resume_008.pdf', 'uploaded', NOW() - INTERVAL '3 hours'),
('임도현_이력서.pdf', 'resume_009.pdf', 'application/pdf', 256780, '/storage/resume_009.pdf', 'uploaded', NOW() - INTERVAL '1 hour'),
('한지민_이력서.pdf', 'resume_010.pdf', 'application/pdf', 301230, '/storage/resume_010.pdf', 'uploaded', NOW() - INTERVAL '30 minutes');

-- ============================================
-- 4. Applicants 데이터
-- ============================================
INSERT INTO applicants (name, email, phone, position, experience_years, education, status, score, position_id, created_at) VALUES
('홍길동', 'hong@example.com', '010-1234-5678', 'Backend Developer', 5, '서울대학교 컴퓨터공학과', 'in_review', 92, 1, NOW() - INTERVAL '5 days'),
('김영희', 'kim@example.com', '010-2345-6789', 'Data Engineer', 3, '연세대학교 통계학과', 'interviewed', 88, 2, NOW() - INTERVAL '4 days'),
('이철수', 'lee@example.com', '010-3456-7890', 'Backend Developer', 7, '카이스트 전산학과', 'hired', 95, 1, NOW() - INTERVAL '3 days'),
('박민수', 'park@example.com', '010-4567-8901', 'Frontend Developer', 4, '고려대학교 컴퓨터학과', 'in_review', 85, 3, NOW() - INTERVAL '2 days'),
('정수현', 'jung@example.com', '010-5678-9012', 'ML Engineer', 6, '포항공대 인공지능학과', 'interviewed', 90, 4, NOW() - INTERVAL '1 day'),
('최지원', 'choi@example.com', '010-6789-0123', 'Backend Developer', 2, '성균관대 소프트웨어학과', 'pending', 78, 1, NOW() - INTERVAL '12 hours'),
('강태양', 'kang@example.com', '010-7890-1234', 'DevOps Engineer', 4, '한양대학교 컴퓨터공학과', 'in_review', 87, 5, NOW() - INTERVAL '6 hours'),
('윤서연', 'yoon@example.com', '010-8901-2345', 'Data Engineer', 5, '이화여대 통계학과', 'in_review', 89, 2, NOW() - INTERVAL '3 hours'),
('임도현', 'lim@example.com', '010-9012-3456', 'Frontend Developer', 3, '중앙대학교 소프트웨어학과', 'pending', 82, 3, NOW() - INTERVAL '1 hour'),
('한지민', 'han@example.com', '010-0123-4567', 'ML Engineer', 4, '서강대학교 인공지능학과', 'pending', 86, 4, NOW() - INTERVAL '30 minutes');

-- ============================================
-- 5. Resumes 데이터
-- ============================================
INSERT INTO resumes (applicant_id, uploaded_file_id, extracted_text, processing_status, created_at) VALUES
(1, 1, '홍길동\n\n경력사항:\n- ABC Tech (2019-현재): 백엔드 개발\n- 주요 기술: Python, Django, PostgreSQL, Redis\n- API 성능 35% 개선, 마이크로서비스 아키텍처 구축\n\n학력:\n- 서울대학교 컴퓨터공학과 졸업 (2015-2019)', 'completed', NOW() - INTERVAL '5 days'),
(2, 2, '김영희\n\n경력사항:\n- Data Corp (2021-현재): 데이터 엔지니어\n- 주요 기술: Python, Airflow, Spark, AWS\n- 실시간 데이터 파이프라인 구축, ETL 프로세스 최적화\n\n학력:\n- 연세대학교 통계학과 졸업 (2017-2021)', 'completed', NOW() - INTERVAL '4 days'),
(3, 3, '이철수\n\n경력사항:\n- Tech Giants (2017-현재): 시니어 백엔드 개발자\n- 주요 기술: Java, Spring Boot, Kubernetes, MySQL\n- 대규모 트래픽 처리 시스템 설계, MSA 전환 리드\n\n학력:\n- 카이스트 전산학과 석사 졸업 (2015-2017)', 'completed', NOW() - INTERVAL '3 days'),
(4, 4, '박민수\n\n경력사항:\n- Frontend Inc (2020-현재): 프론트엔드 개발자\n- 주요 기술: React, TypeScript, Next.js, TailwindCSS\n- 웹 성능 최적화, 컴포넌트 라이브러리 구축\n\n학력:\n- 고려대학교 컴퓨터학과 졸업 (2016-2020)', 'completed', NOW() - INTERVAL '2 days'),
(5, 5, '정수현\n\n경력사항:\n- AI Labs (2019-현재): ML 엔지니어\n- 주요 기술: Python, PyTorch, TensorFlow, MLOps\n- 추천 시스템 개발, 모델 성능 20% 향상\n\n학력:\n- 포항공대 인공지능학과 석사 졸업 (2017-2019)', 'completed', NOW() - INTERVAL '1 day'),
(6, 6, '최지원\n\n경력사항:\n- StartUp A (2022-현재): 주니어 백엔드 개발자\n- 주요 기술: Python, FastAPI, PostgreSQL\n- REST API 개발, 데이터베이스 설계\n\n학력:\n- 성균관대 소프트웨어학과 졸업 (2018-2022)', 'completed', NOW() - INTERVAL '12 hours'),
(7, 7, '강태양\n\n경력사항:\n- Cloud Services (2020-현재): DevOps 엔지니어\n- 주요 기술: Kubernetes, Docker, Terraform, AWS\n- CI/CD 파이프라인 구축, 인프라 자동화\n\n학력:\n- 한양대학교 컴퓨터공학과 졸업 (2016-2020)', 'completed', NOW() - INTERVAL '6 hours'),
(8, 8, '윤서연\n\n경력사항:\n- Big Data Corp (2019-현재): 시니어 데이터 엔지니어\n- 주요 기술: Python, Spark, Kafka, GCP\n- 빅데이터 처리 시스템 구축, 데이터 품질 관리\n\n학력:\n- 이화여대 통계학과 석사 졸업 (2017-2019)', 'completed', NOW() - INTERVAL '3 hours'),
(9, 9, '임도현\n\n경력사항:\n- Web Agency (2021-현재): 프론트엔드 개발자\n- 주요 기술: JavaScript, Vue.js, Nuxt.js\n- 반응형 웹 개발, SEO 최적화\n\n학력:\n- 중앙대학교 소프트웨어학과 졸업 (2017-2021)', 'completed', NOW() - INTERVAL '1 hour'),
(10, 10, '한지민\n\n경력사항:\n- AI Company (2020-현재): ML 엔지니어\n- 주요 기술: Python, Scikit-learn, XGBoost\n- 예측 모델 개발, AB 테스트 설계\n\n학력:\n- 서강대학교 인공지능학과 졸업 (2016-2020)', 'completed', NOW() - INTERVAL '30 minutes');

-- ============================================
-- 6. Resume Analysis 데이터
-- ============================================
INSERT INTO resume_analysis (resume_id, summary, strengths, interview_questions, skills_summary, work_experience, top_tags, analyzed_at) VALUES
(1, '5년 경력의 백엔드 개발자로 Python/Django 전문가입니다. API 성능 최적화 및 마이크로서비스 아키텍처 구축 경험이 있습니다.',
'1. API 성능 35% 개선 경험\n2. 마이크로서비스 아키텍처 설계 능력\n3. 대규모 트래픽 처리 경험',
'[{"question": "API 성능을 35% 개선한 구체적인 방법은?", "category": "technical", "difficulty": "medium"},
  {"question": "마이크로서비스 전환 시 가장 어려웠던 점은?", "category": "experience", "difficulty": "hard"}]'::jsonb,
'{"Python": 95, "Django": 90, "PostgreSQL": 85, "Redis": 80, "Docker": 75}'::jsonb,
'[{"title": "Backend Developer", "company": "ABC Tech", "period": "2019-현재", "achievements": ["API 성능 35% 개선", "마이크로서비스 아키텍처 구축"]}]'::jsonb,
ARRAY['Python', 'Django', 'PostgreSQL', 'Redis', 'Docker'],
NOW() - INTERVAL '5 days'),

(2, '3년 경력의 데이터 엔지니어로 실시간 데이터 파이프라인 구축 전문가입니다. Airflow와 Spark를 활용한 ETL 최적화 경험이 풍부합니다.',
'1. 실시간 데이터 파이프라인 구축\n2. ETL 프로세스 최적화\n3. AWS 클라우드 인프라 경험',
'[{"question": "Airflow로 구축한 파이프라인의 규모는?", "category": "technical", "difficulty": "medium"},
  {"question": "데이터 품질 이슈를 어떻게 해결하셨나요?", "category": "experience", "difficulty": "medium"}]'::jsonb,
'{"Python": 90, "Airflow": 85, "Spark": 80, "AWS": 75, "SQL": 90}'::jsonb,
'[{"title": "Data Engineer", "company": "Data Corp", "period": "2021-현재", "achievements": ["실시간 파이프라인 구축", "ETL 최적화"]}]'::jsonb,
ARRAY['Python', 'Airflow', 'Spark', 'AWS', 'SQL'],
NOW() - INTERVAL '4 days'),

(3, '7년 경력의 시니어 백엔드 개발자로 대규모 시스템 설계 전문가입니다. MSA 전환 프로젝트를 리드한 경험이 있습니다.',
'1. 대규모 트래픽 처리 시스템 설계\n2. MSA 전환 프로젝트 리드\n3. 시니어급 기술 리더십',
'[{"question": "MSA 전환 시 데이터 정합성은 어떻게 보장하셨나요?", "category": "technical", "difficulty": "hard"},
  {"question": "팀을 리드하면서 겪은 어려움은?", "category": "behavioral", "difficulty": "medium"}]'::jsonb,
'{"Java": 95, "Spring Boot": 95, "Kubernetes": 90, "MySQL": 85, "Redis": 80}'::jsonb,
'[{"title": "Senior Backend Developer", "company": "Tech Giants", "period": "2017-현재", "achievements": ["대규모 트래픽 처리", "MSA 전환 리드"]}]'::jsonb,
ARRAY['Java', 'Spring Boot', 'Kubernetes', 'MySQL', 'Redis'],
NOW() - INTERVAL '3 days'),

(4, '4년 경력의 프론트엔드 개발자로 React/TypeScript 전문가입니다. 웹 성능 최적화 및 컴포넌트 라이브러리 구축 경험이 있습니다.',
'1. 웹 성능 최적화 (LCP 40% 개선)\n2. 재사용 가능한 컴포넌트 라이브러리 구축\n3. TypeScript 타입 안정성 강화',
'[{"question": "웹 성능 최적화를 어떻게 측정하고 개선하셨나요?", "category": "technical", "difficulty": "medium"},
  {"question": "컴포넌트 라이브러리 설계 원칙은?", "category": "technical", "difficulty": "medium"}]'::jsonb,
'{"React": 90, "TypeScript": 88, "Next.js": 85, "TailwindCSS": 80, "JavaScript": 92}'::jsonb,
'[{"title": "Frontend Developer", "company": "Frontend Inc", "period": "2020-현재", "achievements": ["웹 성능 최적화", "컴포넌트 라이브러리 구축"]}]'::jsonb,
ARRAY['React', 'TypeScript', 'Next.js', 'TailwindCSS', 'JavaScript'],
NOW() - INTERVAL '2 days'),

(5, '6년 경력의 ML 엔지니어로 추천 시스템 개발 전문가입니다. 모델 성능 20% 향상 및 MLOps 구축 경험이 있습니다.',
'1. 추천 시스템 개발 및 성능 개선\n2. MLOps 파이프라인 구축\n3. 모델 모니터링 및 A/B 테스트',
'[{"question": "추천 시스템의 성능을 어떻게 평가하셨나요?", "category": "technical", "difficulty": "hard"},
  {"question": "MLOps 도입 시 가장 중요한 요소는?", "category": "experience", "difficulty": "medium"}]'::jsonb,
'{"Python": 95, "PyTorch": 90, "TensorFlow": 85, "MLOps": 80, "Docker": 75}'::jsonb,
'[{"title": "ML Engineer", "company": "AI Labs", "period": "2019-현재", "achievements": ["추천 시스템 개발", "모델 성능 20% 향상"]}]'::jsonb,
ARRAY['Python', 'PyTorch', 'TensorFlow', 'MLOps', 'Docker'],
NOW() - INTERVAL '1 day'),

(6, '2년 경력의 주니어 백엔드 개발자로 FastAPI/PostgreSQL 경험이 있습니다. REST API 개발 및 데이터베이스 설계를 담당했습니다.',
'1. REST API 설계 및 구현\n2. 데이터베이스 스키마 설계\n3. 빠른 학습 능력',
'[{"question": "FastAPI를 선택한 이유는?", "category": "technical", "difficulty": "easy"},
  {"question": "가장 어려웠던 기술적 문제는?", "category": "experience", "difficulty": "medium"}]'::jsonb,
'{"Python": 80, "FastAPI": 75, "PostgreSQL": 70, "Docker": 65, "Git": 75}'::jsonb,
'[{"title": "Junior Backend Developer", "company": "StartUp A", "period": "2022-현재", "achievements": ["REST API 개발", "데이터베이스 설계"]}]'::jsonb,
ARRAY['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'Git'],
NOW() - INTERVAL '12 hours'),

(7, '4년 경력의 DevOps 엔지니어로 Kubernetes/Terraform 전문가입니다. CI/CD 파이프라인 구축 및 인프라 자동화 경험이 있습니다.',
'1. CI/CD 파이프라인 구축 (Jenkins, GitLab CI)\n2. 인프라 자동화 (Terraform)\n3. Kubernetes 클러스터 운영',
'[{"question": "Kubernetes 클러스터 장애 대응 경험은?", "category": "experience", "difficulty": "hard"},
  {"question": "IaC 도구 선택 기준은?", "category": "technical", "difficulty": "medium"}]'::jsonb,
'{"Kubernetes": 90, "Docker": 88, "Terraform": 85, "AWS": 80, "Jenkins": 75}'::jsonb,
'[{"title": "DevOps Engineer", "company": "Cloud Services", "period": "2020-현재", "achievements": ["CI/CD 구축", "인프라 자동화"]}]'::jsonb,
ARRAY['Kubernetes', 'Docker', 'Terraform', 'AWS', 'Jenkins'],
NOW() - INTERVAL '6 hours'),

(8, '5년 경력의 시니어 데이터 엔지니어로 Spark/Kafka 전문가입니다. 빅데이터 처리 시스템 구축 및 데이터 품질 관리 경험이 풍부합니다.',
'1. 빅데이터 처리 시스템 구축 (Spark)\n2. 실시간 스트리밍 처리 (Kafka)\n3. 데이터 품질 관리 프레임워크',
'[{"question": "Spark 성능 튜닝 경험은?", "category": "technical", "difficulty": "hard"},
  {"question": "데이터 품질 이슈를 어떻게 모니터링하나요?", "category": "experience", "difficulty": "medium"}]'::jsonb,
'{"Python": 92, "Spark": 90, "Kafka": 88, "GCP": 80, "SQL": 90}'::jsonb,
'[{"title": "Senior Data Engineer", "company": "Big Data Corp", "period": "2019-현재", "achievements": ["빅데이터 시스템 구축", "데이터 품질 관리"]}]'::jsonb,
ARRAY['Python', 'Spark', 'Kafka', 'GCP', 'SQL'],
NOW() - INTERVAL '3 hours'),

(9, '3년 경력의 프론트엔드 개발자로 Vue.js/Nuxt.js 전문가입니다. 반응형 웹 개발 및 SEO 최적화 경험이 있습니다.',
'1. 반응형 웹 디자인 구현\n2. SEO 최적화 (검색 순위 30% 향상)\n3. 웹 접근성 개선',
'[{"question": "Nuxt.js를 선택한 이유는?", "category": "technical", "difficulty": "easy"},
  {"question": "SEO 최적화를 위해 적용한 기법은?", "category": "technical", "difficulty": "medium"}]'::jsonb,
'{"JavaScript": 85, "Vue.js": 88, "Nuxt.js": 82, "HTML": 90, "CSS": 88}'::jsonb,
'[{"title": "Frontend Developer", "company": "Web Agency", "period": "2021-현재", "achievements": ["반응형 웹 개발", "SEO 최적화"]}]'::jsonb,
ARRAY['JavaScript', 'Vue.js', 'Nuxt.js', 'HTML', 'CSS'],
NOW() - INTERVAL '1 hour'),

(10, '4년 경력의 ML 엔지니어로 예측 모델 개발 전문가입니다. Scikit-learn과 XGBoost를 활용한 모델링 경험이 있습니다.',
'1. 예측 모델 개발 (정확도 85%)\n2. A/B 테스트 설계 및 분석\n3. 피처 엔지니어링 전문성',
'[{"question": "모델 성능 개선을 위해 시도한 방법은?", "category": "technical", "difficulty": "medium"},
  {"question": "A/B 테스트 설계 시 고려사항은?", "category": "experience", "difficulty": "medium"}]'::jsonb,
'{"Python": 88, "Scikit-learn": 85, "XGBoost": 82, "Pandas": 90, "NumPy": 88}'::jsonb,
'[{"title": "ML Engineer", "company": "AI Company", "period": "2020-현재", "achievements": ["예측 모델 개발", "A/B 테스트 설계"]}]'::jsonb,
ARRAY['Python', 'Scikit-learn', 'XGBoost', 'Pandas', 'NumPy'],
NOW() - INTERVAL '30 minutes');

-- ============================================
-- 7. Vector Store 데이터 (샘플)
-- ============================================
-- 실제로는 768차원 벡터가 필요하지만, 여기서는 간단한 랜덤 벡터 생성
INSERT INTO vector_store (id, doc_id, doc_name, chunk_index, content, embedding, meta_data, created_at)
SELECT
    gen_random_uuid(),
    'resume_' || r.id,
    'resume_' || r.id || '.pdf',
    0,
    LEFT(r.extracted_text, 500),
    random_vec.vec::vector,  -- ⭐ LATERAL로 생성한 벡터
    jsonb_build_object('doc_id', 'resume_' || r.id, 'resume_id', r.id, 'chunk_index', 0),
    r.created_at
FROM resumes r
CROSS JOIN LATERAL (
    SELECT array_agg(random()) as vec
    FROM generate_series(1, 768)
) random_vec
WHERE r.processing_status = 'completed';

-- 추가 청크 (1-3번 청크)
INSERT INTO vector_store (id, doc_id, doc_name, chunk_index, content, embedding, meta_data, created_at)
SELECT
    gen_random_uuid(),
    'resume_' || r.id,
    'resume_' || r.id || '.pdf',
    gs.chunk_idx,
    SUBSTRING(r.extracted_text, 1 + (gs.chunk_idx * 500), 500),
    random_vec.vec::vector,
    jsonb_build_object('doc_id', 'resume_' || r.id, 'resume_id', r.id, 'chunk_index', gs.chunk_idx),
    r.created_at
FROM resumes r
CROSS JOIN generate_series(1, 3) as gs(chunk_idx)
CROSS JOIN LATERAL (
    SELECT array_agg(random()) as vec
    FROM generate_series(1, 768)
) random_vec
WHERE r.processing_status = 'completed'
  AND LENGTH(r.extracted_text) > (gs.chunk_idx * 500);

INSERT INTO vector_store (id, doc_id, doc_name, chunk_index, content, embedding, meta_data, created_at)
SELECT
    gen_random_uuid(),
    'resume_' || r.id,
    'resume_' || r.id || '.pdf',
    2,
    SUBSTRING(r.extracted_text, 1001, 500),
    (SELECT array_agg(random()) FROM generate_series(1, 768))::vector,
    jsonb_build_object('doc_id', 'resume_' || r.id, 'resume_id', r.id, 'chunk_index', 2),
    r.created_at
FROM resumes r
WHERE r.processing_status = 'completed' AND LENGTH(r.extracted_text) > 1000;

-- ============================================
-- 8. QA History 데이터
-- ============================================
INSERT INTO qa_history (resume_id, question, answer, retrieved_chunks, relevance_score, is_good_case, feedback_rating, created_at) VALUES
(1, '이 지원자의 주요 기술 스택은 무엇인가요?',
'이 지원자의 주요 기술 스택은 Python, Django, PostgreSQL, Redis, Docker입니다. 5년간의 백엔드 개발 경험을 보유하고 있으며, API 성능 최적화에 강점이 있습니다.',
ARRAY['Python, Django 전문가', 'PostgreSQL, Redis 경험', 'API 성능 35% 개선'],
0.92, true, 5, NOW() - INTERVAL '2 days'),

(2, 'Airflow 경험이 어느 정도인가요?',
'3년간 Airflow를 활용한 데이터 파이프라인 구축 경험이 있습니다. 실시간 데이터 처리 및 ETL 프로세스 최적화를 담당했으며, 복잡한 DAG 설계 및 관리 경험이 풍부합니다.',
ARRAY['Airflow 3년 경험', '실시간 파이프라인 구축', 'ETL 최적화'],
0.88, true, 4, NOW() - INTERVAL '1 day'),

(3, 'MSA 전환 경험이 있나요?',
'네, 7년 경력 중 최근 3년간 MSA 전환 프로젝트를 리드했습니다. 모놀리식 아키텍처에서 마이크로서비스로 전환하면서 서비스 분리, API Gateway 구성, 데이터 정합성 보장 등의 경험이 있습니다.',
ARRAY['MSA 전환 리드', '마이크로서비스 아키텍처 설계', '대규모 트래픽 처리'],
0.95, true, 5, NOW() - INTERVAL '12 hours'),

(4, '프론트엔드 성능 최적화 경험은?',
'웹 성능 최적화를 통해 LCP를 40% 개선한 경험이 있습니다. Code Splitting, Lazy Loading, 이미지 최적화, CDN 활용 등 다양한 기법을 적용했으며, Lighthouse 점수를 90점 이상으로 개선했습니다.',
ARRAY['웹 성능 최적화', 'LCP 40% 개선', 'Lighthouse 점수 향상'],
0.87, false, 3, NOW() - INTERVAL '6 hours');

-- ============================================
-- 9. Good Case Vectors 데이터 (LATERAL 사용)
-- ============================================
INSERT INTO good_case_vectors (id, qa_id, question, answer, context, embedding, meta_data, created_at)
SELECT
    gen_random_uuid(),
    qa.id,
    qa.question,
    qa.answer,
    array_to_string(qa.retrieved_chunks, E'\n'),
    random_vec.vec::vector,  -- ⭐ LATERAL로 생성한 벡터
    jsonb_build_object('resume_id', qa.resume_id, 'relevance_score', qa.relevance_score, 'rating', qa.feedback_rating),
    qa.created_at
FROM qa_history qa
CROSS JOIN LATERAL (
    SELECT array_agg(random()) as vec
    FROM generate_series(1, 768)
) random_vec
WHERE qa.is_good_case = true;

-- ============================================
-- 10. Admins 데이터 (선택사항)
-- ============================================
INSERT INTO admins (name, email, role, created_at) VALUES
('관리자', 'admin@hrflow.com', 'admin', NOW() - INTERVAL '60 days'),
('HR매니저', 'hr@hrflow.com', 'hr_manager', NOW() - INTERVAL '50 days'),
('면접관', 'interviewer@hrflow.com', 'interviewer', NOW() - INTERVAL '40 days');

-- ============================================
-- 11. Position의 applicant_count 업데이트
-- ============================================
UPDATE positions p
SET applicant_count = (
    SELECT COUNT(*)
    FROM applicants a
    WHERE a.position_id = p.id
);

-- ============================================
-- 12. 데이터 확인
-- ============================================
SELECT 'positions' as table_name, COUNT(*) as count FROM positions
UNION ALL
SELECT 'uploaded_file', COUNT(*) FROM uploaded_file
UNION ALL
SELECT 'applicants', COUNT(*) FROM applicants
UNION ALL
SELECT 'resumes', COUNT(*) FROM resumes
UNION ALL
SELECT 'resume_analysis', COUNT(*) FROM resume_analysis
UNION ALL
SELECT 'vector_store', COUNT(*) FROM vector_store
UNION ALL
SELECT 'qa_history', COUNT(*) FROM qa_history
UNION ALL
SELECT 'good_case_vectors', COUNT(*) FROM good_case_vectors
UNION ALL
SELECT 'admins', COUNT(*) FROM admins;
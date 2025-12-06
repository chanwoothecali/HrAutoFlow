-- =============================================
-- HR AutoFlow 더미 데이터 INSERT 스크립트
-- =============================================

-- 1. Positions (채용 포지션)
INSERT INTO positions (id, title, department, description, required_skills, preferred_skills, min_years, project_experience, status, applicant_count, created_at, updated_at)
VALUES
(1, 'Backend Developer', 'Engineering', '백엔드 개발자를 모집합니다.',
 ARRAY['Python', 'Django', 'REST', 'Docker'],
 ARRAY['AWS', 'Kubernetes', 'Redis'],
 3,
 '대규모 트래픽 결제/정산 시스템 백엔드 개발 경험',
 'Open', 3, NOW(), NOW()),

(2, 'Data Engineer', 'Data Platform', '데이터 엔지니어를 모집합니다.',
 ARRAY['Python', 'SQL', 'Airflow', 'Spark'],
 ARRAY['BigQuery', 'Kafka', 'dbt'],
 4,
 '데이터 파이프라인 설계 및 운영, DW/DM 구축 경험',
 'Open', 2, NOW(), NOW()),

(3, 'Frontend Developer', 'Engineering', '프론트엔드 개발자를 모집합니다.',
 ARRAY['React', 'TypeScript', 'Next.js'],
 ARRAY['Redux', 'TailwindCSS'],
 2,
 'React 기반 SPA 개발 경험',
 'Open', 0, NOW(), NOW());

-- ID 시퀀스 업데이트
SELECT setval('positions_id_seq', (SELECT MAX(id) FROM positions));


-- 2. Applicants (지원자)
INSERT INTO applicants (id, name, email, phone, position, experience_years, education, status, score, position_id, created_at, updated_at)
VALUES
-- Backend 포지션 지원자들
(1, '김지훈', 'kimjh@example.com', '010-1234-5678', 'Backend Developer', 3, 'Bachelor', 'In Progress', 92, 1, NOW(), NOW()),
(2, '이민아', 'leema@example.com', '010-2345-6789', 'Backend Developer', 2, 'Bachelor', 'In Progress', 82, 1, NOW(), NOW()),
(3, '최유진', 'choiyj@example.com', '010-3456-7890', 'Backend Developer', 4, 'Bachelor', 'Interview', 76, 1, NOW(), NOW()),

-- Data 포지션 지원자들
(4, '박서현', 'parksh@example.com', '010-4567-8901', 'Data Engineer', 4, 'Master', 'In Progress', 88, 2, NOW(), NOW()),
(5, '정우성', 'jungws@example.com', '010-5678-9012', 'Data Engineer', 5, 'Bachelor', 'In Progress', 79, 2, NOW(), NOW());

-- ID 시퀀스 업데이트
SELECT setval('applicants_id_seq', (SELECT MAX(id) FROM applicants));


-- 3. UploadedFile (업로드된 파일)
INSERT INTO uploaded_file (id, original_filename, stored_filename, file_type, file_size, storage_path, upload_status, created_at, updated_at)
VALUES
(1, '김지훈_이력서.pdf', 'resume_1_20241124.pdf', 'application/pdf', 524288, '/uploads/resumes/2024/11/resume_1_20241124.pdf', 'uploaded', NOW(), NOW()),
(2, '이민아_이력서.pdf', 'resume_2_20241124.pdf', 'application/pdf', 614400, '/uploads/resumes/2024/11/resume_2_20241124.pdf', 'uploaded', NOW(), NOW()),
(3, '최유진_이력서.pdf', 'resume_3_20241124.pdf', 'application/pdf', 487424, '/uploads/resumes/2024/11/resume_3_20241124.pdf', 'uploaded', NOW(), NOW()),
(4, '박서현_이력서.pdf', 'resume_4_20241124.pdf', 'application/pdf', 551936, '/uploads/resumes/2024/11/resume_4_20241124.pdf', 'uploaded', NOW(), NOW()),
(5, '정우성_이력서.pdf', 'resume_5_20241124.pdf', 'application/pdf', 598016, '/uploads/resumes/2024/11/resume_5_20241124.pdf', 'uploaded', NOW(), NOW());

-- ID 시퀀스 업데이트
SELECT setval('uploaded_file_id_seq', (SELECT MAX(id) FROM uploaded_file));


-- 4. Resumes (이력서)
INSERT INTO resumes (id, applicant_id, uploaded_file_id, extracted_text, processing_status, created_at, updated_at)
VALUES
(1, 1, 1, '김지훈 | Software Engineer | kimjh@example.com\n\n경력 3년차 백엔드 엔지니어...', 'completed', NOW(), NOW()),
(2, 2, 2, '이민아 | Backend Developer | leema@example.com\n\n스타트업에서 풀스택 역할...', 'completed', NOW(), NOW()),
(3, 3, 3, '최유진 | Backend Developer | choiyj@example.com\n\n4년간 웹 서비스 백엔드...', 'completed', NOW(), NOW()),
(4, 4, 4, '박서현 | Data Engineer | parksh@example.com\n\n대용량 로그 데이터...', 'completed', NOW(), NOW()),
(5, 5, 5, '정우성 | Data Engineer | jungws@example.com\n\n사용자 이벤트 로그...', 'completed', NOW(), NOW());

-- ID 시퀀스 업데이트
SELECT setval('resumes_id_seq', (SELECT MAX(id) FROM resumes));


-- 5. ResumeAnalysis (이력서 분석)
INSERT INTO resume_analysis (id, resume_id, summary, strengths, interview_questions, skills_summary, work_experience, education_info, top_tags, analyzed_at, analysis_version)
VALUES
(1, 1, '3년차 백엔드 엔지니어로 결제·정산, 로그 수집, 모니터링 API를 설계·구현했습니다. 장애 대응과 성능 튜닝 경험이 풍부합니다.',
 E'• 서비스 장애 상황에서 원인 분석과 롤백/핫픽스 경험이 풍부함\n• 쿼리 튜닝과 인덱스 설계를 통한 실질적인 성능 개선 경험\n• 로그/모니터링 지표를 기반으로 한 운영 자동화에 관심이 많음',
 '["결제 시스템에서 가장 어려웠던 기술적 문제는?", "대규모 트래픽 처리 경험을 구체적으로 설명해주세요", "장애 대응 시 우선순위 결정 기준은?"]'::jsonb,
 '{"Python": 90, "SQL": 80, "REST": 85, "Docker": 70}'::jsonb,
 '[{"company": "핀테크 스타트업 PAYLINK", "period": "2022.02 - 현재", "role": "Backend Engineer", "description": "결제 승인/취소 API, 정산 배치, 내부 어드민용 REST API 개발 및 운영. 월 200만 건 이상 트랜잭션 처리."},
   {"company": "커머스 플랫폼 SHOPNOW", "period": "2020.03 - 2022.01", "role": "Junior Backend Developer", "description": "주문·배송 도메인 API 유지보수 및 신규 기능 개발, Redis 기반 캐시 적용으로 응답 시간 30% 단축."}]'::jsonb,
 '{"degree": "Bachelor", "major": "Computer Science", "university": "서울대학교"}'::jsonb,
 ARRAY['Python', 'SQL', 'REST', 'Docker'],
 NOW(), 'v1.0'),

(2, 2, '스타트업에서 풀스택에 가까운 역할을 수행하며 Node.js 기반 API 서버와 간단한 어드민 UI까지 함께 개발했습니다.',
 E'• 요구사항 변경이 잦은 환경에서 빠르게 MVP를 구현하고 개선해 본 경험\n• 테스트 코드(Jest)를 활용한 리팩토링과 안정적인 배포에 관심이 많음\n• 협업 과정에서 프론트엔드와 API 스펙을 함께 설계한 경험',
 '["빠른 MVP 개발과 코드 품질 사이의 균형을 어떻게 맞추시나요?", "TypeScript 도입 시 어떤 이점이 있었나요?", "팀 협업에서 가장 중요하게 생각하는 부분은?"]'::jsonb,
 '{"Node.js": 85, "TypeScript": 80, "REST": 78, "MongoDB": 75}'::jsonb,
 '[{"company": "소셜 플랫폼 STARTLINE", "period": "2022.03 - 현재", "role": "Backend Developer", "description": "피드/댓글/알림 기능 API 개발 및 운영, JWT 기반 인증/인가 로직 구현."}]'::jsonb,
 '{"degree": "Bachelor", "major": "Software Engineering", "university": "연세대학교"}'::jsonb,
 ARRAY['Node.js', 'TypeScript', 'REST', 'MongoDB'],
 NOW(), 'v1.0'),

(3, 3, '4년간 웹 서비스 백엔드를 담당하며 인증·권한, 결제, 어드민 화면용 API를 개발했습니다. 장기 운영 중인 레거시 서비스 개선 경험이 많습니다.',
 E'• 운영 이슈에 대한 책임감이 강하고, 로그 기반 원인 분석에 익숙함\n• 레거시 코드 리팩토링과 테스트 코드 추가를 꾸준히 진행한 경험\n• 운영/마케팅/CS 팀과의 커뮤니케이션 경험이 많아 요구사항 조율에 능숙함',
 '["레거시 시스템 개선 시 가장 큰 어려움은?", "Django ORM과 Raw SQL 선택 기준은?", "비개발 팀과 소통할 때 주의하는 점은?"]'::jsonb,
 '{"Python": 80, "Django": 78, "REST": 75, "Docker": 70}'::jsonb,
 '[{"company": "온라인 교육 플랫폼 EDUCARE", "period": "2020.06 - 현재", "role": "Backend Developer", "description": "수강·결제·쿠폰 등 핵심 도메인 API 개발, Celery 기반 비동기 작업 운영 및 관리자 어드민 기능 개선."}]'::jsonb,
 '{"degree": "Bachelor", "major": "Computer Engineering", "university": "고려대학교"}'::jsonb,
 ARRAY['Python', 'Django', 'REST', 'Docker'],
 NOW(), 'v1.0'),

(4, 4, '대용량 로그 데이터를 수집·정제·적재하는 ETL 파이프라인을 설계하고 운영해 왔습니다. 주로 Airflow와 Python을 활용하여 배치 워크플로우를 구성했습니다.',
 E'• 복잡한 의존 관계를 가진 ETL 플로우를 구조적으로 설계하는 능력\n• 데이터 품질 체크(누락, 중복, 이상치)에 대한 체계적인 모니터링 구축 경험\n• 비즈니스 지표를 이해하고, 필요한 데이터 마트를 직접 설계·구현 가능',
 '["데이터 품질 이슈를 어떻게 모니터링하시나요?", "Airflow DAG 설계 시 고려사항은?", "데이터 마트 설계 경험을 설명해주세요"]'::jsonb,
 '{"Python": 85, "SQL": 88, "Airflow": 90, "ETL Pipeline": 87}'::jsonb,
 '[{"company": "데이터 분석 회사 ANALYTICA", "period": "2021.01 - 현재", "role": "Data Engineer", "description": "광고/마케팅 데이터 수집 파이프라인 구축, Airflow 기반 스케줄링 및 모니터링 시스템 운영."},
   {"company": "온라인 서비스 플랫폼 LINKUP", "period": "2019.02 - 2020.12", "role": "Junior Data Engineer", "description": "로그 스키마 정리, 데이터 웨어하우스 적재 작업 보조, 기본적인 SQL 리포트 작성."}]'::jsonb,
 '{"degree": "Master", "major": "Data Science", "university": "KAIST"}'::jsonb,
 ARRAY['Python', 'ETL', 'Airflow', 'SQL'],
 NOW(), 'v1.0'),

(5, 5, '주로 사용자 이벤트 로그와 운영 데이터를 통합하여 분석용 데이터 마트를 구축해 왔습니다. Spark와 Airflow를 활용한 배치 파이프라인 경험이 많습니다.',
 E'• 대규모 데이터셋에 대한 Spark 최적화 및 파티셔닝 전략 수립 경험\n• 비즈니스 팀과 직접 협업하여 KPI 정의 및 지표 산출 로직 설계\n• 데이터 카탈로그·스키마 관리 등 문서화에 신경 쓰는 편',
 '["Spark 성능 최적화 경험을 구체적으로 설명해주세요", "데이터 파티셔닝 전략은?", "비즈니스 팀과 협업 시 어려운 점은?"]'::jsonb,
 '{"Python": 82, "Spark": 85, "Airflow": 80, "Data Warehouse": 78}'::jsonb,
 '[{"company": "모빌리티 서비스 MOVIGO", "period": "2020.01 - 현재", "role": "Data Engineer", "description": "운행/결제/위치 데이터 수집 및 통합, BigQuery 기반 데이터 마트 설계, Spark ETL 파이프라인 운영."}]'::jsonb,
 '{"degree": "Bachelor", "major": "Statistics", "university": "성균관대학교"}'::jsonb,
 ARRAY['Python', 'Spark', 'Data Warehouse', 'Airflow'],
 NOW(), 'v1.0');

-- ID 시퀀스 업데이트
SELECT setval('resume_analysis_id_seq', (SELECT MAX(id) FROM resume_analysis));


-- 6. Admins (관리자)
INSERT INTO admins (id, name, email, role, created_at)
VALUES
(1, '김채용', 'recruiter@company.com', 'recruiter', NOW()),
(2, '박인사', 'hr@company.com', 'hr_manager', NOW()),
(3, '이기술', 'tech.lead@company.com', 'tech_lead', NOW());

-- ID   시퀀스 업데이트
SELECT setval('admins_id_seq', (SELECT MAX(id) FROM admins));


-- 7. Interviews (면접)
INSERT INTO interviews (id, applicant_id, admin_id, status, scheduled_at, interview_kit, notes, rating, created_at, updated_at)
VALUES
(1, 1, 3, 'completed', NOW() - INTERVAL '2 days',
 '{"questions": ["결제 시스템 설계 경험", "대용량 트래픽 처리"], "duration": 60}'::jsonb,
 '기술적 깊이가 있고, 실제 문제 해결 경험이 풍부함. 팀 핏도 좋을 것으로 판단됨.',
 5, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),

(2, 3, 3, 'scheduled', NOW() + INTERVAL '3 days',
 '{"questions": ["레거시 시스템 개선", "Django 프로젝트 구조"], "duration": 60}'::jsonb,
 NULL, NULL, NOW(), NOW());

-- ID 시퀀스 업데이트
SELECT setval('interviews_id_seq', (SELECT MAX(id) FROM interviews));


-- 8. QAHistory (질의응답 히스토리)
INSERT INTO qa_history (id, resume_id, admin_id, question, answer, retrieved_chunks, relevance_score, feedback_rating, is_good_case, created_at)
VALUES
(1, 1, 1, '결제 시스템 개발 경험이 있나요?',
 '네, 김지훈 후보는 핀테크 스타트업 PAYLINK에서 2022년 2월부터 현재까지 결제 승인/취소 API와 정산 배치를 개발하고 운영한 경험이 있습니다. 월 200만 건 이상의 트랜잭션을 처리하는 시스템을 담당했습니다.',
 ARRAY['결제 승인/취소 API 개발', '정산 배치 시스템', '월 200만 건 트랜잭션'],
 0.92, 5, true, NOW() - INTERVAL '1 day'),

(2, 1, 1, '장애 대응 경험은 어떤가요?',
 '서비스 장애 상황에서 원인 분석과 롤백/핫픽스 경험이 풍부합니다. 로그 기반 모니터링 지표를 활용한 운영 자동화에도 관심이 많습니다.',
 ARRAY['장애 대응', '원인 분석', '롤백/핫픽스', '모니터링'],
 0.88, 5, true, NOW() - INTERVAL '12 hours'),

(3, 4, 2, 'ETL 파이프라인 구축 경험이 있나요?',
 '네, 박서현 후보는 ANALYTICA에서 광고/마케팅 데이터 수집 파이프라인을 구축했고, Airflow 기반 스케줄링 및 모니터링 시스템을 운영한 경험이 있습니다.',
 ARRAY['ETL 파이프라인', 'Airflow', '데이터 수집'],
 0.95, 5, true, NOW() - INTERVAL '6 hours');

-- ID 시퀀스 업데이트
SELECT setval('qa_history_id_seq', (SELECT MAX(id) FROM qa_history));


-- 9. DashboardStats (대시보드 통계)
INSERT INTO dashboard_stats (id, stat_date, total_applicants, applicants_by_position, applicants_by_status, avg_score, top_skills, created_at, updated_at)
VALUES
(1, CURRENT_DATE, 5,
 '{"Backend Developer": 3, "Data Engineer": 2}'::jsonb,
 '{"In Progress": 4, "Interview": 1}'::jsonb,
 83.4,
 '{"Python": 5, "SQL": 3, "REST": 3, "Airflow": 2, "Docker": 3}'::jsonb,
 NOW(), NOW());

-- ID 시퀀스 업데이트
SELECT setval('dashboard_stats_id_seq', (SELECT MAX(id) FROM dashboard_stats));


-- 10. VectorStore (벡터 저장소) - 샘플 데이터
INSERT INTO vector_store (id, doc_id, doc_name, chunk_index, content, meta_data, created_at)
VALUES
(gen_random_uuid(), 'resume_1', '김지훈_이력서.pdf', 0,
 '김지훈 | Software Engineer | kimjh@example.com\n경력 3년차 백엔드 엔지니어로 결제·정산 시스템을 담당했습니다.',
 '{"applicant_id": 1, "resume_id": 1, "type": "resume_chunk"}'::jsonb,
 NOW()),

(gen_random_uuid(), 'resume_1', '김지훈_이력서.pdf', 1,
 '주요 기술 스택: Python, Django, REST API, Docker. 대규모 트래픽 처리 경험이 있습니다.',
 '{"applicant_id": 1, "resume_id": 1, "type": "resume_chunk"}'::jsonb,
 NOW()),

(gen_random_uuid(), 'resume_4', '박서현_이력서.pdf', 0,
 '박서현 | Data Engineer | parksh@example.com\nETL 파이프라인 설계 및 Airflow 운영 경험이 있습니다.',
 '{"applicant_id": 4, "resume_id": 4, "type": "resume_chunk"}'::jsonb,
 NOW());

-- 벡터는 실제 임베딩 생성 후 UPDATE 필요
-- UPDATE vector_store SET embedding = [actual_vector] WHERE doc_id = 'resume_1';


-- 11. GoodCaseVectors (우수 QA 벡터)
INSERT INTO good_case_vectors (id, qa_id, question, answer, context, meta_data, created_at)
VALUES
(gen_random_uuid(), 1,
 '결제 시스템 개발 경험이 있나요?',
 '네, 김지훈 후보는 핀테크 스타트업 PAYLINK에서 2022년 2월부터 현재까지 결제 승인/취소 API와 정산 배치를 개발하고 운영한 경험이 있습니다.',
 '핀테크 스타트업 PAYLINK에서 Backend Engineer로 근무하며 결제 승인/취소 API, 정산 배치 개발',
 '{"applicant_id": 1, "resume_id": 1, "relevance_score": 0.92}'::jsonb,
 NOW()),

(gen_random_uuid(), 2,
 '장애 대응 경험은 어떤가요?',
 '서비스 장애 상황에서 원인 분석과 롤백/핫픽스 경험이 풍부합니다.',
 '서비스 장애 상황에서 원인 분석과 롤백/핫픽스 경험이 풍부함. 로그/모니터링 지표를 기반으로 한 운영 자동화에 관심이 많음.',
 '{"applicant_id": 1, "resume_id": 1, "relevance_score": 0.88}'::jsonb,
 NOW());


-- =============================================
-- 데이터 검증 쿼리
-- =============================================

-- 전체 테이블 카운트 확인
SELECT 'positions' as table_name, COUNT(*) as count FROM positions
UNION ALL
SELECT 'applicants', COUNT(*) FROM applicants
UNION ALL
SELECT 'uploaded_file', COUNT(*) FROM uploaded_file
UNION ALL
SELECT 'resumes', COUNT(*) FROM resumes
UNION ALL
SELECT 'resume_analysis', COUNT(*) FROM resume_analysis
UNION ALL
SELECT 'admins', COUNT(*) FROM admins
UNION ALL
SELECT 'interviews', COUNT(*) FROM interviews
UNION ALL
SELECT 'qa_history', COUNT(*) FROM qa_history
UNION ALL
SELECT 'dashboard_stats', COUNT(*) FROM dashboard_stats
UNION ALL
SELECT 'vector_store', COUNT(*) FROM vector_store
UNION ALL
SELECT 'good_case_vectors', COUNT(*) FROM good_case_vectors;

-- Applicant와 Position 관계 확인
SELECT a.name, a.position, p.title as position_title, p.department
FROM applicants a
JOIN positions p ON a.position_id = p.id;

-- Resume와 Analysis 확인
SELECT a.name, r.processing_status, ra.summary
FROM applicants a
JOIN resumes r ON a.id = r.applicant_id
LEFT JOIN resume_analysis ra ON r.id = ra.resume_id;



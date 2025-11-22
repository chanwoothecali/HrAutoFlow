-- 메인 대시보드 통계
SELECT
    -- 전체 지원자 수
    COUNT(DISTINCT a.id) as total_applicants,

    -- 평균 점수
    ROUND(AVG(a.score), 1) as avg_score,

    -- 최고 점수
    MAX(a.score) as max_score,

    -- 최저 점수
    MIN(a.score) as min_score,

    -- 처리 완료된 이력서
    COUNT(DISTINCT CASE WHEN r.processing_status = 'completed' THEN r.id END) as completed_resumes,

    -- 처리 중인 이력서
    COUNT(DISTINCT CASE WHEN r.processing_status IN ('pending', 'extracting', 'chunking', 'embedding', 'analyzing') THEN r.id END) as processing_resumes,

    -- 실패한 이력서
    COUNT(DISTINCT CASE WHEN r.processing_status = 'failed' THEN r.id END) as failed_resumes,

    -- 오늘 지원자
    COUNT(DISTINCT CASE WHEN DATE(a.created_at) = CURRENT_DATE THEN a.id END) as today_applicants,

    -- 이번 주 지원자
    COUNT(DISTINCT CASE WHEN a.created_at >= DATE_TRUNC('week', CURRENT_DATE) THEN a.id END) as week_applicants,

    -- 이번 달 지원자
    COUNT(DISTINCT CASE WHEN a.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN a.id END) as month_applicants,

    -- 평균 경력
    ROUND(AVG(a.experience_years), 1) as avg_experience_years

FROM applicants a
LEFT JOIN resumes r ON a.id = r.applicant_id;


-- Position별 상세 통계
SELECT
    p.id as position_id,
    p.title as position_name,
    p.status as position_status,

    -- 지원자 수
    COUNT(DISTINCT a.id) as applicant_count,

    -- 평균 점수
    ROUND(AVG(a.score), 1) as avg_score,

    -- 최고 점수
    MAX(a.score) as max_score,

    -- 평균 경력
    ROUND(AVG(a.experience_years), 1) as avg_experience,

    -- 상태별 카운트
    COUNT(DISTINCT CASE WHEN a.status = 'pending' THEN a.id END) as pending_count,
    COUNT(DISTINCT CASE WHEN a.status = 'in_review' THEN a.id END) as in_review_count,
    COUNT(DISTINCT CASE WHEN a.status = 'interviewed' THEN a.id END) as interviewed_count,
    COUNT(DISTINCT CASE WHEN a.status = 'hired' THEN a.id END) as hired_count,
    COUNT(DISTINCT CASE WHEN a.status = 'rejected' THEN a.id END) as rejected_count,

    -- 완료율
    ROUND(
        COUNT(DISTINCT CASE WHEN r.processing_status = 'completed' THEN r.id END) * 100.0 /
        NULLIF(COUNT(DISTINCT r.id), 0),
        1
    ) as completion_rate

FROM positions p
LEFT JOIN applicants a ON p.id = a.position_id
LEFT JOIN resumes r ON a.id = r.applicant_id
GROUP BY p.id, p.title, p.status
ORDER BY applicant_count DESC;

-- 상태별 통계
SELECT
    a.status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentage,
    ROUND(AVG(a.score), 1) as avg_score,
    ROUND(AVG(a.experience_years), 1) as avg_experience
FROM applicants a
GROUP BY a.status
ORDER BY count DESC;

-- 가장 많이 언급된 스킬 Top 10 (LATERAL 사용)
SELECT
    skill_name,
    COUNT(*) as mention_count,
    ROUND(AVG(skill_score), 1) as avg_skill_score,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentage
FROM resume_analysis ra
CROSS JOIN LATERAL jsonb_each_text(ra.skills_summary) AS skill(skill_name, skill_score_text)
CROSS JOIN LATERAL (SELECT skill_score_text::numeric as skill_score) as conv
WHERE ra.skills_summary IS NOT NULL
GROUP BY skill_name
ORDER BY mention_count DESC, avg_skill_score DESC
LIMIT 10;


-- 일별 트렌드 (최근 30일)
SELECT
    DATE(created_at) as date,
    COUNT(*) as applicant_count,
    ROUND(AVG(score), 1) as avg_score
FROM applicants
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date;

-- 주별 트렌드 (최근 12주)
SELECT
    DATE_TRUNC('week', created_at)::date as week_start,
    COUNT(*) as applicant_count,
    ROUND(AVG(score), 1) as avg_score
FROM applicants
WHERE created_at >= CURRENT_DATE - INTERVAL '12 weeks'
GROUP BY DATE_TRUNC('week', created_at)
ORDER BY week_start;

-- 월별 트렌드 (최근 6개월)
SELECT
    DATE_TRUNC('month', created_at)::date as month_start,
    TO_CHAR(created_at, 'YYYY-MM') as month_label,
    COUNT(*) as applicant_count,
    ROUND(AVG(score), 1) as avg_score
FROM applicants
WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', created_at), TO_CHAR(created_at, 'YYYY-MM')
ORDER BY month_start;


-- 최근 지원자 10명 (상세 정보 포함)
SELECT
    a.id,
    a.name,
    a.email,
    a.position,
    a.experience_years,
    a.score,
    a.status,
    a.created_at,
    r.processing_status,
    ra.summary,
    ra.top_tags,
    uf.original_filename
FROM applicants a
LEFT JOIN resumes r ON a.id = r.applicant_id
LEFT JOIN resume_analysis ra ON r.id = ra.resume_id
LEFT JOIN uploaded_file uf ON r.uploaded_file_id = uf.id
ORDER BY a.created_at DESC
LIMIT 10

-- 점수 기준 상위 10명
SELECT
    a.id,
    a.name,
    a.position,
    a.score,
    a.experience_years,
    a.status,
    ra.top_tags,
    LEFT(ra.summary, 100) as summary_preview
FROM applicants a
LEFT JOIN resumes r ON a.id = r.applicant_id
LEFT JOIN resume_analysis ra ON r.id = ra.resume_id
WHERE a.score IS NOT NULL
ORDER BY a.score DESC, a.experience_years DESC
LIMIT 10;

-- 특정 지원자의 모든 정보
SELECT
    -- 기본 정보
    a.id as applicant_id,
    a.name,
    a.email,
    a.phone,
    a.position,
    a.experience_years,
    a.education,
    a.status,
    a.score,
    a.created_at as applied_at,

    -- Position 정보
    p.title as position_title,
    p.required_skills,
    p.preferred_skills,

    -- 파일 정보
    uf.original_filename,
    uf.file_size,
    uf.file_type,

    -- 이력서 처리 정보
    r.processing_status,
    r.error_message,

    -- 분석 결과
    ra.summary,
    ra.strengths,
    ra.interview_questions,
    ra.skills_summary,
    ra.work_experience,
    ra.top_tags,
    ra.analyzed_at

FROM applicants a
LEFT JOIN positions p ON a.position_id = p.id
LEFT JOIN resumes r ON a.id = r.applicant_id
LEFT JOIN uploaded_file uf ON r.uploaded_file_id = uf.id
LEFT JOIN resume_analysis ra ON r.id = ra.resume_id
WHERE a.id = 1;  -- 지원자 ID

-- 이력서 처리 상태 현황
SELECT
    r.processing_status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentage,
    ROUND(AVG(LENGTH(r.extracted_text)), 0) as avg_text_length,
    MIN(r.created_at) as oldest,
    MAX(r.created_at) as newest
FROM resumes r
GROUP BY r.processing_status
ORDER BY
    CASE r.processing_status
        WHEN 'completed' THEN 1
        WHEN 'analyzing' THEN 2
        WHEN 'embedding' THEN 3
        WHEN 'chunking' THEN 4
        WHEN 'extracting' THEN 5
        WHEN 'pending' THEN 6
        WHEN 'failed' THEN 7
        ELSE 8
    END;

-- Position과 Status의 교차 집계
SELECT
    p.title as position,
    COUNT(*) as total,
    COUNT(CASE WHEN a.status = 'pending' THEN 1 END) as pending,
    COUNT(CASE WHEN a.status = 'in_review' THEN 1 END) as in_review,
    COUNT(CASE WHEN a.status = 'interviewed' THEN 1 END) as interviewed,
    COUNT(CASE WHEN a.status = 'hired' THEN 1 END) as hired,
    COUNT(CASE WHEN a.status = 'rejected' THEN 1 END) as rejected
FROM positions p
LEFT JOIN applicants a ON p.id = a.position_id
GROUP BY p.title
ORDER BY total DESC;

-- 질의응답 통계 (타입 캐스팅 추가)
SELECT
    COUNT(*) as total_questions,
    COUNT(CASE WHEN is_good_case = true THEN 1 END) as good_cases,
    COUNT(CASE WHEN is_good_case = false THEN 1 END) as bad_cases,
    ROUND(AVG(relevance_score)::numeric, 2) as avg_relevance_score,  --  ::numeric 추가
    ROUND(AVG(feedback_rating)::numeric, 1) as avg_rating,            --  ::numeric 추가
    COUNT(DISTINCT resume_id) as resumes_with_qa
FROM qa_history;

-- 가장 많이 질문받은 이력서
SELECT
    a.id as applicant_id,
    a.name,
    a.position,
    COUNT(qa.id) as question_count,
    COUNT(CASE WHEN qa.is_good_case = true THEN 1 END) as good_answers,
    ROUND(AVG(qa.relevance_score)::numeric, 2) as avg_relevance  --  수정
FROM applicants a
JOIN resumes r ON a.id = r.applicant_id
JOIN qa_history qa ON r.id = qa.resume_id
GROUP BY a.id, a.name, a.position
ORDER BY question_count DESC
LIMIT 10;

-- Vector Store 통계
SELECT
    COUNT(*) as total_chunks,
    COUNT(DISTINCT doc_id) as unique_documents,
    ROUND(AVG(LENGTH(content)), 0) as avg_chunk_length,
    MAX(chunk_index) + 1 as max_chunks_per_doc
FROM vector_store;

-- 문서별 청크 수
SELECT
    doc_id,
    doc_name,
    COUNT(*) as chunk_count,
    SUM(LENGTH(content)) as total_text_length
FROM vector_store
GROUP BY doc_id, doc_name
ORDER BY chunk_count DESC

-- 월별 인기 스킬 변화
SELECT
    TO_CHAR(a.created_at, 'YYYY-MM') as month,
    jsonb_object_keys(ra.skills_summary) as skill,
    COUNT(*) as mention_count
FROM applicants a
JOIN resumes r ON a.id = r.applicant_id
JOIN resume_analysis ra ON r.id = ra.resume_id
WHERE a.created_at >= CURRENT_DATE - INTERVAL '6 months'
  AND ra.skills_summary IS NOT NULL
GROUP BY TO_CHAR(a.created_at, 'YYYY-MM'), skill
ORDER BY month DESC, mention_count DESC;

-- 고급 검색 (여러 조건)
SELECT
    a.id,
    a.name,
    a.position,
    a.score,
    a.experience_years,
    a.status,
    ra.top_tags
FROM applicants a
LEFT JOIN resumes r ON a.id = r.applicant_id
LEFT JOIN resume_analysis ra ON r.id = ra.resume_id
WHERE 1=1
  AND a.position = 'Backend Developer'  -- Position 필터
  AND a.score >= 85  -- 최소 점수
  AND a.experience_years >= 3  -- 최소 경력
  AND a.status IN ('in_review', 'interviewed')  -- 상태 필터
  AND ra.skills_summary ? 'Python'  -- Python 스킬 보유
ORDER BY a.score DESC, a.experience_years DESC
LIMIT 20;

-- 모든 대시보드 데이터를 하나의 JSON으로
SELECT jsonb_build_object(
    'overview', (
        SELECT jsonb_build_object(
            'total_applicants', COUNT(DISTINCT a.id),
            'avg_score', ROUND(AVG(a.score)::numeric, 1),
            'max_score', MAX(a.score),
            'min_score', MIN(a.score),
            'today_applicants', COUNT(DISTINCT CASE WHEN DATE(a.created_at) = CURRENT_DATE THEN a.id END),
            'week_applicants', COUNT(DISTINCT CASE WHEN a.created_at >= DATE_TRUNC('week', CURRENT_DATE) THEN a.id END),
            'month_applicants', COUNT(DISTINCT CASE WHEN a.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN a.id END),
            'avg_experience', ROUND(AVG(a.experience_years)::numeric, 1),
            'completed_resumes', COUNT(DISTINCT CASE WHEN r.processing_status = 'completed' THEN r.id END),
            'processing_resumes', COUNT(DISTINCT CASE WHEN r.processing_status IN ('pending', 'extracting', 'chunking', 'embedding', 'analyzing') THEN r.id END),
            'failed_resumes', COUNT(DISTINCT CASE WHEN r.processing_status = 'failed' THEN r.id END)
        )
        FROM applicants a
        LEFT JOIN resumes r ON a.id = r.applicant_id
    ),

    'by_position', (
        SELECT jsonb_agg(
            jsonb_build_object(
                'position', COALESCE(position, 'Unknown'),
                'count', cnt,
                'avg_score', avg_sc,
                'avg_experience', avg_exp,
                'max_score', max_sc
            ) ORDER BY cnt DESC  --  ORDER BY 추가 가능
        )
        FROM (
            SELECT
                position,
                COUNT(*) as cnt,
                ROUND(AVG(score)::numeric, 1) as avg_sc,
                ROUND(AVG(experience_years)::numeric, 1) as avg_exp,
                MAX(score) as max_sc
            FROM applicants
            WHERE position IS NOT NULL
            GROUP BY position
            ORDER BY cnt DESC
            LIMIT 10
        ) t
    ),

    'by_status', (
        SELECT jsonb_agg(
            jsonb_build_object(
                'status', status,
                'count', cnt,
                'percentage', pct,
                'avg_score', avg_sc
            ) ORDER BY cnt DESC
        )
        FROM (
            SELECT
                status,
                COUNT(*) as cnt,
                ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as pct,
                ROUND(AVG(score)::numeric, 1) as avg_sc
            FROM applicants
            GROUP BY status
        ) t
    ),

    'top_skills', (
        SELECT jsonb_agg(
            jsonb_build_object(
                'skill', skill_name,
                'count', mention_count,
                'avg_score', avg_score,
                'percentage', percentage
            ) ORDER BY mention_count DESC
        )
        FROM (
            SELECT
                skill.key as skill_name,
                COUNT(*) as mention_count,
                ROUND(AVG((skill.value)::text::numeric), 1) as avg_score,
                ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentage
            FROM resume_analysis ra,
                 jsonb_each(ra.skills_summary) as skill
            WHERE ra.skills_summary IS NOT NULL
            GROUP BY skill.key
            ORDER BY mention_count DESC
            LIMIT 10
        ) t
    ),

    'recent_applicants', (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', a.id,
                'name', a.name,
                'position', a.position,
                'score', a.score,
                'status', a.status,
                'experience_years', a.experience_years,
                'processing_status', r.processing_status,
                'created_at', a.created_at
            ) ORDER BY a.created_at DESC
        )
        FROM (
            SELECT a.id, a.name, a.position, a.score, a.status,
                   a.experience_years, a.created_at, r.processing_status
            FROM applicants a
            LEFT JOIN resumes r ON a.id = r.applicant_id
            ORDER BY a.created_at DESC
            LIMIT 10
        ) a
        JOIN resumes r ON a.id = r.applicant_id
    ),

    'top_candidates', (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', id,
                'name', name,
                'position', position,
                'score', score,
                'experience_years', experience_years,
                'top_tags', top_tags
            ) ORDER BY score DESC
        )
        FROM (
            SELECT
                a.id, a.name, a.position, a.score,
                a.experience_years, ra.top_tags
            FROM applicants a
            LEFT JOIN resumes r ON a.id = r.applicant_id
            LEFT JOIN resume_analysis ra ON r.id = ra.resume_id
            WHERE a.score IS NOT NULL
            ORDER BY a.score DESC
            LIMIT 10
        ) t
    ),

    'daily_trend', (
        SELECT jsonb_agg(
            jsonb_build_object(
                'date', date,
                'count', cnt,
                'avg_score', avg_sc
            ) ORDER BY date
        )
        FROM (
            SELECT
                DATE(created_at) as date,
                COUNT(*) as cnt,
                ROUND(AVG(score)::numeric, 1) as avg_sc
            FROM applicants
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY DATE(created_at)
            ORDER BY date
        ) t
    ),

    'processing_status', (
        SELECT jsonb_agg(
            jsonb_build_object(
                'status', processing_status,
                'count', cnt,
                'percentage', pct
            ) ORDER BY cnt DESC
        )
        FROM (
            SELECT
                processing_status,
                COUNT(*) as cnt,
                ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as pct
            FROM resumes
            GROUP BY processing_status
        ) t
    )

) as dashboard_data;
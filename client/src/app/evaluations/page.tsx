'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Evaluation = {
  id: number;
  applicant_id: number;
  applicant_name: string;
  position_title: string;
  evaluator: string;
  score: number;
  recommendation: string;
  feedback: string;
  created_at: string;
};

type EvaluationsResponse = {
  evaluations: Evaluation[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
  filters: {
    available_evaluators: string[];
  };
};

export default function EvaluationsPage() {
  const router = useRouter();
  
  const [data, setData] = useState<EvaluationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 필터 상태
  const [selectedEvaluator, setSelectedEvaluator] = useState<string>('');
  const [minScore, setMinScore] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(0);
  
  const ITEMS_PER_PAGE = 20;

  // 평가 목록 로드
  const loadEvaluations = () => {
    setLoading(true);
    
    const params = new URLSearchParams();
    if (selectedEvaluator) {
      params.set('evaluator', selectedEvaluator);
    }
    if (minScore > 0) {
      params.set('min_score', minScore.toString());
    }
    params.set('limit', ITEMS_PER_PAGE.toString());
    params.set('offset', (currentPage * ITEMS_PER_PAGE).toString());

    fetch(`/api/evaluations?${params.toString()}`)
      .then(res => res.json())
      .then((responseData: EvaluationsResponse) => {
        setData(responseData);
        setLoading(false);
      })
      .catch(err => {
        console.error('평가 목록 로딩 실패:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadEvaluations();
  }, [selectedEvaluator, minScore, currentPage]);

  const handleDelete = async (evaluationId: number) => {
    if (!confirm('이 평가를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/feedback/${evaluationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('평가가 삭제되었습니다.');
        loadEvaluations();
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('평가 삭제 실패:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const getRecommendationBadge = (recommendation: string) => {
    const badges: Record<string, { bg: string; text: string; icon: string }> = {
      '강력 추천': { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: '🌟' },
      '추천': { bg: 'bg-blue-100', text: 'text-blue-700', icon: '👍' },
      '보류': { bg: 'bg-amber-100', text: 'text-amber-700', icon: '🤔' },
      '거부': { bg: 'bg-red-100', text: 'text-red-700', icon: '❌' },
    };

    const badge = badges[recommendation] || { bg: 'bg-slate-100', text: 'text-slate-700', icon: '📝' };

    return (
      <span className={`inline-flex items-center gap-1 rounded-full ${badge.bg} px-3 py-1 text-xs font-semibold ${badge.text}`}>
        <span>{badge.icon}</span>
        <span>{recommendation}</span>
      </span>
    );
  };

  return (
    <div className="flex h-full flex-col gap-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">평가 관리</h1>
          <p className="mt-2 text-sm text-slate-600">
            모든 지원자 평가를 확인하고 관리할 수 있습니다.
          </p>
        </div>
        
        {data && (
          <div className="rounded-xl border border-[#E6E6E7] bg-white px-4 py-2">
            <p className="text-sm text-slate-600">
              총 <span className="font-bold text-indigo-600">{data.pagination.total}</span>개 평가
            </p>
          </div>
        )}
      </div>

      {/* 필터 */}
      <div className="flex gap-4 rounded-2xl border border-[#E6E6E7] bg-white p-4">
        <div className="flex-1">
          <label className="mb-2 block text-xs font-semibold text-slate-700">
            평가자 필터
          </label>
          <select
            value={selectedEvaluator}
            onChange={e => {
              setSelectedEvaluator(e.target.value);
              setCurrentPage(0);
            }}
            className="w-full rounded-lg border border-[#E6E6E7] px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">전체 평가자</option>
            {data?.filters.available_evaluators.map(evaluator => (
              <option key={evaluator} value={evaluator}>
                {evaluator}
              </option>
            ))}
          </select>
        </div>

        <div className="w-48">
          <label className="mb-2 block text-xs font-semibold text-slate-700">
            최소 점수
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="5"
            value={minScore}
            onChange={e => {
              setMinScore(parseInt(e.target.value) || 0);
              setCurrentPage(0);
            }}
            className="w-full rounded-lg border border-[#E6E6E7] px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            placeholder="0"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={() => {
              setSelectedEvaluator('');
              setMinScore(0);
              setCurrentPage(0);
            }}
            className="rounded-lg border border-[#E6E6E7] bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            필터 초기화
          </button>
        </div>
      </div>

      {/* 평가 목록 */}
      <div className="flex-1 overflow-auto rounded-2xl border border-[#E6E6E7] bg-white">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-slate-600">평가 목록을 불러오는 중...</p>
          </div>
        ) : !data || data.evaluations.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-500">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">평가 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E6E6E7]">
            {/* 테이블 헤더 */}
            <div className="grid grid-cols-12 gap-4 bg-slate-50 px-6 py-3 text-xs font-semibold text-slate-600">
              <div className="col-span-2">지원자</div>
              <div className="col-span-2">포지션</div>
              <div className="col-span-1">평가자</div>
              <div className="col-span-1">점수</div>
              <div className="col-span-1">추천</div>
              <div className="col-span-3">피드백</div>
              <div className="col-span-1">평가일</div>
              <div className="col-span-1 text-right">액션</div>
            </div>

            {/* 테이블 바디 */}
            {data.evaluations.map(evaluation => (
              <div
                key={evaluation.id}
                className="grid grid-cols-12 gap-4 px-6 py-4 text-sm transition hover:bg-slate-50"
              >
                {/* 지원자 */}
                <div className="col-span-2">
                  <button
                    onClick={() => router.push(`/candidates?candidateId=${evaluation.applicant_id}`)}
                    className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                  >
                    {evaluation.applicant_name}
                  </button>
                </div>

                {/* 포지션 */}
                <div className="col-span-2 truncate text-slate-600">
                  {evaluation.position_title}
                </div>

                {/* 평가자 */}
                <div className="col-span-1">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                    {evaluation.evaluator}
                  </span>
                </div>

                {/* 점수 */}
                <div className="col-span-1">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                    {evaluation.score}
                  </span>
                </div>

                {/* 추천 */}
                <div className="col-span-1">
                  {getRecommendationBadge(evaluation.recommendation)}
                </div>

                {/* 피드백 */}
                <div className="col-span-3">
                  <p className="line-clamp-2 text-xs text-slate-600">
                    {evaluation.feedback}
                  </p>
                </div>

                {/* 평가일 */}
                <div className="col-span-1 text-xs text-slate-500">
                  {new Date(evaluation.created_at).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  })}
                </div>

                {/* 액션 */}
                <div className="col-span-1 flex justify-end gap-2">
                  <button
                    onClick={() => handleDelete(evaluation.id)}
                    className="rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      {data && data.pagination.total > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between rounded-2xl border border-[#E6E6E7] bg-white px-6 py-4">
          <p className="text-sm text-slate-600">
            {currentPage * ITEMS_PER_PAGE + 1} -{' '}
            {Math.min((currentPage + 1) * ITEMS_PER_PAGE, data.pagination.total)} / {data.pagination.total}개
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              className="rounded-lg border border-[#E6E6E7] bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              이전
            </button>
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={!data.pagination.has_more}
              className="rounded-lg border border-[#E6E6E7] bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

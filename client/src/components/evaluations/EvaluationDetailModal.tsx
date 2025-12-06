'use client';

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

type EvaluationDetailModalProps = {
  evaluation: Evaluation;
  onClose: () => void;
};

export default function EvaluationDetailModal({
  evaluation,
  onClose,
}: EvaluationDetailModalProps) {
  const getRecommendationColor = (recommendation: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      '강력 추천': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
      '추천': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
      '보류': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
      '거부': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    };
    return colors[recommendation] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
  };

  const colors = getRecommendationColor(evaluation.recommendation);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl border border-[#E6E6E7] bg-white shadow-xl">
        {/* 헤더 */}
        <div className="sticky top-0 border-b border-[#E6E6E7] bg-white px-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">평가 상세</h2>
              <p className="mt-1 text-sm text-slate-600">
                {new Date(evaluation.created_at).toLocaleString('ko-KR')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 컨텐츠 */}
        <div className="space-y-6 p-6">
          {/* 지원자 정보 */}
          <div className="rounded-xl border border-[#E6E6E7] bg-slate-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">지원자 정보</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500">이름</p>
                <p className="mt-1 font-semibold text-slate-900">{evaluation.applicant_name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">포지션</p>
                <p className="mt-1 font-semibold text-slate-900">{evaluation.position_title}</p>
              </div>
            </div>
          </div>

          {/* 평가자 정보 */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">평가자</h3>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {evaluation.evaluator}
            </span>
          </div>

          {/* 점수 */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-700">평가 점수</h3>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-indigo-500 bg-indigo-50">
                <span className="text-3xl font-bold text-indigo-700">{evaluation.score}</span>
              </div>
              <div className="h-3 flex-1 rounded-full bg-slate-200">
                <div
                  className="h-3 rounded-full bg-indigo-600 transition-all"
                  style={{ width: `${evaluation.score}%` }}
                />
              </div>
            </div>
          </div>

          {/* 추천 여부 */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">추천 여부</h3>
            <div className={`rounded-xl border ${colors.border} ${colors.bg} p-4`}>
              <p className={`text-lg font-bold ${colors.text}`}>{evaluation.recommendation}</p>
            </div>
          </div>

          {/* 피드백 */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">종합 피드백</h3>
            <div className="rounded-xl border border-[#E6E6E7] bg-white p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {evaluation.feedback}
              </p>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="sticky bottom-0 border-t border-[#E6E6E7] bg-white px-6 py-4">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-full border border-[#E6E6E7] bg-white px-6 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

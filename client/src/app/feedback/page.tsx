'use client';

import { useEffect, useState } from 'react';

type Applicant = {
  id: string;
  name: string;
  email: string;
  positionTitle: string;
  department: string;
  score: number;
  status: string;
};

type FeedbackForm = {
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  cultureFitScore: number;
  strengths: string;
  weaknesses: string;
  comments: string;
  recommendation: 'hire' | 'maybe' | 'reject' | '';
};

export default function FeedbackPage() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [feedback, setFeedback] = useState<FeedbackForm>({
    overallScore: 0,
    technicalScore: 0,
    communicationScore: 0,
    cultureFitScore: 0,
    strengths: '',
    weaknesses: '',
    comments: '',
    recommendation: '',
  });

  // 지원자 목록 로드
  useEffect(() => {
    fetch('/api/applicants')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setApplicants(list);
        if (list.length > 0) {
          setSelectedApplicant(list[0]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load applicants:', err);
        setLoading(false);
      });
  }, []);

  // 폼 필드 변경 핸들러
  const handleFieldChange = (field: keyof FeedbackForm, value: any) => {
    setFeedback(prev => ({ ...prev, [field]: value }));
  };

  // 피드백 저장
  const handleSubmit = async () => {
    if (!selectedApplicant) return;

    setSaving(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantId: selectedApplicant.id,
          ...feedback,
        }),
      });

      if (response.ok) {
        alert('피드백이 저장되었습니다!');
        // 폼 초기화
        setFeedback({
          overallScore: 0,
          technicalScore: 0,
          communicationScore: 0,
          cultureFitScore: 0,
          strengths: '',
          weaknesses: '',
          comments: '',
          recommendation: '',
        });
      } else {
        alert('저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to save feedback:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-slate-600">데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Interview Feedback</h1>
        <p className="mt-2 text-sm text-slate-600">
          지원자의 이력서를 검토하고 면접 피드백을 작성하세요.
        </p>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        {/* 왼쪽: 지원자 목록 */}
        <div className="flex flex-col rounded-2xl border border-[#E6E6E7] bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            지원자 목록
          </h2>

          <div className="flex-1 space-y-2 overflow-y-auto">
            {applicants.length === 0 ? (
              <p className="text-sm text-slate-500">지원자가 없습니다.</p>
            ) : (
              applicants.map(applicant => (
                <button
                  key={applicant.id}
                  onClick={() => setSelectedApplicant(applicant)}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    selectedApplicant?.id === applicant.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-[#E6E6E7] bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                      {applicant.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">
                        {applicant.name}
                      </p>
                      <p className="truncate text-xs text-slate-600">
                        {applicant.positionTitle} · {applicant.department}
                      </p>
                    </div>
                    <div className="flex-none">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700">
                        {applicant.score}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* 오른쪽: 피드백 폼 */}
        <div className="flex flex-col gap-4">
          {/* 지원자 정보 */}
          {selectedApplicant && (
            <div className="rounded-2xl border border-[#E6E6E7] bg-white p-6">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">
                지원자 정보
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">이름</p>
                  <p className="font-semibold text-slate-900">
                    {selectedApplicant.name}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">이메일</p>
                  <p className="font-semibold text-slate-900">
                    {selectedApplicant.email}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">지원 포지션</p>
                  <p className="font-semibold text-slate-900">
                    {selectedApplicant.positionTitle}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">부서</p>
                  <p className="font-semibold text-slate-900">
                    {selectedApplicant.department}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 피드백 작성 폼 */}
          <div className="flex-1 overflow-y-auto rounded-2xl border border-[#E6E6E7] bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              면접 피드백 작성
            </h2>

            <div className="space-y-6">
              {/* 점수 평가 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    종합 점수 (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={feedback.overallScore}
                    onChange={e =>
                      handleFieldChange('overallScore', parseInt(e.target.value) || 0)
                    }
                    className="w-full rounded-lg border border-[#E6E6E7] px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    기술 역량 (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={feedback.technicalScore}
                    onChange={e =>
                      handleFieldChange('technicalScore', parseInt(e.target.value) || 0)
                    }
                    className="w-full rounded-lg border border-[#E6E6E7] px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    의사소통 (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={feedback.communicationScore}
                    onChange={e =>
                      handleFieldChange('communicationScore', parseInt(e.target.value) || 0)
                    }
                    className="w-full rounded-lg border border-[#E6E6E7] px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    문화 적합성 (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={feedback.cultureFitScore}
                    onChange={e =>
                      handleFieldChange('cultureFitScore', parseInt(e.target.value) || 0)
                    }
                    className="w-full rounded-lg border border-[#E6E6E7] px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* 강점 */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  강점 (Strengths)
                </label>
                <textarea
                  rows={4}
                  value={feedback.strengths}
                  onChange={e => handleFieldChange('strengths', e.target.value)}
                  placeholder="지원자의 강점을 구체적으로 작성하세요..."
                  className="w-full rounded-lg border border-[#E6E6E7] px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* 약점 */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  약점 / 개선점 (Weaknesses)
                </label>
                <textarea
                  rows={4}
                  value={feedback.weaknesses}
                  onChange={e => handleFieldChange('weaknesses', e.target.value)}
                  placeholder="개선이 필요한 부분을 작성하세요..."
                  className="w-full rounded-lg border border-[#E6E6E7] px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* 종합 코멘트 */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  종합 의견 (Comments)
                </label>
                <textarea
                  rows={6}
                  value={feedback.comments}
                  onChange={e => handleFieldChange('comments', e.target.value)}
                  placeholder="전반적인 면접 소감과 추가 의견을 작성하세요..."
                  className="w-full rounded-lg border border-[#E6E6E7] px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* 최종 추천 */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  최종 추천
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleFieldChange('recommendation', 'hire')}
                    className={`flex-1 rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                      feedback.recommendation === 'hire'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-[#E6E6E7] bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    ✅ 채용 추천
                  </button>
                  <button
                    onClick={() => handleFieldChange('recommendation', 'maybe')}
                    className={`flex-1 rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                      feedback.recommendation === 'maybe'
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-[#E6E6E7] bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🤔 보류
                  </button>
                  <button
                    onClick={() => handleFieldChange('recommendation', 'reject')}
                    className={`flex-1 rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                      feedback.recommendation === 'reject'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-[#E6E6E7] bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    ❌ 불합격
                  </button>
                </div>
              </div>

              {/* 저장 버튼 */}
              <div className="flex justify-end gap-3 border-t border-[#E6E6E7] pt-6">
                <button
                  onClick={() => {
                    setFeedback({
                      overallScore: 0,
                      technicalScore: 0,
                      communicationScore: 0,
                      cultureFitScore: 0,
                      strengths: '',
                      weaknesses: '',
                      comments: '',
                      recommendation: '',
                    });
                  }}
                  className="rounded-full border border-[#E6E6E7] bg-white px-6 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  초기화
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving || !selectedApplicant || !feedback.recommendation}
                  className="rounded-full bg-indigo-600 px-8 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? '저장 중...' : '피드백 저장'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

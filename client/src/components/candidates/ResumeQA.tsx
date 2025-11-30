// src/components/candidates/ResumeQA.tsx
'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

type QAItem = {
  question: string;
  answer: string;
  sources: string[];
  relevance_score: number;
  timestamp: Date;
};

type ResumeQAProps = {
  resumeId: string;
  candidateName: string;
};

export default function ResumeQA({ resumeId, candidateName }: ResumeQAProps) {
  const [question, setQuestion] = useState('');
  const [qaHistory, setQAHistory] = useState<QAItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.ask(resumeId, question) as any;

      // 응답에서 첫 번째 answer 추출 (resume_ids 배열로 보냈으므로 answers 배열이 옴)
      const firstAnswer = response.answers?.[0];

      if (firstAnswer) {
        const newQA: QAItem = {
          question: question,
          answer: firstAnswer.answer,
          sources: firstAnswer.sources || [],
          relevance_score: firstAnswer.relevance_score || 0,
          timestamp: new Date(),
        };

        setQAHistory([newQA, ...qaHistory]);
        setQuestion('');
      }
    } catch (err: any) {
      console.error('질문 처리 실패:', err);
      setError(err.message || '질문 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[#E6E6E7] bg-white p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">
          이력서 Q&amp;A
        </h3>
        <span className="text-xs text-slate-500">
          {candidateName}님의 이력서에 대해 질문하세요
        </span>
      </div>

      {/* 질문 입력 폼 */}
      <form onSubmit={handleAskQuestion} className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="예: 이 지원자의 주요 기술 스택은 무엇인가요?"
          className="flex-1 rounded-lg border border-[#E6E6E7] px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>분석중...</span>
            </div>
          ) : (
            '질문하기'
          )}
        </button>
      </form>

      {/* 에러 메시지 */}
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Q&A 히스토리 */}
      <div className="space-y-4">
        {qaHistory.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">
            아직 질문이 없습니다. 위에서 질문을 입력해보세요.
          </div>
        ) : (
          qaHistory.map((qa, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-[#E6E6E7] bg-slate-50 p-4"
            >
              {/* 질문 */}
              <div className="mb-3 flex items-start gap-2">
                <div className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                  Q
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {qa.question}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {qa.timestamp.toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {/* 답변 */}
              <div className="ml-8 rounded-lg bg-white p-3">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
                    A
                  </div>
                  <span className="text-xs font-medium text-slate-600">
                    AI 답변
                    {qa.relevance_score > 0 && (
                      <span className="ml-2 text-[10px] text-slate-400">
                        (관련도: {(qa.relevance_score * 100).toFixed(0)}%)
                      </span>
                    )}
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {qa.answer}
                </p>

                {/* 소스 (참고한 이력서 부분) */}
                {qa.sources.length > 0 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-medium text-indigo-600 hover:text-indigo-700">
                      참고 자료 보기 ({qa.sources.length}개)
                    </summary>
                    <div className="mt-2 space-y-2">
                      {qa.sources.map((source, sidx) => (
                        <div
                          key={sidx}
                          className="rounded border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600"
                        >
                          {source.length > 200
                            ? source.substring(0, 200) + '...'
                            : source}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// src/components/dashboard/RecommendedCandidates.tsx
'use client';

import { useRouter } from 'next/navigation';
import type { Candidate } from '@/types/candidate';

interface RecommendedCandidatesProps {
  candidates: Candidate[];
}

export default function RecommendedCandidates({
  candidates,
}: RecommendedCandidatesProps) {
  const router = useRouter();

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div className="rounded-2xl border border-[#E6E6E7] bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold text-slate-900">
        Recommended Candidates
      </h2>

      {candidates.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-[#E6E6E7] bg-slate-50 text-sm text-slate-500">
          추천할 지원자가 없습니다.
        </div>
      ) : (
        <ul className="space-y-3">
          {candidates.map((c) => (
            <li
              key={c.id}
              className="
                flex items-center justify-between
                rounded-xl border border-[#E6E6E7] bg-white px-4 py-3
                transition-colors
                hover:border-emerald-500
              "
            >
              {/* 왼쪽: 아바타 + 정보 */}
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                  {c.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    {c.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {c.email}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <p className="text-xs text-slate-500">{c.role}</p>
                    {c.createdAt && (
                      <>
                        <span className="text-slate-300">·</span>
                        <p className="text-xs text-slate-400">
                          {formatDate(c.createdAt)}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* 오른쪽: 점수 + 버튼 */}
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500 bg-emerald-50 text-xs font-semibold text-emerald-600">
                  {c.score}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    // positionId도 함께 전달 (있을 경우)
                    const params = new URLSearchParams();
                    if (c.positionId) {
                      params.set('positionId', c.positionId);
                    }
                    params.set('candidateId', c.id);
                    router.push(`/candidates?${params.toString()}`, {
                      scroll: false,
                    });
                  }}
                  className="rounded-full border border-[#E6E6E7] bg-white px-4 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                >
                  View
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

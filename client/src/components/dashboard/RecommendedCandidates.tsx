// src/components/dashboard/RecommendedCandidates.tsx
'use client';

import type { Candidate } from '@/types/candidate';

interface RecommendedCandidatesProps {
  candidates: Candidate[];
}

export default function RecommendedCandidates({
  candidates,
}: RecommendedCandidatesProps) {
  return (
    // 🔹 카드 전체
    <div className="flex flex-col h-full max-h-[546px] rounded-2xl border border-[#E6E6E7] bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold text-slate-900">
        Recommended Candidates
      </h2>

      {/* 🔽 내용 영역: 일정 높이까지만 보여주고 넘치면 스크롤 */}
      <div className="flex-1 max-h-[460px] overflow-y-auto pr-1">
        {candidates.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-[#E6E6E7] bg-slate-50 text-sm text-slate-500">
            추천할 지원자가 없습니다.
          </div>
        ) : (
          <ul className="space-y-3">
            {candidates.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-[#E6E6E7] bg-white px-4 py-3 transition hover:shadow-sm"
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
                    <p className="mt-0.5 text-xs text-slate-500">{c.role}</p>
                  </div>
                </div>

                {/* 오른쪽: 점수 + 버튼 */}
                <div className="flex items-center gap-3">
                  <span className=" inline-flex h-12 w-12 items-center justify-center rounded-full border-4 border-emerald-500 bg-[#ECFDF5] text-md font-semibold text-emerald-600 ">
                    {c.score}
                  </span>
                  <button
                    type="button"
                    className="rounded-full border border-[#E6E6E7] bg-[white] px-4 py-1.5 text-xs font-semibold text-slate-900  hover:bg-slate-50"
                  >
                    View
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

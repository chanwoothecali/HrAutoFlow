'use client';

import type { Candidate } from '@/types/candidate';

type CandidateCardProps = Pick<Candidate, 'name' | 'role' | 'score' | 'skills'>;

export default function CandidateCard({
  name,
  role,
  score,
  skills,
}: CandidateCardProps) {
  return (
    <li className="flex items-center justify-between gap-x-6 py-5 border-b last:border-b-0 border-gray-200">
      <div className="flex min-w-0 gap-x-4">
        {/* 프로필 이미지 (임시로 첫 글자 아바타) */}
        <div className="size-12 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-lg">
          {name.charAt(0)}
        </div>

        <div className="min-w-0 flex-auto">
          <p className="text-sm font-semibold text-gray-900">{name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{role}</p>

          <div className="flex gap-2 mt-2">
            {skills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-x-4">
        {/* AI 점수 */}
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold">
          {score}
        </span>

        {/* 상세보기 버튼 */}
        <button className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50">
          View
        </button>
      </div>
    </li>
  );
}

'use client';

import { useEffect, useState } from 'react';
import type { CandidateDetail } from '@/types/candidate';

interface CandidateOverviewProps {
  candidate: CandidateDetail;
}

function SkillBar({ label, score }: { label: string; score: number }) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    // 처음 렌더링 이후에 0 → 실제 점수로 변경하면서 애니메이션
    requestAnimationFrame(() => {
      setDisplayScore(score);
    });
  }, [score]);

  return (
    <div className="flex items-center gap-3 text-xs">
      <div className="w-20 text-right text-slate-600">{label}</div>
      <div className="flex-1">
        <div className="relative h-2 w-full rounded-full bg-slate-200">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-indigo-500
                       transition-[width] duration-500 ease-out"
            style={{ width: `${displayScore}%` }}
          />
        </div>
      </div>
      <div className="w-10 text-right text-slate-600">{score}%</div>
    </div>
  );
}

export default function CandidateOverview({
  candidate,
}: CandidateOverviewProps) {
  const overview = candidate.sections?.overview;

  if (!overview) {
    // 혹시 API에서 overview가 빠져있을 때를 대비한 가드
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
        Overview 정보가 없습니다.
      </div>
    );
  }

  return (
    // 👇 바깥 카드: 테두리 1겹
    <div className="flex flex-1 rounded-2xl border border-[#E6E6E7] bg-white overflow-hidden">
      {/* LEFT: Recommendation / Status / Keywords / Sections */}
      <aside className="w-full max-w-xs border-r border-[#E6E6E7] bg-[#F8FAFF] p-5">
        {/* 이름/타이틀 */}
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
            {candidate.name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {candidate.name}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {candidate.title} · {candidate.experienceLabel} ·{' '}
              {candidate.degree}
            </p>
          </div>
        </div>

        <h3 className="mb-3 text-xs font-semibold uppercase text-slate-500">
          Recommendation
        </h3>
        <p className="mb-5 text-sm text-slate-800">{overview.recommendation}</p>

        <div className="mb-4 space-y-2 text-sm">
          <div>
            <p className="text-[11px] font-semibold uppercase text-slate-500">
              Status
            </p>
            <div className="mt-1 rounded-lg border border-[#E6E6E7] bg-white px-3 py-2 text-xs text-slate-800">
              {candidate.status}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase text-slate-500">
              Experience
            </p>
            <div className="mt-1 rounded-lg border border-[#E6E6E7] bg-white px-3 py-2 text-xs text-slate-800">
              {candidate.experienceLabel}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase text-slate-500">
              Keywords
            </p>
            <div className="mt-1 flex flex-wrap gap-2">
              {candidate.keywords.map((kw) => (
                <span
                  key={kw}
                  className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase text-slate-500">
            Sections
          </p>
          <button className="flex w-full items-center justify-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
            Overview
          </button>
          <button className="mt-2 flex w-full items-center justify-center rounded-full border border-[#D1D5DB] bg-white px-4 py-2 text-sm font-semibold text-slate-800">
            +Ask
          </button>
        </div>
      </aside>

      {/* RIGHT: Overview 상세 내용 */}
      <section className="flex-1 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Overview</h2>
            <p className="mt-2 text-sm text-slate-800">{overview.summary}</p>
          </div>
          <span
            className="flex h-12 w-12 flex-none items-center justify-center
             rounded-full border-2 border-emerald-500 bg-emerald-50
             text-sm font-semibold text-emerald-600"
          >
            {candidate.score}
          </span>
        </div>

        {/* Summary skill bars */}
        <div className="mt-6">
          <h3 className="text-xs font-semibold uppercase text-slate-500">
            Summary
          </h3>
          <div className="mt-3 space-y-3">
            {overview.summaryChart.map((item) => (
              <SkillBar
                key={item.skill}
                label={item.skill}
                score={item.score}
              />
            ))}
          </div>
        </div>

        {/* Strength */}
        <div className="mt-6">
          <h3 className="text-xs font-semibold uppercase text-slate-500">
            Strength
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-800">
            {overview.strength.map((s, idx) => (
              <li key={idx}>{s}</li>
            ))}
          </ul>
        </div>

        {/* Work Experience */}
        <div className="mt-6">
          <h3 className="text-xs font-semibold uppercase text-slate-500">
            Work Experience
          </h3>
          <div className="mt-2 space-y-3 text-sm text-slate-800">
            {overview.workExperience.map((w, idx) => (
              <div key={idx}>
                <p className="font-semibold">
                  {w.role}{' '}
                  <span className="font-normal">
                    — {w.company} · {w.period}
                  </span>
                </p>
                <p className="mt-1 whitespace-pre-line text-slate-700">
                  {w.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

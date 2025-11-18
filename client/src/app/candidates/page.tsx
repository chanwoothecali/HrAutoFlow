'use client';

import { CandidateDetail, Position } from '@/types/candidate';
import { useMemo, useState } from 'react';

// --- 임시 Mock 데이터 (나중에 Mockoon / API 연동 가능) ---
const positions: Position[] = [
  { id: 'p1', title: 'Backend Developer', applicants: 10 },
  { id: 'p2', title: 'Data Engineer', applicants: 7 },
  { id: 'p3', title: 'ML Engineer', applicants: 5 },
];

const candidates: CandidateDetail[] = [
  {
    id: 'c1',
    positionId: 'p1',
    name: 'David Lee',
    title: 'Software Engineer',
    experience: '3y',
    degree: 'Bachelor',
    score: 100,
    topSkills: ['Python', 'SQL', 'REST', 'Docker'],
  },
  {
    id: 'c2',
    positionId: 'p1',
    name: 'Hana Kim',
    title: 'Data Engineer',
    experience: '5y',
    degree: 'Master',
    score: 78,
    topSkills: ['ETL', 'Airflow', 'Python'],
  },
  {
    id: 'c3',
    positionId: 'p2',
    name: 'Sunny Choi',
    title: 'ML Engineer',
    experience: '4y',
    degree: 'Master',
    score: 76,
    topSkills: ['Python', 'PyTorch', 'SQL'],
  },
];

export default function CandidatesDetailPage() {
  const [selectedPositionId, setSelectedPositionId] = useState(positions[0].id);

  const filteredCandidates = useMemo(
    () => candidates.filter((c) => c.positionId === selectedPositionId),
    [selectedPositionId]
  );

  const [selectedCandidateId, setSelectedCandidateId] = useState(
    filteredCandidates[0]?.id ?? candidates[0].id
  );

  const selectedCandidate =
    filteredCandidates.find((c) => c.id === selectedCandidateId) ??
    filteredCandidates[0] ??
    candidates[0];

  return (
    <div className="flex min-h-[calc(100vh-120px)] flex-col gap-6">
      {/* 제목 */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">지원자 상세</h1>
        <p className="mt-2 text-slate-600">
          포지션별 지원자 목록과 AI 추천 결과를 상세히 확인할 수 있습니다.
        </p>
      </div>
      {/* ====== 지원자 상세 3단 레이아웃 ====== */}
      <section className="mt-6 flex flex-1 flex-col gap-6 lg:flex-row lg:items-stretch">
        {/* --- LEFT: Position 리스트 --- */}
        <div className="rounded-2xl border border-[#E6E6E7] bg-white p-4 lg:w-64 flex flex-col">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            Position
          </h2>

          <div className="space-y-2">
            {positions.map((pos) => {
              const isActive = pos.id === selectedPositionId;
              return (
                <button
                  key={pos.id}
                  onClick={() => {
                    setSelectedPositionId(pos.id);
                    const first = candidates.find(
                      (c) => c.positionId === pos.id
                    );
                    if (first) setSelectedCandidateId(first.id);
                  }}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition
              ${
                isActive
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-[#E6E6E7] hover:bg-slate-50'
              }`}
                >
                  <p className="font-semibold text-slate-900">{pos.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {pos.applicants} applicants
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* --- CENTER: Candidates 리스트 --- */}
        <div className="rounded-2xl border border-[#E6E6E7] bg-white p-4 lg:w-80 flex flex-col">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            Candidates
          </h2>

          <div className="space-y-3">
            {filteredCandidates.length > 0 ? (
              filteredCandidates.map((c) => {
                const isActive = c.id === selectedCandidateId;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCandidateId(c.id)}
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition
                ${
                  isActive
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-[#E6E6E7] hover:bg-slate-50'
                }`}
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{c.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {c.title} · {c.experience} · {c.degree}
                      </p>
                    </div>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-600">
                      {c.score}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-[#E6E6E7] bg-slate-50 text-xs text-slate-500">
                지원자가 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* --- RIGHT: Overview 상세 패널 --- */}
        <div className="rounded-2xl border border-[#E6E6E7] bg-white p-4 lg:p-6 flex-1 flex flex-col">
          {/* 상단 프로필 영역 */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white font-semibold">
                {selectedCandidate.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-slate-900">
                  {selectedCandidate.name}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {selectedCandidate.title} · {selectedCandidate.experience} ·{' '}
                  {selectedCandidate.degree}
                </p>
              </div>
            </div>

            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 font-semibold">
              {selectedCandidate.score}
            </span>
          </div>

          {/* 탭 */}
          <div className="mt-4 flex gap-2 text-xs">
            <button className="rounded-lg bg-slate-900 px-3 py-1 font-semibold text-white">
              Overview
            </button>
            <button className="rounded-lg bg-slate-100 px-3 py-1 text-slate-600">
              Summary
            </button>
            <button className="rounded-lg bg-slate-100 px-3 py-1 text-slate-600">
              Strength
            </button>
            <button className="rounded-lg bg-slate-100 px-3 py-1 text-slate-600">
              Work Experience
            </button>
          </div>

          {/* 아래 내용: 높이 남는 부분 채우고 내부 스크롤 */}
          <div className="mt-4 flex-1 space-y-4 overflow-y-auto pr-2 text-sm">
            <div>
              <h3 className="text-xs font-semibold uppercase text-slate-500">
                RECOMMENDATION
              </h3>
              <p className="mt-1 text-slate-800">
                Backend APIs, data pipelines, and AWS cost optimization에 강점을
                가진 후보입니다.
              </p>
            </div>

            {/* TODO: 여기에 summary / strength / work experience 등 섹션 추가 */}
          </div>
        </div>
      </section>
    </div>
  );
}

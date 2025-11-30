// src/app/candidates/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { CandidateDetail } from '@/types/candidate';
import CandidateOverview from '@/components/candidates/CandidateOverview';
import ResumeQA from '@/components/candidates/ResumeQA';
import type { Position } from '@/types/position';
import { apiClient } from '@/lib/api-client';

type CandidateListItem = {
  id: string;
  positionId: string;
  name: string;
  email?: string;
  title?: string;
  positionTitle?: string;
  department?: string;
  experience?: string;
  degree?: string;
  status?: string;
  score: number;
};

export default function CandidatesDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const candidateIdFromURL = searchParams.get('candidateId');

  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);
  const [candidateList, setCandidateList] = useState<CandidateListItem[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeCandidateId = selectedCandidate?.id ?? candidateIdFromURL ?? null;

  // 1) 포지션 목록 로딩
  useEffect(() => {
    setLoading(true);
    apiClient.positions
      .list()
      .then((data: any) => {
        setPositions(data);
        if (!candidateIdFromURL && data.length > 0) {
          setSelectedPositionId(data[0].id);
        }
      })
      .catch((e) => {
        console.error('포지션 목록 로딩 실패:', e);
        setError('포지션 목록을 불러오는데 실패했습니다.');
      })
      .finally(() => setLoading(false));
  }, [candidateIdFromURL]);

  // 2) URL의 candidateId로 상세 조회
  useEffect(() => {
    if (!candidateIdFromURL) return;

    apiClient.candidates
      .getDetail(candidateIdFromURL)
      .then((detail: any) => {
        setSelectedCandidate(detail);
        setSelectedPositionId(detail.positionId);
      })
      .catch((e) => {
        console.error('지원자 상세 정보 로딩 실패:', e);
        setError('지원자 정보를 불러오는데 실패했습니다.');
      });
  }, [candidateIdFromURL]);

  // 3) 선택된 포지션의 후보 리스트 조회
  useEffect(() => {
    if (!selectedPositionId) return;

    apiClient.positions
      .getCandidates(selectedPositionId)
      .then((list: any) => {
        setCandidateList(list);
        if (!candidateIdFromURL && list.length > 0 && !selectedCandidate) {
          const first = list[0];
          router.replace(`/candidates?candidateId=${first.id}`, {
            scroll: false,
          });
        }
      })
      .catch((e) => {
        console.error('지원자 목록 로딩 실패:', e);
        setError('지원자 목록을 불러오는데 실패했습니다.');
      });
  }, [selectedPositionId, candidateIdFromURL, selectedCandidate, router]);

  const currentPosition = useMemo(
    () => positions.find((p) => p.id === selectedPositionId) ?? positions[0],
    [positions, selectedPositionId]
  );

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-slate-900">지원자 상세</h1>
        <div className="rounded-lg bg-red-50 p-4 text-red-600">{error}</div>
      </div>
    );
  }

  if (loading || positions.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-slate-900">지원자 상세</h1>
        <p className="text-sm text-slate-600">데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-120px)] flex-col gap-6">
      {/* 제목 */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">지원자 상세</h1>
        <p className="mt-2 text-slate-600">
          포지션별 지원자 목록과 AI 추천 결과를 상세히 확인할 수 있습니다.
        </p>
      </div>

      {/* ====== 3단 레이아웃 ====== */}
      <section className="mt-6 flex flex-1 flex-col gap-6 lg:flex-row lg:items-stretch">
        {/* LEFT: Position 리스트 */}
        <div className="flex flex-col rounded-2xl border border-[#E6E6E7] bg-white p-4 lg:w-64">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            Position
          </h2>

          <div className="space-y-2">
            {positions.map((pos) => {
              const isActive = pos.id === currentPosition?.id;
              return (
                <button
                  key={pos.id}
                  onClick={() => {
                    setSelectedPositionId(pos.id);
                  }}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition
                    ${
                      isActive
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-[#E6E6E7] hover:bg-slate-50'
                    }`}
                >
                  <p className="font-semibold text-slate-900">
                    {/* Position 구조: title 사용 */}
                    {pos.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {pos.applicants} applicants
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* CENTER: Candidates 리스트 */}
        <div className="flex flex-col rounded-2xl border border-[#E6E6E7] bg-white p-4 lg:w-80">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            Candidates
          </h2>

          <div className="space-y-3">
            {candidateList.length > 0 ? (
              candidateList.map((c) => {
                const isActive = c.id === activeCandidateId;

                // ① 상단 포지션/타이틀 라벨
                const positionLabel =
                  c.positionTitle ?? c.title ?? currentPosition?.title ?? '';

                // ② 하단 메타 정보 (경력, 학력, 부서, 상태 등 상황에 따라 조합)
                const metaParts: string[] = [];
                if (c.experience) metaParts.push(c.experience);
                if (c.degree) metaParts.push(c.degree);
                // experience/degree 없고 department 있으면 department 표시
                if (!c.experience && !c.degree && c.department)
                  metaParts.push(c.department);

                const metaText = metaParts.join(' · ');

                return (
                  <button
                    key={c.id}
                    onClick={() =>
                      router.push(`/candidates?candidateId=${c.id}`, {
                        scroll: false,
                      })
                    }
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition
                      ${
                        isActive
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-[#E6E6E7] hover:bg-slate-50'
                      }`}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">
                        {c.name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 truncate">
                        {positionLabel}
                        {metaText && ` · ${metaText}`}
                      </p>
                    </div>
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center
             rounded-full border border-emerald-500 bg-emerald-50
             text-xs font-semibold text-emerald-600"
                    >
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

        {/* RIGHT: Overview 패널 */}
        {selectedCandidate ? (
          <div className="flex flex-1 flex-col gap-6 overflow-auto">
            <CandidateOverview candidate={selectedCandidate} />
            {selectedCandidate.resumeId && (
              <ResumeQA
                resumeId={String(selectedCandidate.resumeId)}
                candidateName={selectedCandidate.name}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-[#E6E6E7] bg-white text-sm text-slate-500">
            지원자를 선택해 주세요.
          </div>
        )}
      </section>
    </div>
  );
}

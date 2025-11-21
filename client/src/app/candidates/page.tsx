// src/app/candidates/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { CandidateDetail } from '@/types/candidate';
import CandidateOverview from '@/components/candidates/CandidateOverview';
import type { Position } from '@/types/position';

const API_BASE = '/api';

// /api/positions/[positionId]/candidates 응답 타입
// backend 포지션: title, experience, degree 포함
// data 포지션: email, positionTitle, department, status 포함
type CandidateListItem = {
  id: string;
  positionId: string;
  name: string;

  // 옵션 필드들 (엔드포인트에 따라 다를 수 있음)
  email?: string;
  title?: string; // ex) "Software Engineer"
  positionTitle?: string; // ex) "Data Engineer"
  department?: string; // ex) "Data Platform"
  experience?: string; // ex) "3 years"
  degree?: string; // ex) "Bachelor"
  status?: string; // ex) "In Progress"

  score: number;
};

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API 요청 실패: ${url}`);
  return res.json();
}

export default function CandidatesDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const candidateIdFromURL = searchParams.get('candidateId');

  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(
    null
  );

  const [candidateList, setCandidateList] = useState<CandidateListItem[]>([]);
  const [selectedCandidate, setSelectedCandidate] =
    useState<CandidateDetail | null>(null);

  const activeCandidateId = selectedCandidate?.id ?? candidateIdFromURL ?? null;

  // 1) 포지션 목록은 첫 로딩 때 한 번만
  useEffect(() => {
    fetchJSON<Position[]>(`${API_BASE}/positions`)
      .then((data) => {
        setPositions(data);
        // URL에 candidateId 없으면 첫 포지션 선택
        if (!candidateIdFromURL && data.length > 0) {
          setSelectedPositionId(data[0].id);
        }
      })
      .catch((e) => console.error(e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) URL의 candidateId 가 바뀔 때마다 상세 조회 → positionId 도 함께 세팅
  useEffect(() => {
    if (!candidateIdFromURL) return;

    fetchJSON<CandidateDetail>(`${API_BASE}/candidates/${candidateIdFromURL}`)
      .then((detail) => {
        setSelectedCandidate(detail); // 👉 오른쪽 Overview 내용 업데이트
        setSelectedPositionId(detail.positionId);
      })
      .catch((e) => console.error(e));
  }, [candidateIdFromURL]);

  // 3) 선택된 포지션이 바뀔 때마다 그 포지션의 후보 리스트 조회
  useEffect(() => {
    if (!selectedPositionId) return;

    fetchJSON<CandidateListItem[]>(
      `${API_BASE}/positions/${selectedPositionId}/candidates`
    )
      .then((list) => {
        setCandidateList(list);
        // URL에 candidateId가 없고 아직 선택된 후보도 없으면 첫 후보를 기본 선택
        if (!candidateIdFromURL && list.length > 0 && !selectedCandidate) {
          const first = list[0];
          router.replace(`/candidates?candidateId=${first.id}`, {
            scroll: false,
          });
        }
      })
      .catch((e) => console.error(e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPositionId]);

  const currentPosition = useMemo(
    () => positions.find((p) => p.id === selectedPositionId) ?? positions[0],
    [positions, selectedPositionId]
  );

  // 로딩 중/데이터 없는 경우 간단 처리
  if (positions.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-slate-900">지원자 상세</h1>
        <p className="text-sm text-slate-600">
          포지션 정보를 불러오는 중입니다.
        </p>
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
          <CandidateOverview candidate={selectedCandidate} />
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-[#E6E6E7] bg-white text-sm text-slate-500">
            지원자를 선택해 주세요.
          </div>
        )}
      </section>
    </div>
  );
}

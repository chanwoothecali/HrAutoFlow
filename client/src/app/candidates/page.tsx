// src/app/candidates/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { CandidateDetail } from '@/types/candidate';
import CandidateOverview from '@/components/candidates/CandidateOverview';
import ResumeQA from '@/components/candidates/ResumeQA';
import HumanEvaluation from '@/components/candidates/HumanEvaluation';
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
  status?: string;
  score: number;
  experience?: string;
  degree?: string;
};

export default function CandidatesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const positionIdFromUrl = searchParams.get('positionId');
  const candidateIdFromUrl = searchParams.get('candidateId');

  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(
    positionIdFromUrl
  );

  const [candidateList, setCandidateList] = useState<CandidateListItem[]>([]);
  const [activeCandidateId, setActiveCandidateId] = useState<string | null>(
    candidateIdFromUrl
  );

  const [selectedCandidate, setSelectedCandidate] =
    useState<CandidateDetail | null>(null);

  const [loadingPositions, setLoadingPositions] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // 사이드바 접기 상태
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // 평가 패널 표시 상태
  const [showEvaluation, setShowEvaluation] = useState(false);

  // 평가 모드 토글 핸들러
  const toggleEvaluationMode = () => {
    const newShowEvaluation = !showEvaluation;
    setShowEvaluation(newShowEvaluation);
    
    if (newShowEvaluation) {
      // 평가 모드 켜기: 사이드바 접기
      setSidebarCollapsed(true);
    } else {
      // 평가 모드 끄기: 사이드바 펼치기
      setSidebarCollapsed(false);
    }
  };

  // 1) Positions 로딩
  useEffect(() => {
    apiClient.positions
      .list()
      .then((data: Position[]) => {
        setPositions(data);
        if (!positionIdFromUrl && data.length > 0) {
          const firstId = data[0].id;
          setSelectedPositionId(firstId);
          router.push(`/candidates?positionId=${firstId}`, { scroll: false });
        }
        setLoadingPositions(false);
      })
      .catch((err) => {
        console.error('포지션 목록 로딩 실패:', err);
        setLoadingPositions(false);
      });
  }, [positionIdFromUrl, router]);

  // 2) Candidates 로딩 (positionId 변경 시)
  useEffect(() => {
    if (!selectedPositionId) return;

    setLoadingCandidates(true);
    apiClient.positions
      .getCandidates(selectedPositionId)
      .then((data: CandidateListItem[]) => {
        setCandidateList(data);
        if (!candidateIdFromUrl && data.length > 0) {
          const firstCandidate = data[0];
          setActiveCandidateId(firstCandidate.id);
          router.push(
            `/candidates?positionId=${selectedPositionId}&candidateId=${firstCandidate.id}`,
            { scroll: false }
          );
        }
        setLoadingCandidates(false);
      })
      .catch((err) => {
        console.error('지원자 목록 로딩 실패:', err);
        setLoadingCandidates(false);
      });
  }, [selectedPositionId, candidateIdFromUrl, router]);

  // 3) Candidate Detail 로딩
  useEffect(() => {
    if (!activeCandidateId) {
      setSelectedCandidate(null);
      return;
    }

    setLoadingDetail(true);
    apiClient.candidates
      .getDetail(activeCandidateId)
      .then((detail: CandidateDetail) => {
        setSelectedCandidate(detail);
        setLoadingDetail(false);
      })
      .catch((err) => {
        console.error('지원자 상세 로딩 실패:', err);
        setLoadingDetail(false);
      });
  }, [activeCandidateId]);

  // 4) URL 변경 감지
  useEffect(() => {
    if (positionIdFromUrl && positionIdFromUrl !== selectedPositionId) {
      setSelectedPositionId(positionIdFromUrl);
    }
  }, [positionIdFromUrl, selectedPositionId]);

  useEffect(() => {
    if (candidateIdFromUrl && candidateIdFromUrl !== activeCandidateId) {
      setActiveCandidateId(candidateIdFromUrl);
    }
  }, [candidateIdFromUrl, activeCandidateId]);

  const currentPosition = useMemo(() => {
    return positions.find((p) => p.id === selectedPositionId);
  }, [positions, selectedPositionId]);

  if (loadingPositions) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-slate-600">포지션 목록을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Candidates</h1>

        {selectedCandidate && (
          <button
            onClick={toggleEvaluationMode}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              showEvaluation
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {showEvaluation ? '✓ 평가 모드' : '⭐ 평가하기'}
          </button>
        )}
      </div>

      <section className="flex flex-1 gap-4 overflow-hidden">
        {/* LEFT: Positions (접기 가능) */}
        <div
          className={`flex flex-col rounded-2xl border border-[#E6E6E7] bg-white transition-all duration-300 ${
            sidebarCollapsed ? 'w-12' : 'lg:w-64'
          }`}
        >
          {sidebarCollapsed ? (
            // 접힌 상태
            <button
              onClick={() => {
                setSidebarCollapsed(false);
                // 사이드바 펼칠 때 평가 모드도 끄기
                setShowEvaluation(false);
              }}
              className="flex h-full items-center justify-center text-slate-500 hover:text-slate-900"
              title="펼치기"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            // 펼쳐진 상태
            <div className="flex h-full flex-col p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Positions</h2>
                <button
                  onClick={() => {
                    setSidebarCollapsed(true);
                    // 사이드바 접을 때 평가 모드는 유지
                  }}
                  className="text-slate-400 hover:text-slate-600"
                  title="접기"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>

              <div className="space-y-2 overflow-auto">
                {positions.map((pos) => {
                  const isActive = pos.id === selectedPositionId;
                  return (
                    <button
                      key={pos.id}
                      onClick={() =>
                        router.push(`/candidates?positionId=${pos.id}`, {
                          scroll: false,
                        })
                      }
                      className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition
                        ${
                          isActive
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-[#E6E6E7] hover:bg-slate-50'
                        }`}
                    >
                      <p className="font-semibold text-slate-900 truncate">
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
          )}
        </div>

        {/* CENTER: Candidates 리스트 */}
        {!sidebarCollapsed && (
          <div className="flex flex-col rounded-2xl border border-[#E6E6E7] bg-white p-4 lg:w-80">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              Candidates
            </h2>

            <div className="space-y-3 overflow-auto">
              {loadingCandidates ? (
                <div className="flex h-24 items-center justify-center text-sm text-slate-500">
                  불러오는 중...
                </div>
              ) : candidateList.length > 0 ? (
                candidateList.map((c) => {
                  const isActive = c.id === activeCandidateId;

                  const positionLabel =
                    c.positionTitle ?? c.title ?? currentPosition?.title ?? '';

                  const metaParts: string[] = [];
                  if (c.experience) metaParts.push(c.experience);
                  if (c.degree) metaParts.push(c.degree);
                  if (!c.experience && !c.degree && c.department)
                    metaParts.push(c.department);

                  const metaText = metaParts.join(' · ');

                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        // positionId 유지하면서 candidateId만 변경
                        const params = new URLSearchParams();
                        if (selectedPositionId) {
                          params.set('positionId', selectedPositionId);
                        }
                        params.set('candidateId', c.id);
                        router.push(`/candidates?${params.toString()}`, {
                          scroll: false,
                        });
                      }}
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
        )}

        {/* RIGHT: Overview + QA */}
        {selectedCandidate ? (
          <div className="flex flex-1 flex-col gap-6 overflow-auto">
            {loadingDetail ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                상세 정보를 불러오는 중...
              </div>
            ) : (
              <>
                <CandidateOverview candidate={selectedCandidate} />
                {selectedCandidate.resumeId && (
                  <ResumeQA
                    resumeId={String(selectedCandidate.resumeId)}
                    candidateName={selectedCandidate.name}
                  />
                )}
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-[#E6E6E7] bg-white text-sm text-slate-500">
            지원자를 선택해 주세요.
          </div>
        )}

        {/* FAR RIGHT: 평가 패널 (슬라이드) */}
        {showEvaluation && selectedCandidate && (
          <div className="flex w-96 flex-col animate-slide-in">
            <HumanEvaluation
              candidateId={selectedCandidate.id}
              candidateName={selectedCandidate.name}
              aiScore={selectedCandidate.score}
            />
          </div>
        )}
      </section>
    </div>
  );
}

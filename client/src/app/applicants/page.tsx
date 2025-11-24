// src/app/applicants/page.tsx
'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import type { Position } from '@/types/position';
import { apiClient } from '@/lib/api-client';

type ApplicantListItem = {
  id: string;
  name: string;
  email: string;
  positionId: string;
  positionTitle: string;
  department: string;
  status: string;
  score: number;
};

type NewApplicantForm = {
  name: string;
  email: string;
  positionId: string;
  resumeFile: File | null;
};

export default function ApplicantsPage() {
  const [applicants, setApplicants] = useState<ApplicantListItem[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false); // ✅ 추가
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 모달 상태
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newForm, setNewForm] = useState<NewApplicantForm>({
    name: '',
    email: '',
    positionId: '',
    resumeFile: null,
  });

  // 1) 데이터 로딩
  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiClient.applicants.list(),
      apiClient.positions.list(),
    ])
      .then(([apps, pos]: [any, any]) => {
        setApplicants(apps);
        setPositions(pos);

        if (apps.length > 0) {
          setSelectedId(apps[0].id);
        }
        if (pos.length > 0) {
          setNewForm((prev) => ({
            ...prev,
            positionId: prev.positionId || pos[0].id,
          }));
        }
      })
      .catch((e) => {
        console.error('데이터 로딩 실패:', e);
        setError('데이터를 불러오는데 실패했습니다.');
      })
      .finally(() => setLoading(false));
  }, []);

  // 검색 필터
  const filteredApplicants = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return applicants;
    return applicants.filter((a) =>
      [a.name, a.email, a.positionTitle, a.department].some((field) =>
        field.toLowerCase().includes(q)
      )
    );
  }, [search, applicants]);

  const handleOpenModal = () => setShowModal(true);

  const handleCloseModal = () => {
    setShowModal(false);
    setNewForm((prev) => ({
      ...prev,
      name: '',
      email: '',
      resumeFile: null,
    }));
  };

  const handleNewFormChange = (
    field: keyof NewApplicantForm,
    value: string | File | null
  ) => {
    setNewForm((prev) => ({ ...prev, [field]: value } as NewApplicantForm));
  };

  const handleSubmitNewApplicant: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    if (!newForm.name || !newForm.email || !newForm.positionId) {
      alert('이름, 이메일, 지원 포지션을 모두 입력해 주세요.');
      return;
    }
    if (!newForm.resumeFile) {
      alert('PDF 이력서를 업로드해 주세요.');
      return;
    }

    setSubmitting(true);

    try {
      // FormData 생성
      // 여기 수정해야함
      const formData = new FormData();
    formData.append('file', newForm.resumeFile);      // file (필수)
    formData.append('name', newForm.name);            // name (필수)
    formData.append('email', newForm.email);          // email (선택)
    const selectedPosition = positions.find(p => p.id === newForm.positionId);
    formData.append('position', selectedPosition?.title || '');

      // Next.js API Route 호출
      const newApplicant = await apiClient.applicants.create(formData);

      // 리스트에 추가
      setApplicants((prev) => [newApplicant, ...prev]);
      setSelectedId(newApplicant.id);

      handleCloseModal();
      alert('지원자가 성공적으로 등록되었습니다!');
    } catch (error) {
      console.error('지원자 등록 실패:', error);
      alert('지원자 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-slate-900">Applicants</h1>
        <div className="rounded-lg bg-red-50 p-4 text-red-600">{error}</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-slate-900">Applicants</h1>
        <p className="text-sm text-slate-600">지원자 목록을 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-120px)] flex-col gap-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Applicants</h1>
          <p className="mt-2 text-sm text-slate-600">
            모든 지원자를 한 번에 확인하고, 새로운 이력서를 등록할 수 있습니다.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-full border border-[#E6E6E7] bg-white px-3 py-1.5 text-xs text-slate-500 md:flex">
            총&nbsp;
            <span className="font-semibold text-slate-800">
              {applicants.length}
            </span>
            &nbsp;명
          </div>
          <button
            type="button"
            onClick={handleOpenModal}
            className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            + 이력서 등록
          </button>
        </div>
      </div>

      {/* 리스트만 전체 폭으로 */}
      <section className="mt-2 flex flex-1 flex-col">
        <div className="flex w-full flex-col rounded-2xl border border-[#E6E6E7] bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">
              All Applicants
            </h2>
          </div>

          <div className="mb-3">
            <input
              className="w-full rounded-full border border-[#E6E6E7] px-3 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="이름, 이메일, 포지션명으로 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-auto rounded-xl border border-[#F1F1F2]">
            {filteredApplicants.length > 0 ? (
              <table className="min-w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">이름</th>
                    <th className="px-3 py-2">포지션</th>
                    <th className="px-3 py-2">상태</th>
                    <th className="px-3 py-2 text-right">점수</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F1F2]">
                  {filteredApplicants.map((app) => {
                    const isActive = app.id === selectedId;
                    const isNew = app.status === 'New';
                    const isInProgress = app.status === 'In Progress';
                    const isHired =
                      app.status === 'Hired' || app.status === '고용';

                    let statusColor = 'bg-slate-100 text-slate-600';
                    if (isNew) statusColor = 'bg-sky-50 text-sky-700';
                    else if (isInProgress)
                      statusColor = 'bg-amber-50 text-amber-700';
                    else if (isHired)
                      statusColor = 'bg-emerald-50 text-emerald-700';

                    return (
                      <tr
                        key={app.id}
                        onClick={() => setSelectedId(app.id)}
                        className={`cursor-pointer text-[11px] transition hover:bg-slate-50 ${
                          isActive ? 'bg-indigo-50/70' : ''
                        }`}
                      >
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-indigo-600 text-[10px] font-semibold text-white">
                              {app.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-900">
                                {app.name}
                              </p>
                              <p className="truncate text-[10px] text-slate-500">
                                {app.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <p className="truncate text-[11px] text-slate-800">
                            {app.positionTitle}
                          </p>
                          <p className="truncate text-[10px] text-slate-500">
                            {app.department}
                          </p>
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor}`}
                          >
                            {app.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-semibold text-emerald-700">
                            {app.score}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="flex h-40 items-center justify-center px-4 text-center text-xs text-slate-500">
                검색 조건에 해당하는 지원자가 없습니다.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== 이력서 등록 모달 ===== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                이력서 등록
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={submitting}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitNewApplicant} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600">
                  이름
                </label>
                <input
                  className="mt-1 w-full rounded-lg border border-[#E6E6E7] px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  value={newForm.name}
                  onChange={(e) => handleNewFormChange('name', e.target.value)}
                  placeholder="홍길동"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">
                  이메일
                </label>
                <input
                  type="email"
                  className="mt-1 w-full rounded-lg border border-[#E6E6E7] px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  value={newForm.email}
                  onChange={(e) => handleNewFormChange('email', e.target.value)}
                  placeholder="user@example.com"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">
                  지원할 부서 / 포지션
                </label>
                <select
                  className="mt-1 w-full rounded-lg border border-[#E6E6E7] bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  value={newForm.positionId}
                  onChange={(e) =>
                    handleNewFormChange('positionId', e.target.value)
                  }
                  disabled={submitting}
                >
                  {positions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.department})
                    </option>
                  ))}
                </select>
              </div>

              {/* 이력서 (Drag & Drop + 클릭 업로드) */}
              <div>
                <label className="text-xs font-semibold text-slate-600">
                  이력서 (PDF)
                </label>

                {/* 드래그 & 드롭 영역 */}
                <div
                  className={`
                    mt-1 flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center text-xs
                    transition cursor-pointer
                    ${
                      isDragging
                        ? 'border-indigo-500 bg-indigo-50/40'
                        : 'border-[#E6E6E7] bg-slate-50'
                    }
                    ${submitting ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!submitting) setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (submitting) return;

                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type === 'application/pdf') {
                      handleNewFormChange('resumeFile', file);
                    } else if (file) {
                      alert('PDF 파일만 업로드할 수 있습니다.');
                    }
                  }}
                  onClick={() => {
                    if (!submitting) fileInputRef.current?.click();
                  }}
                >
                  <p className="mb-1 text-slate-700">
                    여기로 PDF 이력서를 드래그 앤 드롭 하세요
                  </p>
                  <p className="text-[11px] text-slate-500">
                    또는{' '}
                    <span className="font-semibold text-indigo-600 underline">
                      파일 선택
                    </span>
                    을 클릭하세요.
                  </p>

                  {/* 선택된 파일 이름 표시 */}
                  {newForm.resumeFile && (
                    <p className="mt-3 max-w-full truncate text-[11px] text-slate-700">
                      선택된 파일: {newForm.resumeFile.name}
                    </p>
                  )}
                </div>

                {/* 실제 파일 input (숨김) */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) =>
                    handleNewFormChange(
                      'resumeFile',
                      e.target.files?.[0] ?? null
                    )
                  }
                  disabled={submitting}
                />

                <p className="mt-1 text-[11px] text-slate-400">
                  PDF 파일을 업로드하면 FastAPI 백엔드로 전송되어 처리됩니다.
                </p>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="rounded-full border border-[#E6E6E7] bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '등록 중...' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
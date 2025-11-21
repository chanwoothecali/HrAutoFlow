// src/app/jobs/page.tsx
'use client';

import { Position, PositionStatus } from '@/types/position';
import { useEffect, useState } from 'react';

const API_BASE = '/api';

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API 요청 실패: ${url}`);
  return res.json();
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Position[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<Position | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);

  // 첫 로딩: /positions 를 공고 목록으로 사용
  useEffect(() => {
    fetchJSON<Position[]>(`${API_BASE}/positions`)
      .then((data) => {
        setJobs(data);
        if (data.length > 0) {
          setSelectedId(data[0].id);
          setForm({ ...data[0] });
          setIsNew(false);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectJob = (job: Position) => {
    setSelectedId(job.id);
    setForm({ ...job });
    setIsNew(false);
  };

  const handleChange = (field: keyof Position, value: string | number) => {
    if (!form) return;
    // applicants 에 대해서는 handleChange를 호출하지 않기 때문에
    // 여기서는 그냥 공통 처리만 해도 됨
    setForm({ ...form, [field]: value });
  };

  const handleCreateNew = () => {
    // 새 공고 템플릿
    const newId = `job-${Date.now()}`;
    const draft: Position = {
      id: newId,
      title: '',
      department: '',
      techStack: '',
      minYears: '',
      projectExperience: '',
      preferred: '',
      headcount: '',
      status: 'Open',
      applicants: 0, // 새 공고는 기본 0명
    };
    setForm(draft);
    setSelectedId(newId);
    setIsNew(true);
  };

  const handleSave = () => {
    if (!form) return;

    if (isNew) {
      // 새 공고 추가 (applicants는 기본 0으로 유지)
      setJobs((prev) => [...prev, form]);
      setIsNew(false);
    } else {
      // 기존 공고 수정 (applicants는 폼에서 안 바뀌므로 기존 값 그대로)
      setJobs((prev) =>
        prev.map((j) => (j.id === form.id ? (form as Position) : j))
      );
    }
  };

  const handleDelete = () => {
    if (!form) return;
    const ok = window.confirm('이 공고를 삭제하시겠습니까?');
    if (!ok) return;

    setJobs((prev) => prev.filter((j) => j.id !== form.id));
    setForm(null);
    setSelectedId(null);
    setIsNew(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-slate-900">Jobs</h1>
        <p className="text-sm text-slate-600">공고 정보를 불러오는 중입니다…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-120px)] flex-col gap-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Jobs</h1>
          <p className="mt-2 text-sm text-slate-600">
            모집중인 포지션을 생성·수정·관리할 수 있습니다.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreateNew}
          className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          + New Job
        </button>
      </div>

      {/* 레이아웃: 좌 목록 / 우 폼 */}
      <section className="mt-4 flex flex-1 flex-col gap-6 lg:flex-row lg:items-stretch">
        {/* LEFT: Job 리스트 */}
        <div className="flex w-full flex-col rounded-2xl border border-[#E6E6E7] bg-white p-4 lg:w-80">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            Positions
          </h2>

          <div className="space-y-3">
            {jobs.length > 0 ? (
              jobs.map((job) => {
                const isActive = job.id === selectedId;
                const isOpen = job.status === 'Open';
                return (
                  <button
                    key={job.id}
                    onClick={() => handleSelectJob(job)}
                    className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition
                      ${
                        isActive
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-[#E6E6E7] hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {job.title}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {job.department}
                        </p>
                      </div>
                      <span
                        className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          isOpen
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {job.status === 'Open' ? 'Open' : 'Closed'}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Applicants: {job.applicants}
                    </p>
                  </button>
                );
              })
            ) : (
              <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-[#E6E6E7] bg-slate-50">
                <p className="px-6 text-center text-xs leading-relaxed text-slate-500">
                  등록된 공고가 없습니다.
                  <br />
                  오른쪽 상단의
                  <span className="ml-1 font-semibold text-slate-700">
                    + New Job
                  </span>
                  버튼으로 새 포지션을 추가해 보세요.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Job 폼 */}
        <div className="flex flex-1 flex-col rounded-2xl border border-[#E6E6E7] bg-white p-6">
          {form ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  {isNew ? 'Create Position' : 'Edit Position'}
                </h2>
                {!isNew && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="text-xs font-semibold text-red-500 hover:text-red-600"
                  >
                    Delete
                  </button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Title */}
                <div className="md:col-span-1">
                  <label className="text-xs font-semibold text-slate-600">
                    Position Title
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-[#E6E6E7] px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    value={form.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="example:  Backend Developer"
                  />
                </div>

                {/* Department */}
                <div className="md:col-span-1">
                  <label className="text-xs font-semibold text-slate-600">
                    Department
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-[#E6E6E7] px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    value={form.department}
                    onChange={(e) => handleChange('department', e.target.value)}
                    placeholder="example:  Engineering"
                  />
                </div>

                {/* Tech Stack */}
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-600">
                    Tech Stack
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-[#E6E6E7] px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    value={form.techStack}
                    onChange={(e) => handleChange('techStack', e.target.value)}
                    placeholder="example:  Python, Django, REST, Docker"
                  />
                </div>

                {/* Min Years */}
                <div className="md:col-span-1">
                  <label className="text-xs font-semibold text-slate-600">
                    Min. Years of Experience
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-[#E6E6E7] px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    value={form.minYears}
                    onChange={(e) => handleChange('minYears', e.target.value)}
                    placeholder="example:  3years"
                  />
                </div>

                {/* Headcount */}
                <div className="md:col-span-1">
                  <label className="text-xs font-semibold text-slate-600">
                    Headcount
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-[#E6E6E7] px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    value={form.headcount}
                    onChange={(e) => handleChange('headcount', e.target.value)}
                    placeholder="example:  2"
                  />
                </div>

                {/* Project Experience */}
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-600">
                    Project Experience
                  </label>
                  <textarea
                    className="mt-1 w-full rounded-lg border border-[#E6E6E7] px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    rows={3}
                    value={form.projectExperience}
                    onChange={(e) =>
                      handleChange('projectExperience', e.target.value)
                    }
                    placeholder="example:  대규모 트래픽 결제/정산 시스템 백엔드 개발 경험 등"
                  />
                </div>

                {/* Preferred */}
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-600">
                    Preferred Qualifications
                  </label>
                  <textarea
                    className="mt-1 w-full rounded-lg border border-[#E6E6E7] px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    rows={2}
                    value={form.preferred}
                    onChange={(e) => handleChange('preferred', e.target.value)}
                    placeholder="example:  핀테크 도메인 경험, AWS 운영 경험"
                  />
                </div>

                {/* Status */}
                <div className="md:col-span-1">
                  <label className="text-xs font-semibold text-slate-600">
                    Status
                  </label>
                  <select
                    className="mt-1 w-full rounded-lg border border-[#E6E6E7] bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    value={form.status}
                    onChange={(e) =>
                      handleChange('status', e.target.value as PositionStatus)
                    }
                  >
                    <option value="Open">Open (모집중)</option>
                    <option value="Closed">Closed (모집종료)</option>
                  </select>
                </div>

                {/* Applicants: 읽기 전용 표시 */}
                <div className="md:col-span-1">
                  <label className="text-xs font-semibold text-slate-600">
                    Applicants
                  </label>
                  <div className="mt-1 w-full rounded-lg border border-[#E6E6E7] bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    {form.applicants}명
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    실제 지원자 수가 자동으로 반영되는 값입니다.
                  </p>
                </div>
              </div>

              {/* 버튼 영역 */}
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCreateNew}
                  className="rounded-full border border-[#E6E6E7] bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Reset / New
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  {isNew ? 'Create' : 'Save'}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
              왼쪽에서 공고를 선택하거나 <b>+ New Job</b> 버튼으로 새 공고를
              생성해 주세요.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

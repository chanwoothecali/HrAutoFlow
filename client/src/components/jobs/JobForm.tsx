// src/components/jobs/JobForm.tsx
'use client';

import { useState, useEffect } from 'react';
import type { Position, PositionFormData } from '@/types/position';

interface JobFormProps {
  mode: 'create' | 'edit';
  initialData?: Position | null;
  onSubmit: (data: PositionFormData) => Promise<void>;
  onCancel?: () => void;
}

const emptyForm: PositionFormData = {
  title: '',
  department: '',
  techStack: '',
  minYears: '',
  projectExperience: '',
  preferred: '',
  headcount: '',
  status: 'Open',
};

export default function JobForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
}: JobFormProps) {
  const [form, setForm] = useState<PositionFormData>(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      const { applicants: _ignore, id: _ignoreId, ...rest } = initialData;
      setForm(rest);
    } else {
      setForm(emptyForm);
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await onSubmit(form);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-[#E6E6E7] bg-white p-6"
    >
      <h2 className="text-lg font-semibold text-slate-900">
        {mode === 'create' ? '새 포지션 생성' : '포지션 수정'}
      </h2>

      {/* 모집 부서 */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-600">
          모집 부서
        </label>
        <input
          name="department"
          value={form.department}
          onChange={handleChange}
          className="w-full rounded-lg border border-[#E6E6E7] px-3 py-2 text-sm outline-none focus:border-indigo-500"
          placeholder="예) Engineering, Data Platform"
        />
      </div>

      {/* 포지션 타이틀 */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-600">포지션명</label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          className="w-full rounded-lg border border-[#E6E6E7] px-3 py-2 text-sm outline-none focus:border-indigo-500"
          placeholder="예) Backend Developer"
        />
      </div>

      {/* 필요 기술 스택 */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-600">
          필요 기술 스택
        </label>
        <textarea
          name="techStack"
          value={form.techStack}
          onChange={handleChange}
          rows={2}
          className="w-full rounded-lg border border-[#E6E6E7] px-3 py-2 text-sm outline-none focus:border-indigo-500"
          placeholder="예) Python, Django, REST, Docker"
        />
      </div>

      {/* 기준 연차 */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-600">
          기준 연차
        </label>
        <input
          name="minYears"
          value={form.minYears}
          onChange={handleChange}
          className="w-full rounded-lg border border-[#E6E6E7] px-3 py-2 text-sm outline-none focus:border-indigo-500"
          placeholder="예) 3+ years"
        />
      </div>

      {/* 프로젝트 경험 */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-600">
          요구 프로젝트 경험
        </label>
        <textarea
          name="projectExperience"
          value={form.projectExperience}
          onChange={handleChange}
          rows={2}
          className="w-full rounded-lg border border-[#E6E6E7] px-3 py-2 text-sm outline-none focus:border-indigo-500"
          placeholder="예) 대규모 트래픽 결제/정산 시스템 백엔드 개발 경험"
        />
      </div>

      {/* 우대 사항 */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-600">
          우대 사항
        </label>
        <textarea
          name="preferred"
          value={form.preferred}
          onChange={handleChange}
          rows={2}
          className="w-full rounded-lg border border-[#E6E6E7] px-3 py-2 text-sm outline-none focus:border-indigo-500"
          placeholder="예) 핀테크 도메인 경험, AWS 운영 경험"
        />
      </div>

      {/* 모집 인원 */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-600">
          모집 인원
        </label>
        <input
          name="headcount"
          value={form.headcount}
          onChange={handleChange}
          className="w-full rounded-lg border border-[#E6E6E7] px-3 py-2 text-sm outline-none focus:border-indigo-500"
          placeholder="예) 2명"
        />
      </div>

      {/* 상태 (모집중 / 모집종료) */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-600">상태</label>
        <select
          name="status"
          value={form.status}
          onChange={handleChange}
          className="w-full rounded-lg border border-[#E6E6E7] px-3 py-2 text-sm outline-none focus:border-indigo-500"
        >
          <option value="Open">모집중</option>
          <option value="Closed">모집종료</option>
        </select>
      </div>

      {/* 현재 지원자 수 (읽기 전용 표시용) */}
      {initialData && (
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600">
            현재 지원자 수
          </label>
          <div className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {initialData.applicants}명
          </div>
        </div>
      )}

      {/* 버튼 */}
      <div className="mt-4 flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-[#E6E6E7] px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            취소
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading
            ? '저장 중...'
            : mode === 'create'
            ? '포지션 생성'
            : '포지션 수정'}
        </button>
      </div>
    </form>
  );
}

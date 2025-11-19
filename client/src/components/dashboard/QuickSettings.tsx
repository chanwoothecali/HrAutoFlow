// src/components/dashboard/QuickSettings.tsx
'use client';

export default function QuickSettings() {
  return (
    <div className="rounded-2xl border border-[#E6E6E7] bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">
        Candidate Requirement (Quick Settings)
      </h2>

      <div className="mt-5 space-y-5 text-sm text-slate-800">
        {/* 학력 */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
            Education
          </p>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-lg bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
              Bachelor
            </button>
            <button className="rounded-lg bg-slate-100 px-3 py-1 text-xs text-slate-600">
              Master
            </button>
            <button className="rounded-lg bg-slate-100 px-3 py-1 text-xs text-slate-600">
              PhD
            </button>
          </div>
        </div>

        {/* 경력 */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
            Min. Years of Experience
          </p>
          <input
            type="number"
            defaultValue={3}
            className="w-20 rounded-md border border-[#E6E6E7] px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* 스킬 */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
            Top Skills
          </p>
          <div className="flex flex-wrap gap-2">
            {['Python', 'SQL', 'REST', 'Docker'].map((skill) => (
              <span
                key={skill}
                className="rounded-lg bg-slate-100 px-3 py-1 text-xs text-slate-700"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-2 pt-2">
          <button className="rounded-lg bg-slate-100 px-4 py-1 text-xs font-semibold text-slate-700">
            Reset
          </button>
          <button className="rounded-lg bg-indigo-600 px-4 py-1 text-xs font-semibold text-white">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

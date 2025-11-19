'use client';

import type { CandidateTableProps } from '@/types/candidate';

export default function CandidateTable({ candidates }: CandidateTableProps) {
  return (
    <div className="mt-2 flow-root">
      {/* 📌 데이터 없을 때 표시 */}
      {candidates.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-[#E6E6E7] bg-slate-50 text-center text-sm text-slate-500">
          <svg
            fill="none"
            stroke="currentColor"
            viewBox="0 0 48 48"
            aria-hidden="true"
            className="mx-auto size-12 text-gray-400 dark:text-gray-500"
          >
            <path
              d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A10.003 10.003 0 0124 26c4.21 0 7.813 2.602 9.288 6.286M30 14a6 6 0 11-12 0 6 6 0 0112 0zm12 6a4 4 0 11-8 0 4 4 0 018 0zm-28 0a4 4 0 11-8 0 4 4 0 018 0z"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
            추천할 지원자가 없습니다
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            새로운 지원자가 추가되면 자동으로 표시됩니다.
          </p>
        </div>
      ) : (
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-[#E6E6E7]">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pr-3 pl-4 text-left text-xs font-semibold text-slate-500 sm:pl-0"
                  >
                    이름
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-xs font-semibold text-slate-500"
                  >
                    직무
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-xs font-semibold text-slate-500"
                  >
                    점수
                  </th>
                  <th scope="col" className="py-3.5 pr-4 pl-3 sm:pr-0">
                    <span className="sr-only">View</span>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#E6E6E7] bg-white">
                {candidates.map((c) => (
                  <tr key={c.id}>
                    {/* 이름 + 이메일 */}
                    <td className="py-4 pr-3 pl-4 text-sm sm:pl-0">
                      <div className="flex items-center">
                        {/* 아바타: 이니셜 */}
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold">
                          {c.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-slate-900">
                            {c.name}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {c.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 직무 */}
                    <td className="px-3 py-4 text-sm text-slate-600">
                      {c.role}
                    </td>

                    {/* 점수 */}
                    <td className="px-3 py-4 text-sm text-slate-600">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700">
                        {c.score}
                      </span>
                    </td>

                    {/* View 버튼 */}
                    <td className="py-4 pr-4 pl-3 text-right text-sm sm:pr-0">
                      <button
                        type="button"
                        className="rounded-full border border-[#E6E6E7] bg-white px-4 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

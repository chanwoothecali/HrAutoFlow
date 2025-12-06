// src/components/dashboard/InterviewLog.tsx
'use client';

import { useEffect, useState } from 'react';

type InterviewItem = {
    id?: number;
    timeLabel: string;
    title: string;
    description: string;
    badge?: 'Today' | 'This Week' | 'Yesterday';
};

export default function InterviewLog() {
    const [activeTab, setActiveTab] = useState<'today' | 'week'>('today');
    const [interviews, setInterviews] = useState<InterviewItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const days = activeTab === 'today' ? 1 : 7;

        fetch(`/api/interviews/upcoming?days=${days}`)
            .then(res => res.json())
            .then(data => {
                console.log('📅 Interviews Data:', data);

                // 배열인지 확인
                const interviewList = Array.isArray(data) ? data : [];
                setInterviews(interviewList);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch interviews:', err);
                setInterviews([]);
                setLoading(false);
            });
    }, [activeTab]);

    return (
        <div className="flex max-h-[480px] flex-col rounded-2xl border border-[#E6E6E7] bg-white p-6 shadow-sm">
            {/* 헤더 */}
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">
                    Interview & Communication
                </h2>
                <button className="text-xs font-semibold text-indigo-600">
                    전체 보기
                </button>
            </div>

            {/* 탭 */}
            <div className="mb-3 flex gap-2 text-xs">
                <button
                    onClick={() => setActiveTab('today')}
                    className={`rounded-full px-3 py-1 font-semibold ${
                        activeTab === 'today'
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600'
                    }`}
                >
                    Today
                </button>
                <button
                    onClick={() => setActiveTab('week')}
                    className={`rounded-full px-3 py-1 font-semibold ${
                        activeTab === 'week'
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600'
                    }`}
                >
                    This Week
                </button>
            </div>

            {/* 리스트 */}
            <div className="flex-1 overflow-y-auto pr-1">
                {loading ? (
                    <div className="flex h-32 items-center justify-center text-sm text-slate-500">
                        불러오는 중...
                    </div>
                ) : interviews.length === 0 ? (
                    <div className="flex h-32 items-center justify-center text-sm text-slate-500">
                        예정된 인터뷰가 없습니다.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {interviews.map((item, idx) => (
                            <div
                                key={item.id || `interview-${idx}`}
                                className="rounded-xl border border-[#E6E6E7] bg-slate-50 px-4 py-3"
                            >
                                <div className="flex items-center justify-between text-xs text-slate-500">
                                    <span>{item.timeLabel}</span>
                                    {item.badge && (
                                        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                      {item.badge}
                    </span>
                                    )}
                                </div>
                                <p className="mt-1 text-sm font-semibold text-slate-900">
                                    {item.title}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-600">
                                    {item.description}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
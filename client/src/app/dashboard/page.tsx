'use client';

import { useEffect, useState } from 'react';
import PositionsPieChart from '@/components/dashboard/PositionPieChart';
import DashboardStatCard from '@/components/dashboard/DashboardStatCard';
import RecommendedCandidates from '@/components/dashboard/RecommendedCandidates';
import QuickSettings from '@/components/dashboard/QuickSettings';
import InterviewLog from '@/components/dashboard/InterviewLog';

import { DashboardStats, PositionPieDatum } from '@/types/dashboard';
import { Candidate } from '@/types/candidate';

export type FilterSettings = {
    education: string | null;
    minYears: number;
    skills: string[];
};

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats>({
        new: 0,
        inProgress: 0,
        finalInterview: 0,
        hired: 0,
    });
    const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
    const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
    const [filters, setFilters] = useState<FilterSettings>({
        education: null,
        minYears: 0,
        skills: [],
    });
    const [loading, setLoading] = useState(true);

    // 초기 데이터 로드
    useEffect(() => {
        Promise.all([
            fetch('/api/stats/positions').then(res => res.json()),
            fetch('/api/candidates/recommended?limit=20').then(res => res.json()),
        ])
            .then(([statsData, candidatesData]) => {
                setStats(statsData);
                setAllCandidates(candidatesData);
                setFilteredCandidates(candidatesData.slice(0, 5)); // 처음엔 상위 5명
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to load dashboard data:', err);
                setLoading(false);
            });
    }, []);

    // 필터 적용 함수
    const applyFilters = (newFilters: FilterSettings) => {
        setFilters(newFilters);

        let filtered = [...allCandidates];

        // Education 필터
        if (newFilters.education) {
            filtered = filtered.filter(c =>
                c.education?.toLowerCase() === newFilters.education?.toLowerCase()
            );
        }

        // Min Years 필터
        if (newFilters.minYears > 0) {
            filtered = filtered.filter(c =>
                (c.experienceYears || 0) >= newFilters.minYears
            );
        }

        // Skills 필터 (하나라도 매칭되면)
        if (newFilters.skills.length > 0) {
            filtered = filtered.filter(c =>
                c.skills?.some(skill =>
                    newFilters.skills.includes(skill)
                )
            );
        }

        // 상위 5명만
        setFilteredCandidates(filtered.slice(0, 5));
    };

    const pieData: PositionPieDatum[] = [
        { name: 'New', value: stats.new },
        { name: 'In Progress', value: stats.inProgress },
        { name: 'Final Interview', value: stats.finalInterview },
        { name: 'Employed', value: stats.hired },
    ];

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-slate-600">데이터를 불러오는 중입니다...</p>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col">
            <section
                className="
          grid h-full min-h-0 gap-4
          lg:grid-cols-[minmax(0,8fr)_minmax(0,5fr)]
        "
            >
                {/* 왼쪽 컬럼 */}
                <div className="flex h-full flex-col gap-4">
                    <div className="flex-[1] rounded-2xl border border-[#E6E6E7] bg-white p-6 shadow-sm">
                        <h2 className="text-xl font-semibold text-slate-900">Positions</h2>

                        <div className="flex h-full flex-col gap-8 lg:flex-row lg:items-center">
                            <div className="flex justify-center lg:justify-start">
                                <PositionsPieChart data={pieData} />
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <DashboardStatCard label="New" value={stats.new} />
                                <DashboardStatCard
                                    label="In Progress"
                                    value={stats.inProgress}
                                />
                                <DashboardStatCard
                                    label="Final Interview"
                                    value={stats.finalInterview}
                                />
                                <DashboardStatCard label="Employed" value={stats.hired} />
                            </div>
                        </div>
                    </div>

                    <div className="flex-[5]">
                        <RecommendedCandidates candidates={filteredCandidates} />
                    </div>
                </div>

                {/* 오른쪽 컬럼 */}
                <div className="flex h-full flex-col gap-4">
                    <QuickSettings onApplyFilters={applyFilters} currentFilters={filters} />
                    <InterviewLog />
                </div>
            </section>
        </div>
    );
}
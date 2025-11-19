// src/app/dashboard/page.tsx
import PositionsPieChart from '@/components/dashboard/PositionPieChart';
import DashboardStatCard from '@/components/dashboard/DashboardStatCard';
import RecommendedCandidates from '@/components/dashboard/RecommendedCandidates';
import QuickSettings from '@/components/dashboard/QuickSettings';
import InterviewLog from '@/components/dashboard/InterviewLog';

import { DashboardStats, PositionPieDatum } from '@/types/dashboard';
import { Candidate } from '@/types/candidate';

// Dashboard 데이터 가져오기
async function getDashboardData(): Promise<{
  stats: DashboardStats;
  recommendedCandidates: Candidate[];
}> {
  const res = await fetch('http://localhost:3001/dashboard', {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('대시보드 데이터를 불러오지 못했습니다.');
  }

  return res.json();
}

export default async function DashboardPage() {
  const { stats, recommendedCandidates } = await getDashboardData();

  const pieData: PositionPieDatum[] = [
    { name: 'New', value: stats.new },
    { name: 'In Progress', value: stats.inProgress },
    { name: 'Final Interview', value: stats.finalInterview },
    { name: 'Employed', value: stats.hired },
  ];

  return (
    <div className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:h-[calc(100vh-160px)] ">
        <div className="flex h-full flex-col gap-4">
          <div className="flex-[1] rounded-2xl border border-[#E6E6E7] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Positions</h2>

            <div className="flex h-full flex-col gap-8 lg:flex-row lg:items-center ">
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
            <RecommendedCandidates candidates={recommendedCandidates} />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <QuickSettings />
          <InterviewLog />
        </div>
      </section>
    </div>
  );
}

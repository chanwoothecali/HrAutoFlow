import PositionsPieChart from '@/components/dashboard/PositionPieChart';
import DashboardStatCard from '@/components/dashboard/DashboardStatCard';
import { DashboardStats } from '@/types/dashboard';
import { Candidate } from '@/types/candidate';
import CandidateTable from '@/components/candidates/CandidateTable';
import { PositionPieDatum } from '@/types/dashboard';

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
    { name: '신규', value: stats.new },
    { name: '진행 중', value: stats.inProgress },
    { name: '최종 인터뷰', value: stats.finalInterview },
    { name: '고용', value: stats.hired },
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-[#E6E6E7] bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900 mb-4 ">
          지원 현황
        </h2>
        <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">
          {/* 파이차트 */}
          <div className="flex justify-center lg:justify-start">
            <PositionsPieChart data={pieData} />
          </div>

          {/* 통계카드 */}
          <div className="flex flex-wrap gap-3">
            <DashboardStatCard label="신규" value={stats.new} />
            <DashboardStatCard label="진행 중" value={stats.inProgress} />
            <DashboardStatCard
              label="최종 인터뷰"
              value={stats.finalInterview}
            />
            <DashboardStatCard label="고용 완료" value={stats.hired} />
          </div>
        </div>
      </section>

      {/* 추천 지원자 */}
      <section className="rounded-2xl border border-[#E6E6E7] bg-white p-6 shadow-sm ">
        <h2 className="mb-4 text-xl font-semibold text-slate-900">
          추천 지원자
        </h2>
        <CandidateTable candidates={recommendedCandidates} />
      </section>
    </div>
  );
}

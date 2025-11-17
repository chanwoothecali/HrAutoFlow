'use client';

interface DashboardStatCardProps {
  label: string;
  value: string | number;
}

export default function DashboardStatCard({
  label,
  value,
}: DashboardStatCardProps) {
  return (
    <div className="flex min-w-[90px] flex-col justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-center">
      <span className="text-xl font-semibold text-slate-900">{value}</span>
      <span className="mt-1 text-xs text-slate-500">{label}</span>
    </div>
  );
}

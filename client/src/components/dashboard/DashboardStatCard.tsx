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
    <div className="flex min-w-[85px] flex-1 flex-col justify-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center">
      <span className="text-xl font-semibold text-slate-900">{value}</span>
      <span className="mt-0.5 text-[11px] text-slate-500">{label}</span>
    </div>
  );
}

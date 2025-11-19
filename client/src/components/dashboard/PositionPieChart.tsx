// src/components/dashboard/PositionPieChart.tsx
'use client';

import { PositionPieDatum } from '@/types/dashboard';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#E5E7EA', '#2562EA', '#0BB981', '#FBBF24'];

export default function PositionsPieChart({
  data,
}: {
  data: PositionPieDatum[];
}) {
  // 전체 포지션 수 & 고용 수 계산
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const employed = data.find((d) => d.name === 'Employed')?.value ?? 0;
  const employmentRate = total > 0 ? Math.round((employed / total) * 100) : 0;

  return (
    <div className="relative aspect-square w-40 md:w-48">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={64}
            outerRadius={90}
            paddingAngle={0}
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>

      {/* 가운데 고용률 표시 */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-900">
          {employmentRate}%
        </span>
        <span className="mt-1 text-xs text-slate-500">employment rate</span>
      </div>
    </div>
  );
}

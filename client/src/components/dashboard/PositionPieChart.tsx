'use client';

import { PositionPieDatum } from '@/types/dashboard';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#2F6FD9', '#63D2E3', '#67D2A5', '#2966C2'];

export default function PositionsPieChart({
  data,
}: {
  data: PositionPieDatum[];
}) {
  return (
    <div className="aspect-square w-40 md:w-48">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={0}
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

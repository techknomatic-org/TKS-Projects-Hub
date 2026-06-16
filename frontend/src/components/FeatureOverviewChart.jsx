import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const COLORS = {
  'PLANNED': '#94a3b8',
  'IN PROGRESS': '#3b82f6',
  'COMPLETED': '#10b981',
  'ON HOLD': '#f59e0b'
};

export const FeatureOverviewChart = ({ data = [] }) => {
  const hasData = data.some(item => item.value > 0);

  if (!hasData) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 font-semibold text-xs border border-dashed border-slate-200 rounded-2xl">
        No feature data recorded for this selection.
      </div>
    );
  }

  return (
    <div className="w-full h-80 flex flex-col justify-between">
      <h3 className="text-sm font-bold text-slate-700 mb-2">Feature Completion Overview</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.filter(item => item.value > 0)}
              cx="50%"
              cy="45%"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#cbd5e1'} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}
            />
            <Legend 
              verticalAlign="bottom" 
              iconSize={10} 
              iconType="circle"
              wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FeatureOverviewChart;

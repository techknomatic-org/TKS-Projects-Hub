import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export const SprintVelocityChart = ({ data = [] }) => {
  const hasData = data.length > 0;

  if (!hasData) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 font-semibold text-xs border border-dashed border-slate-200 rounded-2xl">
        No completed sprint velocity data found for this selection.
      </div>
    );
  }

  return (
    <div className="w-full h-80 flex flex-col justify-between">
      <h3 className="text-sm font-bold text-slate-700 mb-2">Sprint Velocity</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="sprint" 
              tickLine={false} 
              axisLine={false} 
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} 
            />
            <YAxis 
              tickLine={false} 
              axisLine={false} 
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} 
              allowDecimals={false}
            />
            <Tooltip 
              contentStyle={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}
            />
            <Line 
              type="monotone" 
              dataKey="points" 
              name="Completed Points"
              stroke="#2563eb" 
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SprintVelocityChart;

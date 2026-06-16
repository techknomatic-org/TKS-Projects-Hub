import React from 'react';
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const COLORS = {
  'BACKLOG': '#94a3b8',
  'READY': '#0ea5e9',
  'IN PROGRESS': '#2563eb',
  'TESTING': '#a855f7',
  'DONE': '#10b981'
};

export const StoryOverviewChart = ({ data = [] }) => {
  const hasData = data.some(item => item.value > 0);

  if (!hasData) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 font-semibold text-xs border border-dashed border-slate-200 rounded-2xl">
        No user story data recorded for this selection.
      </div>
    );
  }

  return (
    <div className="w-full h-80 flex flex-col justify-between">
      <h3 className="text-sm font-bold text-slate-700 mb-2">User Story Status Overview</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
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
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={25}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#cbd5e1'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StoryOverviewChart;

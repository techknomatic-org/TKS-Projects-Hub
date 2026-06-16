import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export const EmployeeWorkloadChart = ({ data = [] }) => {
  const hasData = data.some(item => (item.tasks > 0 || item.features > 0 || item.stories > 0));

  if (!hasData) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 font-semibold text-xs border border-dashed border-slate-200 rounded-2xl">
        No developer workload data recorded for this selection.
      </div>
    );
  }

  return (
    <div className="w-full h-80 flex flex-col justify-between">
      <h3 className="text-sm font-bold text-slate-700 mb-2">Developer Workload</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="y"
            margin={{ top: 5, right: 15, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
            <XAxis 
              type="number" 
              tickLine={false} 
              axisLine={false} 
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} 
              allowDecimals={false}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              tickLine={false} 
              axisLine={false} 
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} 
              width={100}
            />
            <Tooltip 
              contentStyle={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}
            />
            <Legend 
              verticalAlign="bottom" 
              iconSize={10} 
              iconType="circle"
              wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }}
            />
            <Bar dataKey="tasks" name="Tasks" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            <Bar dataKey="features" name="Features" fill="#10b981" radius={[0, 4, 4, 0]} />
            <Bar dataKey="stories" name="Stories" fill="#f59e0b" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EmployeeWorkloadChart;

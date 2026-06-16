import React from 'react';

export const ReleaseReadinessCard = ({ data = [] }) => {
  if (data.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 font-semibold text-xs border border-dashed border-slate-200 rounded-2xl">
        No release readiness data found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map((item) => (
        <div 
          key={item.id || item.productName} 
          className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Product Readiness</span>
            <h4 className="text-base font-extrabold text-slate-800 tracking-tight mt-1">{item.productName}</h4>
            <div className="flex items-baseline justify-between mt-4">
              <span className="text-2xl font-black text-blue-600">{item.percentage}%</span>
              <span className="text-xs font-bold text-slate-500">
                {item.completedFeatures} / {item.totalFeatures} Features
              </span>
            </div>
          </div>
          
          <div className="w-full mt-4">
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                style={{ width: `${item.percentage}%` }} 
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReleaseReadinessCard;

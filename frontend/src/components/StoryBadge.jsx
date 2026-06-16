import React from 'react';

export const StoryBadge = ({ type, value }) => {
  const getStyles = () => {
    if (type === 'priority') {
      switch (value) {
        case 'CRITICAL':
          return 'bg-purple-50 text-purple-600 border-purple-200';
        case 'HIGH':
          return 'bg-red-50 text-red-600 border-red-200';
        case 'MEDIUM':
          return 'bg-amber-50 text-amber-600 border-amber-200';
        case 'LOW':
        default:
          return 'bg-blue-50 text-blue-600 border-blue-200';
      }
    } else {
      // status
      switch (value) {
        case 'DONE':
          return 'bg-emerald-50 text-emerald-600 border-emerald-200';
        case 'TESTING':
          return 'bg-purple-50 text-purple-600 border-purple-200';
        case 'IN_PROGRESS':
          return 'bg-blue-50 text-blue-600 border-blue-200';
        case 'READY':
          return 'bg-sky-50 text-sky-600 border-sky-200';
        case 'BACKLOG':
        default:
          return 'bg-slate-100 text-slate-600 border-slate-200';
      }
    }
  };

  const displayValue = value ? value.replace('_', ' ') : '';

  return (
    <span className={`px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border text-[10px] whitespace-nowrap ${getStyles()}`}>
      {displayValue.toLowerCase()}
    </span>
  );
};

export default StoryBadge;

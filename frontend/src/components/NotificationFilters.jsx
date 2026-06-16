import React from 'react';
import { SlidersHorizontal, Search, X } from 'lucide-react';

export const NotificationFilters = ({
  search,
  setSearch,
  typeFilter,
  setTypeFilter,
  readFilter,
  setReadFilter,
  onClear,
  onSubmit
}) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSubmit();
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-50 pb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filters & Search</span>
        </div>
        {(search || typeFilter || readFilter) && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-slate-400 hover:text-slate-600 text-xs font-bold transition-all cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search keywords... (Press Enter)"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Type Select */}
        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="">All Categories</option>
            <option value="STATUS">Kanban Status</option>
            <option value="FEATURE">Features</option>
            <option value="USER_STORY">User Stories</option>
            <option value="RELEASE">Releases</option>
            <option value="SYSTEM">System Alerts</option>
          </select>
        </div>

        {/* Read/Unread Select */}
        <div>
          <select
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="false">Unread Only</option>
            <option value="true">Read Only</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default NotificationFilters;

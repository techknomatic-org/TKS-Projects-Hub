import React from 'react';
import StoryBadge from './StoryBadge.jsx';

export const UserStoryTable = ({
  stories = [],
  loading = false,
  indexOffset = 0
}) => {
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {['Story ID', 'User Story', 'Priority', 'Status', 'Owner', 'Created Date'].map((h, i) => (
                <th key={i} className="py-4 px-6">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, index) => (
              <tr key={index} className="border-b border-slate-50 last:border-0">
                <td className="py-4 px-6"><div className="h-4 w-10 bg-slate-100 rounded animate-pulse" /></td>
                <td className="py-4 px-6">
                  <div className="h-4 w-64 bg-slate-100 rounded animate-pulse mb-2" />
                  <div className="h-3 w-40 bg-slate-50 rounded animate-pulse" />
                </td>
                <td className="py-4 px-6"><div className="h-6 w-16 bg-slate-100 rounded-md animate-pulse" /></td>
                <td className="py-4 px-6"><div className="h-6 w-20 bg-slate-100 rounded-md animate-pulse" /></td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                     <div className="w-6 h-6 rounded-full bg-slate-100 animate-pulse" />
                    <div className="h-3.5 w-16 bg-slate-100 rounded animate-pulse" />
                  </div>
                </td>
                <td className="py-4 px-6"><div className="h-4 w-20 bg-slate-100 rounded animate-pulse" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
        <p className="text-slate-400 font-semibold text-sm">No user stories found matching the search/filter criteria.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10">
              <th className="py-4 px-6 w-20">Story ID</th>
              <th className="py-4 px-6 min-w-[280px]">User Story</th>
              <th className="py-4 px-6 w-28">Priority</th>
              <th className="py-4 px-6 w-28">Status</th>
              <th className="py-4 px-6 w-32">Owner</th>
              <th className="py-4 px-6 w-28">Created Date</th>
            </tr>
          </thead>
          <tbody>
            {stories.map((story, index) => (
              <tr
                key={story.id}
                className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors last:border-0 group"
              >
                {/* Story ID */}
                <td className="py-4 px-6 text-xs font-bold text-slate-400 whitespace-nowrap">
                  US-{String(indexOffset + index + 1).padStart(3, '0')}
                </td>

                {/* Title & Description */}
                <td className="py-4 px-6">
                  <div className="font-bold text-slate-800 text-sm leading-tight break-words">
                    {story.title}
                  </div>
                  {story.description && (
                    <div className="text-xs font-medium text-slate-400 mt-1 max-w-lg break-words">
                      {story.description}
                    </div>
                  )}
                </td>

                {/* Priority */}
                <td className="py-4 px-6">
                  <StoryBadge type="priority" value={story.priority} />
                </td>

                {/* Status */}
                <td className="py-4 px-6">
                  <StoryBadge type="status" value={story.status} />
                </td>

                {/* Owner */}
                <td className="py-4 px-6">
                  {story.owner ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-[9px] uppercase">
                        {getInitials(story.owner.name)}
                      </div>
                      <span className="text-xs font-semibold text-slate-700">{story.owner.name}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-xs font-medium">-</span>
                  )}
                </td>

                {/* Created Date */}
                <td className="py-4 px-6 text-xs font-semibold text-slate-500">
                  {formatDate(story.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserStoryTable;

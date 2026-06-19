import React, { useState } from 'react';
import { Edit2, Eye, Trash2 } from 'lucide-react';
import StoryBadge from './StoryBadge.jsx';

export const UserStoryTable = ({
  stories = [],
  loading = false,
  isAdmin = false,
  onEdit = () => {},
  onDelete = () => {},
  indexOffset = 0
}) => {
  const [expandedRowId, setExpandedRowId] = useState(null);

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
              {['Story ID', 'User Story', 'Priority', 'Status', 'Owner', 'Actions'].map((h, i) => (
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
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 animate-pulse" />
                    <div className="w-8 h-8 rounded-lg bg-slate-100 animate-pulse" />
                  </div>
                </td>
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
              <th className="py-4 px-6 w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {stories.map((story, index) => {
              const isExpanded = expandedRowId === story.id;
              return (
                <React.Fragment key={story.id}>
                  <tr
                    onClick={(e) => {
                      if (e.target.closest('button') || e.target.closest('select') || e.target.closest('a')) return;
                      setExpandedRowId(isExpanded ? null : story.id);
                    }}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors last:border-0 group cursor-pointer"
                  >
                    {/* Story ID */}
                    <td className="py-4 px-6 text-xs font-bold text-slate-400 whitespace-nowrap">
                      US-{String(indexOffset + index + 1).padStart(3, '0')}
                    </td>

                    {/* Title & Description */}
                    <td className="py-4 px-6 max-w-md">
                      <div className="font-bold text-slate-800 text-sm leading-tight truncate group-hover:whitespace-normal group-hover:line-clamp-none">
                        {story.title}
                      </div>
                      {story.description && (
                        <div className="text-xs font-medium text-slate-400 mt-1 line-clamp-1 group-hover:line-clamp-none group-hover:whitespace-normal transition-all duration-200">
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

                    {/* Actions */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEdit(story)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-all cursor-pointer"
                          title={isAdmin ? "View User Story Details" : "Edit User Story"}
                        >
                          {isAdmin ? <Eye className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                        </button>
                        {!isAdmin && (
                          <button
                            onClick={() => onDelete(story.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 hover:text-red-700 transition-all cursor-pointer"
                            title="Delete User Story"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={6} className="py-4 px-8 border-b border-slate-100">
                        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-inner animate-in fade-in duration-200">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full User Story Details</h4>
                          <div className="text-sm font-bold text-slate-800 leading-relaxed mb-3">
                            {story.title}
                          </div>
                          {story.description ? (
                            <div className="text-xs font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">
                              {story.description}
                            </div>
                          ) : (
                            <div className="text-xs italic text-slate-400">No additional description provided.</div>
                          )}
                          <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                            <div>
                              <strong className="text-slate-700">Sprint:</strong> {story.sprint || 'N/A'}
                            </div>
                            <div>
                              <strong className="text-slate-700">Story Points:</strong> {story.storyPoints || 0} pts
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserStoryTable;

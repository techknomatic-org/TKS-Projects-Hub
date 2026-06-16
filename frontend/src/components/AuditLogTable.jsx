import React from 'react';
import { Eye } from 'lucide-react';

export const AuditLogTable = ({
  logs = [],
  loading = false,
  onViewDetails = () => {}
}) => {
  const getActionBadgeClass = (action) => {
    switch (action) {
      case 'CREATE':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'UPDATE':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'DELETE':
      default:
        return 'bg-red-50 text-red-600 border-red-200';
    }
  };

  const getEntityTypeLabel = (type) => {
    switch (type) {
      case 'STATUS':
        return 'Kanban Task';
      case 'FEATURE':
        return 'Feature';
      case 'USER_STORY':
        return 'User Story';
      default:
        return type;
    }
  };

  const getSummaryText = (log) => {
    const userName = log.user ? log.user.name : 'Unknown User';
    const actionText = log.action === 'CREATE' ? 'created' : log.action === 'UPDATE' ? 'updated' : 'deleted';
    const entityLabel = getEntityTypeLabel(log.entityType);
    
    // Check if we can get a title/name from newValue or oldValue to make it even more detailed
    let objectTitle = '';
    const details = log.newValue || log.oldValue;
    if (details && details.title) {
      objectTitle = ` "${details.title}"`;
    }

    return `${userName} ${actionText} ${entityLabel}${objectTitle} (${log.entityId.substring(0, 8)}).`;
  };

  const formatTimestamp = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {['Timestamp', 'User', 'Entity Type', 'Action', 'Summary', 'Actions'].map((h, i) => (
                <th key={i} className="py-4 px-6">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, index) => (
              <tr key={index} className="border-b border-slate-50 last:border-0">
                <td className="py-4 px-6"><div className="h-4 w-24 bg-slate-100 rounded animate-pulse" /></td>
                <td className="py-4 px-6"><div className="h-4 w-32 bg-slate-100 rounded animate-pulse" /></td>
                <td className="py-4 px-6"><div className="h-4 w-20 bg-slate-100 rounded animate-pulse" /></td>
                <td className="py-4 px-6"><div className="h-6 w-16 bg-slate-100 rounded-md animate-pulse" /></td>
                <td className="py-4 px-6"><div className="h-4 w-72 bg-slate-50 rounded animate-pulse" /></td>
                <td className="py-4 px-6"><div className="w-8 h-8 rounded-lg bg-slate-100 animate-pulse" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
        <p className="text-slate-400 font-semibold text-sm">No audit logs found matching the search/filter criteria.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10">
              <th className="py-4 px-6 w-48">Timestamp</th>
              <th className="py-4 px-6 w-52">User</th>
              <th className="py-4 px-6 w-32">Entity Type</th>
              <th className="py-4 px-6 w-28">Action</th>
              <th className="py-4 px-6">Summary</th>
              <th className="py-4 px-6 w-24 text-right">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr 
                key={log.id} 
                className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors last:border-0 group"
              >
                {/* Timestamp */}
                <td className="py-4 px-6 text-xs font-semibold text-slate-500">
                  {formatTimestamp(log.createdAt)}
                </td>

                {/* User */}
                <td className="py-4 px-6">
                  {log.user ? (
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-700 leading-tight">{log.user.name}</span>
                      <span className="text-[10px] font-medium text-slate-400 mt-0.5 leading-none">{log.user.email}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-xs font-medium">System</span>
                  )}
                </td>

                {/* Entity Type */}
                <td className="py-4 px-6">
                  <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                    {getEntityTypeLabel(log.entityType)}
                  </span>
                </td>

                {/* Action */}
                <td className="py-4 px-6">
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${getActionBadgeClass(log.action)}`}>
                    {log.action.toLowerCase()}
                  </span>
                </td>

                {/* Summary */}
                <td className="py-4 px-6 text-xs font-medium text-slate-600 leading-relaxed">
                  {getSummaryText(log)}
                </td>

                {/* View Details */}
                <td className="py-4 px-6 text-right">
                  <button
                    onClick={() => onViewDetails(log)}
                    title="View details"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer inline-flex items-center gap-1 text-xs font-bold"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogTable;

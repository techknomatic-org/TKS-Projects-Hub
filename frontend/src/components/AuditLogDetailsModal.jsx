import React, { useEffect } from 'react';
import { X, Shield, Calendar, User, FileCode } from 'lucide-react';

export const AuditLogDetailsModal = ({
  isOpen,
  onClose,
  log = null
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !log) return null;

  const formatTimestamp = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white rounded-3xl border border-slate-100 max-w-4xl w-full shadow-2xl p-8 overflow-hidden transform transition-all duration-300 animate-in fade-in zoom-in-95 flex flex-col max-h-[85vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title */}
        <div className="pb-4 border-b border-slate-100 mb-5 flex items-center gap-2.5">
          <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-500">
            <FileCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Audit Log Entry Details</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">Log ID: {log.id}</p>
          </div>
        </div>

        {/* Meta Grid info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl mb-6">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Performed By</span>
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="text-xs font-bold text-slate-700 truncate">{log.user ? log.user.name : 'System'}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Timestamp</span>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="text-xs font-semibold text-slate-700 truncate">{formatTimestamp(log.createdAt)}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Entity Target</span>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="text-xs font-bold text-slate-700 truncate">{log.entityType} ({log.entityId.substring(0, 8)})</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Action Executed</span>
            <div>
              <span className={`px-2 py-0.5 rounded border text-[9px] font-extrabold uppercase tracking-wider ${getActionBadgeClass(log.action)}`}>
                {log.action}
              </span>
            </div>
          </div>
        </div>

        {/* JSON Comparison Blocks */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Old Value pre block */}
            <div className="flex flex-col">
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2.5">Old Value Details</h4>
              <div className="flex-1 bg-slate-900 border border-slate-950 rounded-2xl p-4 overflow-auto max-h-[40vh] shadow-inner">
                {log.oldValue ? (
                  <pre className="text-[10px] font-mono text-emerald-400 leading-normal select-all">
                    <code>{JSON.stringify(log.oldValue, null, 2)}</code>
                  </pre>
                ) : (
                  <span className="text-xs font-semibold text-slate-500 italic">No previous values recorded (Creation Event).</span>
                )}
              </div>
            </div>

            {/* New Value pre block */}
            <div className="flex flex-col">
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2.5">New Value Details</h4>
              <div className="flex-1 bg-slate-900 border border-slate-950 rounded-2xl p-4 overflow-auto max-h-[40vh] shadow-inner">
                {log.newValue ? (
                  <pre className="text-[10px] font-mono text-blue-400 leading-normal select-all">
                    <code>{JSON.stringify(log.newValue, null, 2)}</code>
                  </pre>
                ) : (
                  <span className="text-xs font-semibold text-slate-500 italic">No values remaining (Deletion Event).</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100 mt-6 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-sm transition-all cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogDetailsModal;

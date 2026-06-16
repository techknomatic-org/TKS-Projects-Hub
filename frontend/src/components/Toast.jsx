import React, { useEffect } from 'react';
import { X, Info, AlertCircle, CheckCircle, Bell } from 'lucide-react';

export const Toast = ({ message, type = 'info', title, onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-500" />;
      case 'system':
        return <AlertCircle className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-emerald-100 bg-emerald-50/20';
      case 'error':
        return 'border-rose-100 bg-rose-50/20';
      case 'system':
        return 'border-purple-100 bg-purple-50/20';
      default:
        return 'border-blue-100 bg-blue-50/20';
    }
  };

  return (
    <div className={`flex items-start gap-3 p-4 border rounded-2xl shadow-xl w-80 bg-white z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 ${getBorderColor()}`}>
      <div className="shrink-0 pt-0.5">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold text-slate-800">{title || 'Notification'}</h4>
        <p className="text-[11px] text-slate-500 mt-1 leading-normal break-words">{message}</p>
      </div>
      <button 
        onClick={onClose} 
        className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;

import React from 'react';
import { Grid, Layers, FileText, Package, ShieldAlert, Check, Calendar } from 'lucide-react';

export const NotificationCard = ({ notification, onMarkAsRead }) => {
  const { title, message, type, isRead, createdAt } = notification;

  const getIcon = () => {
    const iconClass = "w-5 h-5 shrink-0";
    switch (type) {
      case 'STATUS':
        return <Grid className={`${iconClass} text-blue-500`} />;
      case 'FEATURE':
        return <Layers className={`${iconClass} text-indigo-500`} />;
      case 'USER_STORY':
        return <FileText className={`${iconClass} text-violet-500`} />;
      case 'RELEASE':
        return <Package className={`${iconClass} text-emerald-500`} />;
      case 'SYSTEM':
        return <ShieldAlert className={`${iconClass} text-rose-500`} />;
      default:
        return <Grid className={`${iconClass} text-slate-500`} />;
    }
  };

  const getCardBg = () => {
    return isRead 
      ? 'bg-white hover:bg-slate-50/50' 
      : 'bg-blue-50/10 border-l-4 border-l-blue-600 hover:bg-blue-50/20';
  };

  return (
    <div className={`p-4 border border-slate-100 rounded-2xl flex items-start justify-between gap-4 transition-all duration-150 ${getCardBg()}`}>
      <div className="flex gap-3 min-w-0">
        <div className={`p-2.5 rounded-xl shrink-0 ${isRead ? 'bg-slate-50' : 'bg-blue-50'}`}>
          {getIcon()}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className={`text-xs font-bold ${isRead ? 'text-slate-700' : 'text-slate-900'}`}>{title}</h4>
            {!isRead && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-[9px] font-bold uppercase tracking-wider">
                New
              </span>
            )}
          </div>
          <p className={`text-xs mt-1 leading-relaxed ${isRead ? 'text-slate-500' : 'text-slate-600 font-medium'}`}>{message}</p>
          <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-slate-400 font-semibold">
            <Calendar className="w-3.5 h-3.5" />
            <span>{new Date(createdAt).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {!isRead && (
        <button
          onClick={() => onMarkAsRead(notification.id)}
          title="Mark as read"
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 shrink-0 transition-colors cursor-pointer"
        >
          <Check className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default NotificationCard;

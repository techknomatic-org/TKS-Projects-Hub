import React from 'react';
import { Calendar, User } from 'lucide-react';

const StatusCard = ({ 
  card, 
  onClick = () => {}, 
  isEmployee = false,
  provided = null,
  isDragging = false
}) => {
  const { title, description, priority, owner, updatedAt } = card;

  // Format date helper
  const formatUpdatedDate = (dateString) => {
    if (!dateString) return 'Updated: N/A';
    const date = new Date(dateString);
    const now = new Date();
    
    // Reset hours to compare calendar days
    const dateZero = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffTime = nowZero - dateZero;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Updated: Today';
    } else if (diffDays === 1) {
      return 'Updated: Yesterday';
    } else {
      return `Updated: ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
  };

  // Helper for priority pill styling
  const getPriorityBadgeStyles = (pri) => {
    switch (pri) {
      case 'CRITICAL':
        return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'HIGH':
        return 'bg-red-50 text-red-600 border-red-100';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'LOW':
      default:
        return 'bg-blue-50 text-blue-600 border-blue-100';
    }
  };

  // Helper for owner avatar initials
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Check if there is a specific block reason in the description (like in the screenshot)
  const hasReason = description && description.includes('Reason:');
  let displayDescription = description || '';
  let reasonText = '';
  
  if (hasReason) {
    const parts = description.split('Reason:');
    displayDescription = parts[0].trim();
    reasonText = parts[1].trim();
  }

  const canEdit = !isEmployee || card.status === 'TODO';

  // Inner card contents
  const cardContent = (
    <div 
      onClick={() => canEdit && onClick(card)}
      className={`bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-3 ${
        canEdit ? 'cursor-pointer hover:border-blue-200 group' : 'cursor-default opacity-85'
      } ${isDragging ? 'shadow-premium border-blue-300 ring-2 ring-blue-500/5' : ''}`}
    >
      {/* Title & Description */}
      <div>
        <h4 className="text-sm font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">
          {title}
        </h4>
        {displayDescription && (
          <p className="text-xs text-slate-400 font-medium mt-1.5 leading-relaxed break-words">
            {displayDescription}
          </p>
        )}

        {/* Custom block reason alert for Blocked statuses */}
        {hasReason && card.status === 'BLOCKED' && (
          <div className="mt-3 p-2 bg-red-50/50 border border-red-100 rounded-lg text-[10px] font-semibold text-red-600 flex items-start gap-1">
            <span className="font-bold">Reason:</span>
            <span className="text-slate-500 font-medium break-all">{reasonText}</span>
          </div>
        )}
      </div>

      {/* Owner, Priority & Date Footer Info */}
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-50">
        
        {/* Owner display row */}
        {owner && (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-[9px] uppercase">
              {getInitials(owner.name)}
            </div>
            <span className="text-[10px] text-slate-500 font-bold">{owner.name}</span>
          </div>
        )}

        {/* Priority Badge & Last Updated Date */}
        <div className="flex items-center justify-between text-[10px]">
          <span className={`px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border text-[9px] whitespace-nowrap ${getPriorityBadgeStyles(priority)}`}>
            {priority.toLowerCase()}
          </span>
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            {formatUpdatedDate(updatedAt)}
          </span>
        </div>

      </div>

    </div>
  );

  // Return card with DND wrapper if provided, otherwise simple render
  if (provided) {
    return (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        className="mb-3 outline-none"
      >
        {cardContent}
      </div>
    );
  }

  return <div className="mb-3">{cardContent}</div>;
};

export default StatusCard;

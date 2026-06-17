import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import StatusCard from './StatusCard.jsx';

const COLUMN_CONFIG = {
  TODO: {
    title: 'To Do',
    bulletColor: 'bg-slate-400',
    colBg: 'bg-slate-100/80'
  },
  IN_PROGRESS: {
    title: 'In Progress',
    bulletColor: 'bg-blue-500',
    colBg: 'bg-blue-50/70'
  },
  IN_REVIEW: {
    title: 'In Review',
    bulletColor: 'bg-[#8B5CF6]', // Purple
    colBg: 'bg-purple-50/60'
  },
  TESTING: {
    title: 'Testing',
    bulletColor: 'bg-amber-500',
    colBg: 'bg-amber-50/60'
  },
  BLOCKED: {
    title: 'Blocked',
    bulletColor: 'bg-red-500',
    colBg: 'bg-red-50/70'
  },
  READY_FOR_RELEASE: {
    title: 'Ready for Release',
    bulletColor: 'bg-emerald-500',
    colBg: 'bg-emerald-50/60'
  },
  DONE: {
    title: 'Done',
    bulletColor: 'bg-green-600',
    colBg: 'bg-green-50/60'
  }
};

const KanbanColumn = ({ 
  statusKey, 
  cards = [], 
  onCardClick = () => {}, 
  isEmployee = false,
  isAdmin = false
}) => {
  const config = COLUMN_CONFIG[statusKey] || COLUMN_CONFIG.TODO;

  return (
    <div className={`flex-1 min-w-[130px] rounded-3xl p-3 flex flex-col min-h-[500px] border border-slate-200/80 ${config.colBg}`}>
      
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 px-1 select-none">
        <div className="flex items-center gap-2">
          {/* Bullet dot */}
          <div className={`w-2 h-2 rounded-full ${config.bulletColor}`} />
          {/* Column Name */}
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            {config.title}
          </span>
        </div>
        
        {/* Count Badge */}
        <div className="w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
          {cards.length}
        </div>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={statusKey}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 flex flex-col min-h-[400px] rounded-2xl transition-colors duration-150 py-1 ${
              snapshot.isDraggingOver ? 'bg-slate-200/20' : ''
            }`}
          >
            {cards.map((card, index) => (
              <Draggable 
                key={card.id} 
                draggableId={card.id} 
                index={index}
                isDragDisabled={!isAdmin} // Only Admins can drag and drop
              >
                {(dragProvided, dragSnapshot) => (
                  <StatusCard
                    card={card}
                    onClick={onCardClick}
                    isEmployee={isEmployee}
                    provided={dragProvided}
                    isDragging={dragSnapshot.isDragging}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            
            {/* Visual spacer to allow drop at bottom */}
            <div className="flex-1" />
          </div>
        )}
      </Droppable>

      {/* "+ Add Item" placeholder row at the bottom of the column */}
      {statusKey === 'TODO' && (isAdmin || isEmployee) && (
        <div className="mt-2 border-t border-dashed border-slate-200/60 pt-2 px-1">
          <button
            onClick={() => {
              onCardClick({
                id: 'new',
                title: '',
                description: '',
                status: statusKey,
                priority: 'LOW',
                ownerId: ''
              });
            }}
            className="flex items-center gap-1 text-[11px] font-bold transition-all text-blue-600 hover:text-blue-800 cursor-pointer"
          >
            <span>+ Add Item</span>
          </button>
        </div>
      )}

    </div>
  );
};

export default KanbanColumn;

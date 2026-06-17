import React, { useState, useEffect } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { authService } from '../services/authService.js';
import { productService } from '../services/productService.js';
import KanbanColumn from './KanbanColumn.jsx';
import EditStatusModal from './EditStatusModal.jsx';
import { ShieldAlert, ShieldCheck, RefreshCw } from 'lucide-react';

const COLUMNS = ['TODO', 'IN_PROGRESS', 'TESTING', 'DONE'];

const KanbanBoard = ({ selectedProduct }) => {
  const user = authService.getUser();
  const isEmployee = user?.role === 'EMPLOYEE';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'BOTH';

  const [cards, setCards] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCard, setActiveCard] = useState(null);

  // Load Status Board Cards
  const loadBoardData = async () => {
    if (!selectedProduct) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await productService.getProductStatuses(selectedProduct.id);
      setCards(data);
    } catch (err) {
      console.error('Failed to load board tasks:', err);
      setErrorMsg(err.message || 'Failed to load task status board.');
    } finally {
      setLoading(false);
    }
  };

  // Load list of employees for assigning owners in modal
  const loadEmployees = async () => {
    if (!selectedProduct) return;
    try {
      const emps = await productService.getEmployees(selectedProduct.id);
      setEmployees(emps);
    } catch (err) {
      console.error('Failed to load employee list:', err);
    }
  };

  useEffect(() => {
    loadBoardData();
    loadEmployees();
  }, [selectedProduct]);

  // Handle Drag & Drop logic
  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (!isAdmin) {
      alert('Read-Only Mode: Only administrators are authorized to update card statuses via drag and drop.');
      return;
    }

    // Save previous state for rollback
    const previousCards = [...cards];

    // Optimistically calculate state
    const nextCards = [...cards];
    const draggedCardIndex = nextCards.findIndex(c => c.id === draggableId);
    if (draggedCardIndex === -1) return;

    const draggedCard = nextCards[draggedCardIndex];
    
    // Get lists
    const sourceColCards = nextCards.filter(c => c.status === source.droppableId);
    const destColCards = source.droppableId === destination.droppableId 
      ? sourceColCards 
      : nextCards.filter(c => c.status === destination.droppableId);

    // Remove from source list
    const [removed] = sourceColCards.splice(source.index, 1);
    
    // Create updated card object
    const updatedCard = { 
      ...removed, 
      status: destination.droppableId, 
      updatedAt: new Date().toISOString() 
    };

    // Insert into destination list
    destColCards.splice(destination.index, 0, updatedCard);

    // Rebuild the flat cards list
    let finalCards = nextCards.filter(
      c => c.status !== source.droppableId && c.status !== destination.droppableId
    );
    
    if (source.droppableId === destination.droppableId) {
      finalCards = [...finalCards, ...destColCards];
    } else {
      finalCards = [...finalCards, ...sourceColCards, ...destColCards];
    }

    setCards(finalCards);

    try {
      // Persist to backend API
      await productService.updateStatusCard(draggableId, { status: destination.droppableId });
    } catch (error) {
      console.error('Failed to update task status in DB, rolling back:', error);
      setCards(previousCards);
      setErrorMsg(`Failed to save task move: ${error.message}`);
    }
  };

  // Open Modal to edit
  const handleCardClick = (card) => {
    // Admins have full access. Developers only have access to TODO cards.
    if (isEmployee) {
      if (card.id !== 'new' && card.status !== 'TODO') {
        alert('Access Denied: Developers only have access to modify cards in the To Do column.');
        return;
      }
    } else if (!isAdmin) {
      return;
    }

    if (card.id === 'new') {
      // Pre-fill default owner if employee is logged in
      const defaultOwnerId = employees.find(emp => emp.email === user.email)?.id || employees[0]?.id || '';
      setActiveCard({
        ...card,
        productId: selectedProduct.id,
        ownerId: defaultOwnerId
      });
    } else {
      setActiveCard(card);
    }
    setIsModalOpen(true);
  };

  // Callback from Edit Modal on Save
  const handleSaveCard = (savedCard, isNew = false) => {
    if (isNew) {
      // Append new card
      setCards((prev) => [...prev, savedCard]);
    } else {
      // Update existing card in state
      setCards((prev) => prev.map(c => c.id === savedCard.id ? savedCard : c));
    }
    loadBoardData(); // Force-sync from db to ensure ordering
  };

  return (
    <div className="space-y-6">
      
      {/* Dashboard Sub-Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">
            Product Status - {selectedProduct?.name || 'Loading...'}
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Drag cards to update statuses or click feature cards to edit details.
          </p>
        </div>

      </div>

      {/* Error display */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Drag & Drop Context Scroll Area */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
          <div className="flex gap-3.5 w-full">
            {COLUMNS.map((columnKey) => {
              const columnCards = cards.filter(card => card.status === columnKey);
              return (
                <KanbanColumn
                  key={columnKey}
                  statusKey={columnKey}
                  cards={columnCards}
                  onCardClick={handleCardClick}
                  isEmployee={isEmployee}
                  isAdmin={isAdmin}
                />
              );
            })}
          </div>
        </div>
      </DragDropContext>

      {/* Edit Modal (Employees only) */}
      <EditStatusModal
        isOpen={isModalOpen}
        card={activeCard}
        isEmployee={isEmployee}
        onClose={() => {
          setIsModalOpen(false);
          setActiveCard(null);
        }}
        onSave={handleSaveCard}
        employees={employees}
      />

    </div>
  );
};

export default KanbanBoard;

import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export const DeleteStoryConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete User Story",
  message = "Are you sure you want to delete this user story? This action cannot be undone."
}) => {
  // Close on Escape press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-3xl border border-slate-100 max-w-md w-full shadow-2xl p-6 overflow-hidden transform transition-all duration-300 animate-in fade-in zoom-in-95">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex gap-4">
          {/* Warning Icon */}
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex-shrink-0 flex items-center justify-center border border-red-100">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-800 leading-tight">
              {title}
            </h3>
            <p className="text-sm font-medium text-slate-500 mt-2 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-lg shadow-red-500/20 transition-all cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteStoryConfirmationModal;

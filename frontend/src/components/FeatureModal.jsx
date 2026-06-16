import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, Check, Eye } from 'lucide-react';

export const FeatureModal = ({
  feature = null,
  isOpen = false,
  onClose = () => {},
  onSave = () => {},
  employees = [],
  isAdmin = false
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('PLANNED');
  const [priority, setPriority] = useState('LOW');
  const [ownerId, setOwnerId] = useState('');
  const [releaseVersion, setReleaseVersion] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync state with selected feature when modal opens
  useEffect(() => {
    if (isOpen) {
      if (feature && feature.id !== 'new') {
        setTitle(feature.title || '');
        setDescription(feature.description || '');
        setStatus(feature.status || 'PLANNED');
        setPriority(feature.priority || 'LOW');
        setOwnerId(feature.ownerId || '');
        setReleaseVersion(feature.releaseVersion || '');
      } else {
        // Reset for new feature creation
        setTitle('');
        setDescription('');
        setStatus('PLANNED');
        setPriority('LOW');
        setOwnerId(employees[0]?.id || '');
        setReleaseVersion('');
      }
      setErrorMsg('');
    }
  }, [feature, isOpen, employees]);

  if (!isOpen) return null;

  const isNew = !feature || feature.id === 'new';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isAdmin) return; // Admins cannot save changes

    if (!title.trim()) {
      setErrorMsg('Feature Title is required.');
      return;
    }
    if (!ownerId) {
      setErrorMsg('Please select an owner.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        ownerId,
        releaseVersion: releaseVersion.trim()
      };
      await onSave(payload, isNew);
      onClose();
    } catch (err) {
      console.error('Failed to save feature details:', err);
      setErrorMsg(err.message || 'Failed to save feature changes.');
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: 'PLANNED', label: 'Planned' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'ON_HOLD', label: 'On Hold' }
  ];

  const priorityOptions = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'CRITICAL', label: 'Critical' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark Overlay */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-premium border border-slate-100 p-8 flex flex-col z-10 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <h2 className="text-lg font-bold text-slate-800">
            {isAdmin ? 'View Feature Details' : isNew ? 'Add Product Feature' : 'Edit Feature Details'}
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Read-Only Admin Banner */}
        {isAdmin && (
          <div className="p-3.5 mb-5 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-2">
            <Eye className="w-4 h-4 shrink-0" />
            <span>Read-Only View: Admins are not authorized to add, edit, or delete features.</span>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="p-3.5 mb-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Feature Title
            </label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isAdmin}
              placeholder="e.g. Real-time Notifications Panel"
              className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl py-3 px-4 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea 
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isAdmin}
              placeholder="Provide a detailed description of the feature..."
              className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl py-3 px-4 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
            />
          </div>

          {/* Select Options grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={isAdmin}
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                disabled={isAdmin}
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                {priorityOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Owner & Target Release Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Owner Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Owner
              </label>
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                disabled={isAdmin}
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                <option value="">Select an owner...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Release */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Target Release
              </label>
              <input 
                type="text" 
                value={releaseVersion}
                onChange={(e) => setReleaseVersion(e.target.value)}
                disabled={isAdmin}
                placeholder="e.g. v1.0.0"
                className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl py-2.5 px-4 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-slate-600 font-bold text-sm bg-white hover:bg-slate-50 transition-all cursor-pointer"
            >
              {isAdmin ? 'Close' : 'Cancel'}
            </button>
            
            {!isAdmin && (
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-white font-bold text-sm bg-blue-600 hover:bg-blue-700 transition-all cursor-pointer shadow-md shadow-blue-600/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-1" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {isNew ? 'Create Feature' : 'Save Changes'}
                  </>
                )}
              </button>
            )}
          </div>
        </form>

      </div>
    </div>
  );
};

export default FeatureModal;

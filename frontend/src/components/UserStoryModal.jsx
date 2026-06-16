import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, Check, Eye } from 'lucide-react';

export const UserStoryModal = ({
  story = null,
  isOpen = false,
  onClose = () => {},
  onSave = () => {},
  features = [],
  employees = [],
  isAdmin = false
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [featureId, setFeatureId] = useState('');
  const [status, setStatus] = useState('BACKLOG');
  const [priority, setPriority] = useState('LOW');
  const [storyPoints, setStoryPoints] = useState(1);
  const [sprint, setSprint] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync state with selected story when modal opens
  useEffect(() => {
    if (isOpen) {
      if (story && story.id !== 'new') {
        setTitle(story.title || '');
        setDescription(story.description || '');
        setFeatureId(story.featureId || '');
        setStatus(story.status || 'BACKLOG');
        setPriority(story.priority || 'LOW');
        setStoryPoints(story.storyPoints || 1);
        setSprint(story.sprint || '');
        setOwnerId(story.ownerId || '');
      } else {
        // Reset for new user story creation
        setTitle('As a user, I want to , so that ');
        setDescription('');
        setFeatureId(features[0]?.id || '');
        setStatus('BACKLOG');
        setPriority('LOW');
        setStoryPoints(1);
        setSprint('');
        setOwnerId(employees[0]?.id || '');
      }
      setErrorMsg('');
    }
  }, [story, isOpen, employees, features]);

  if (!isOpen) return null;

  const isNew = !story || story.id === 'new';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isAdmin) return; // Admins cannot save changes

    if (!featureId) {
      setErrorMsg('Please select a feature.');
      return;
    }
    if (!title.trim() || title === 'As a user, I want to , so that ') {
      setErrorMsg('User Story Agile text is required.');
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
        featureId,
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        storyPoints: parseInt(storyPoints, 10),
        ownerId,
        sprint: sprint.trim()
      };
      await onSave(payload, isNew);
      onClose();
    } catch (err) {
      console.error('Failed to save user story details:', err);
      setErrorMsg(err.message || 'Failed to save user story changes.');
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: 'BACKLOG', label: 'Backlog' },
    { value: 'READY', label: 'Ready' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'TESTING', label: 'Testing' },
    { value: 'DONE', label: 'Done' }
  ];

  const priorityOptions = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'CRITICAL', label: 'Critical' }
  ];

  const storyPointOptions = [1, 2, 3, 5, 8, 13];

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
            {isAdmin ? 'View User Story Details' : isNew ? 'Add User Story' : 'Edit User Story Details'}
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
            <span>Read-Only View: Admins are not authorized to add, edit, or delete user stories.</span>
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
          {/* Feature selector */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Linked Product Feature
            </label>
            <select
              value={featureId}
              onChange={(e) => setFeatureId(e.target.value)}
              disabled={isAdmin}
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              <option value="">Select feature...</option>
              {features.map(feat => (
                <option key={feat.id} value={feat.id}>
                  {feat.title}
                </option>
              ))}
            </select>
          </div>

          {/* Title / User Story Agile format */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              User Story (Agile Format)
            </label>
            <textarea
              rows="2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isAdmin}
              placeholder="As a [role], I want [action], so that [value]"
              className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl py-3 px-4 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Additional Description
            </label>
            <textarea 
              rows="2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isAdmin}
              placeholder="Provide a detailed story breakdown or checklists..."
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

          {/* Story Points & Sprint & Owner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Story Points */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Story Points
              </label>
              <select
                value={storyPoints}
                onChange={(e) => setStoryPoints(e.target.value)}
                disabled={isAdmin}
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                {storyPointOptions.map(pts => (
                  <option key={pts} value={pts}>{pts} pts</option>
                ))}
              </select>
            </div>

            {/* Sprint */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Sprint
              </label>
              <input 
                type="text" 
                value={sprint}
                onChange={(e) => setSprint(e.target.value)}
                disabled={isAdmin}
                placeholder="e.g. Sprint 1"
                className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl py-2.5 px-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
              />
            </div>

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
                <option value="">Select owner...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
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
                    {isNew ? 'Create Story' : 'Save Changes'}
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

export default UserStoryModal;

import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, Check, Shield, User } from 'lucide-react';
import { authService } from '../services/authService.js';

export const MemberModal = ({
  member = null,
  isOpen = false,
  onClose = () => {},
  onSave = () => {},
  products = []
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('EMPLOYEE');
  const [isActive, setIsActive] = useState(true);
  const [taggedProductIds, setTaggedProductIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const currentUser = authService.getUser();
  const isEditingSelf = member && member.id === currentUser?.id;
  const isNew = !member || member.id === 'new';

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (member && member.id !== 'new') {
        setName(member.name || '');
        setEmail(member.email || '');
        setRole(member.role || 'EMPLOYEE');
        setIsActive(member.isActive !== false);
        setTaggedProductIds(member.taggedProductIds || []);
      } else {
        setName('');
        setEmail('');
        setRole('EMPLOYEE');
        setIsActive(true);
        setTaggedProductIds([]);
      }
      setErrorMsg('');
    }
  }, [member, isOpen]);

  if (!isOpen) return null;

  const handleToggleProduct = (productId) => {
    setTaggedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrorMsg('Member Name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('A valid email address is required.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role,
        ...(!isNew && { isActive }),
        taggedProductIds: (role === 'EMPLOYEE' || role === 'BOTH') ? taggedProductIds : []
      };
      await onSave(payload, isNew);
      onClose();
    } catch (err) {
      console.error('Failed to save member details:', err);
      setErrorMsg(err.message || 'Failed to save member.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-premium border border-slate-100 p-8 flex flex-col z-10 animate-in zoom-in-95 duration-150">
        
        {/* Title */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <h2 className="text-lg font-bold text-slate-800">
            {isNew ? 'Pre-approve New Member' : 'Edit Member Details'}
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Self Edit Notice */}
        {isEditingSelf && (
          <div className="p-3 mb-5 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-[11px] font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
            <span>Self Protection Guard: You cannot demote or deactivate your own admin profile to prevent accidental lockout.</span>
          </div>
        )}

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3.5 mb-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Member Name */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Full Name
            </label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jane Doe"
              className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl py-3 px-4 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              required
            />
          </div>

          {/* Member Email */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Email Address (Pre-approve)
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. jane.doe@company.com"
              className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl py-3 px-4 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              required
            />
          </div>

          {/* Role Choice */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Workspace Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isEditingSelf}
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              <option value="EMPLOYEE">Developer (Employee)</option>
              <option value="ADMIN">Administrator</option>
              <option value="BOTH">Admin & Developer</option>
            </select>
          </div>

          {/* Tag to Projects Checklist (Only for Developers) */}
          {(role === 'EMPLOYEE' || role === 'BOTH') && products.length > 0 && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-150">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Tag to Projects / Products
              </label>
              <div className="border border-slate-100 bg-slate-50/50 p-4.5 rounded-2xl max-h-48 overflow-y-auto space-y-2.5 shadow-inner">
                {products.map((p) => {
                  const isChecked = taggedProductIds.includes(p.id);
                  return (
                    <label 
                      key={p.id}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer select-none transition-all duration-150 ${
                        isChecked 
                          ? 'bg-blue-50/30 border-blue-500/35 text-blue-700 font-bold shadow-xs' 
                          : 'bg-white border-slate-100 hover:border-slate-200 text-slate-600 font-medium'
                      }`}
                    >
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleProduct(p.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs">{p.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Status (Only when modifying) */}
          {!isNew && (
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
              <div>
                <span className="block text-xs font-bold text-slate-800">Account Access Status</span>
                <span className="block text-[11px] text-slate-400 mt-0.5">Allow login via Microsoft SSO</span>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={isEditingSelf}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:bg-slate-100 peer-disabled:after:bg-slate-300 peer-disabled:cursor-not-allowed" />
              </label>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-slate-600 font-bold text-sm bg-white hover:bg-slate-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            
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
                  {isNew ? 'Add Member' : 'Save Details'}
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default MemberModal;

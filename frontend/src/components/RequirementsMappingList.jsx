import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  X, 
  Edit2, 
  Trash2, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Percent,
  Check,
  Shield,
  Eye,
  Settings
} from 'lucide-react';
import { productService } from '../services/productService.js';
import Toast from './Toast.jsx';

export const RequirementsMappingList = ({ selectedProduct, userRole }) => {
  const [mappings, setMappings] = useState([]);
  const [userStories, setUserStories] = useState([]);
  const [functionalRequirements, setFunctionalRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal States
  const [mappingModalOpen, setMappingModalOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState(null);
  const [selectedStoryId, setSelectedStoryId] = useState('');
  const [selectedFRId, setSelectedFRId] = useState('');

  // Quick-create Functional Requirement State inside Modal
  const [showQuickCreateFR, setShowQuickCreateFR] = useState(false);
  const [quickFRId, setQuickFRId] = useState('');
  const [quickFRTitle, setQuickFRTitle] = useState('');
  const [creatingQuickFR, setCreatingQuickFR] = useState(false);
  const [quickFRError, setQuickFRError] = useState('');

  // Delete Modal States
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [mappingToDelete, setMappingToDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  const isAdmin = userRole === 'ADMIN' || userRole === 'BOTH';

  // Fetch all initial data
  const fetchData = async () => {
    if (!selectedProduct) return;
    setLoading(true);
    try {
      // Fetch mappings, stories, and requirements in parallel
      const [mappingsData, storiesData, requirementsData] = await Promise.all([
        productService.getRequirementsMappings(selectedProduct.id, {
          status: statusFilter !== 'All' ? statusFilter : undefined,
          search: search || undefined
        }),
        productService.getUserStories(selectedProduct.id),
        productService.getFunctionalRequirements(selectedProduct.id)
      ]);
      setMappings(mappingsData);
      setUserStories(storiesData);
      setFunctionalRequirements(requirementsData);
    } catch (error) {
      console.error('Failed to load requirements mapping data:', error);
      showToast('Error', 'Failed to load trace mappings and requirements.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Trigger data fetch when product or filters change
  useEffect(() => {
    fetchData();
  }, [selectedProduct, statusFilter, search]);

  const showToast = (title, message, type = 'success') => {
    setToast({ title, message, type });
  };

  // Mapping sequential Story IDs (US-001) for selection dropdowns
  const storyDisplayIdMap = {};
  const sortedAllStories = [...userStories].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  sortedAllStories.forEach((story, idx) => {
    storyDisplayIdMap[story.id] = `US-${String(idx + 1).padStart(3, '0')}`;
  });

  const totalStoriesCount = userStories.length;
  // Calculate mapped stories.
  // A story is mapped if there is a mapping row with this userStoryId that has a mapped requirement.
  const mappedStoriesCount = userStories.filter(story => {
    return mappings.some(m => m.userStoryId === story.id && m.status === 'Mapped');
  }).length;

  const unmappedStoriesCount = totalStoriesCount - mappedStoriesCount;
  const coveragePercentage = totalStoriesCount > 0 
    ? Math.round((mappedStoriesCount / totalStoriesCount) * 100) 
    : 0;

  // CRUD Handlers
  const handleOpenAddModal = () => {
    if (!isAdmin) return;
    setEditingMapping(null);
    setSelectedStoryId(userStories[0]?.id || '');
    setSelectedFRId(functionalRequirements[0]?.id || '');
    setShowQuickCreateFR(false);
    setQuickFRId('');
    setQuickFRTitle('');
    setQuickFRError('');
    setMappingModalOpen(true);
  };

  const handleOpenEditModal = (row) => {
    if (!isAdmin) return;
    setEditingMapping(row);
    setSelectedStoryId(row.userStoryId);
    setSelectedFRId(row.functionalRequirementId || '');
    setShowQuickCreateFR(false);
    setQuickFRId('');
    setQuickFRTitle('');
    setQuickFRError('');
    setMappingModalOpen(true);
  };

  const handleSaveMapping = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    if (!selectedStoryId) {
      showToast('Validation Error', 'Please select a User Story.', 'error');
      return;
    }

    if (!selectedFRId) {
      showToast('Validation Error', 'Please select a Functional Requirement.', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        userStoryId: selectedStoryId,
        functionalRequirementId: selectedFRId
      };

      if (editingMapping) {
        await productService.updateRequirementsMapping(editingMapping.id, payload);
        showToast('Success', 'Requirements mapping updated successfully.', 'success');
      } else {
        await productService.createRequirementsMapping(payload);
        showToast('Success', 'Requirements mapping created successfully.', 'success');
      }
      setMappingModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to save mapping:', error);
      showToast('Error', error.message || 'Failed to save requirements mapping.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (row) => {
    if (!isAdmin) return;
    setMappingToDelete(row);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!isAdmin || !mappingToDelete) return;
    setSaving(true);
    try {
      await productService.deleteRequirementsMapping(mappingToDelete.id);
      showToast('Success', 'Requirements mapping deleted successfully.', 'success');
      setDeleteModalOpen(false);
      setMappingToDelete(null);
      fetchData();
    } catch (error) {
      console.error('Failed to delete mapping:', error);
      showToast('Error', error.message || 'Failed to delete requirements mapping.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // On-the-fly creation of Functional Requirement
  const handleQuickCreateFR = async () => {
    if (!quickFRId.trim()) {
      setQuickFRError('Requirement ID (e.g. FR-100) is required.');
      return;
    }
    if (!quickFRTitle.trim()) {
      setQuickFRError('Requirement Title is required.');
      return;
    }

    setCreatingQuickFR(true);
    setQuickFRError('');
    try {
      const newFR = await productService.createFunctionalRequirement({
        productId: selectedProduct.id,
        reqId: quickFRId.trim(),
        title: quickFRTitle.trim()
      });

      // Update local requirement options lists
      setFunctionalRequirements(prev => [...prev, newFR].sort((a, b) => a.reqId.localeCompare(b.reqId)));
      setSelectedFRId(newFR.id);
      
      // Reset fields
      setQuickFRId('');
      setQuickFRTitle('');
      setShowQuickCreateFR(false);
      showToast('Success', `Functional Requirement ${newFR.reqId} created successfully.`, 'success');
    } catch (error) {
      console.error('Quick FR creation failed:', error);
      setQuickFRError(error.message || 'Failed to create requirement.');
    } finally {
      setCreatingQuickFR(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* Toast Alert Portal */}
      {toast && (
        <div className="fixed top-6 right-6 z-50">
          <Toast
            title={toast.title}
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}
 
      {/* Header and Action Sub-Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight font-sans">Requirements Mapping</h1>
            {isAdmin ? (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 font-bold text-[10px] uppercase tracking-wider font-sans">
                <Shield className="w-3 h-3" />
                Admin Mode
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 font-bold text-[10px] uppercase tracking-wider font-sans">
                <Eye className="w-3 h-3" />
                Read Only
              </span>
            )}
          </div>
          <p className="text-xs font-semibold text-slate-400 mt-1 font-sans">
            Trace and map User Stories to Functional Requirements for <span className="text-blue-600 font-bold">{selectedProduct.name}</span>
          </p>
        </div>
 
        {isAdmin && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 hover:shadow-blue-600/20 transition-all cursor-pointer font-sans"
          >
            <Plus className="w-4 h-4" />
            Add Mapping
          </button>
        )}
      </div>
 
      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Stories */}
        <div className="bg-white border border-slate-100 p-3.5 rounded-xl shadow-xs flex items-center gap-3 transition-all duration-200 hover:shadow-md">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-sans">Total Stories</div>
            <div className="text-lg font-bold text-slate-800 mt-0.5 font-sans">
              {loading ? (
                <div className="h-5 w-8 bg-slate-100 rounded animate-pulse" />
              ) : (
                totalStoriesCount
              )}
            </div>
          </div>
        </div>
 
        {/* Card 2: Mapped Stories */}
        <div className="bg-white border border-slate-100 p-3.5 rounded-xl shadow-xs flex items-center gap-3 transition-all duration-200 hover:shadow-md">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-sans">Mapped Stories</div>
            <div className="text-lg font-bold text-slate-800 mt-0.5 font-sans">
              {loading ? (
                <div className="h-5 w-8 bg-slate-100 rounded animate-pulse" />
              ) : (
                mappedStoriesCount
              )}
            </div>
          </div>
        </div>
 
        {/* Card 3: Unmapped Stories */}
        <div className="bg-white border border-slate-100 p-3.5 rounded-xl shadow-xs flex items-center gap-3 transition-all duration-200 hover:shadow-md">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-sans">Unmapped Stories</div>
            <div className="text-lg font-bold text-slate-800 mt-0.5 font-sans">
              {loading ? (
                <div className="h-5 w-8 bg-slate-100 rounded animate-pulse" />
              ) : (
                unmappedStoriesCount
              )}
            </div>
          </div>
        </div>
 
        {/* Card 4: Coverage Percentage */}
        <div className="bg-white border border-slate-100 p-3.5 rounded-xl shadow-xs flex items-center gap-3 transition-all duration-200 hover:shadow-md">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Percent className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-sans">Mapping Coverage</div>
            <div className="text-lg font-bold text-slate-800 mt-0.5 font-sans">
              {loading ? (
                <div className="h-5 w-8 bg-slate-100 rounded animate-pulse" />
              ) : (
                `${coveragePercentage}%`
              )}
            </div>
          </div>
        </div>
      </div>
 
      {/* Search and Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Field */}
        <div className="relative flex-1 max-w-sm">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-3.5 w-3.5 text-slate-400" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by story ID, title, req ID..."
            className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-sans"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
 
        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
 
          {/* Status Filter */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider font-sans">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer font-sans"
            >
              <option value="All">All Statuses</option>
              <option value="Mapped">Mapped</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Mapping Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {['User Story ID', 'User Story Title', 'Functional Req ID', 'Requirement Title', 'Status', 'Actions'].map((h, i) => (
                  <th key={i} className="py-4 px-6 font-sans">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(4)].map((_, idx) => (
                <tr key={idx} className="border-b border-slate-50 last:border-0">
                  <td className="py-4 px-6"><div className="h-4 w-12 bg-slate-100 rounded animate-pulse" /></td>
                  <td className="py-4 px-6"><div className="h-4 w-48 bg-slate-100 rounded animate-pulse" /></td>
                  <td className="py-4 px-6"><div className="h-4 w-12 bg-slate-100 rounded animate-pulse" /></td>
                  <td className="py-4 px-6"><div className="h-4 w-40 bg-slate-100 rounded animate-pulse" /></td>
                  <td className="py-4 px-6"><div className="h-6 w-16 bg-slate-100 rounded animate-pulse" /></td>
                  <td className="py-4 px-6"><div className="h-8 w-12 bg-slate-100 rounded animate-pulse" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : mappings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
          <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 font-semibold text-xs font-sans">No requirements mappings found matching the filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10">
                  <th className="py-4 px-6 w-32 font-sans">User Story ID</th>
                  <th className="py-4 px-6 min-w-[200px] font-sans">User Story Title</th>
                  <th className="py-4 px-6 w-36 font-sans">Functional Req ID</th>
                  <th className="py-4 px-6 min-w-[200px] font-sans">Requirement Title</th>
                  <th className="py-4 px-6 w-32 font-sans">Status</th>
                  <th className="py-4 px-6 w-24 text-right font-sans">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mappings.map((row) => (
                  <tr 
                    key={row.id || `${row.userStoryId}-pending`}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors last:border-0 group"
                  >
                    {/* User Story ID */}
                    <td className="py-4 px-6 text-xs font-bold text-slate-400 font-sans whitespace-nowrap">
                      {row.userStoryDisplayId}
                    </td>

                    {/* User Story Title */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-800 text-xs leading-tight font-sans break-words max-w-sm">
                        {row.userStoryTitle}
                      </div>
                      {row.userStorySprint && (
                        <div className="text-[10px] font-semibold text-blue-500 mt-1 font-sans">
                          {row.userStorySprint}
                        </div>
                      )}
                    </td>

                    {/* Functional Req ID */}
                    <td className="py-4 px-6 text-xs font-bold text-slate-600 font-sans whitespace-nowrap">
                      {row.functionalRequirementReqId}
                    </td>

                    {/* Functional Requirement Title */}
                    <td className="py-4 px-6 text-xs font-semibold text-slate-700 font-sans break-words max-w-sm">
                      {row.functionalRequirementTitle}
                    </td>

                    {/* Status badge */}
                    <td className="py-4 px-6">
                      {row.status === 'Mapped' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 border border-emerald-100 text-emerald-600 font-sans">
                          Mapped
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 border border-amber-100 text-amber-600 font-sans">
                          Pending
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      {isAdmin ? (
                        <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          {row.id ? (
                            <>
                              <button
                                onClick={() => handleOpenEditModal(row)}
                                title="Edit mapping"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(row)}
                                title="Delete mapping"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingMapping(null);
                                setSelectedStoryId(row.userStoryId);
                                setSelectedFRId(functionalRequirements[0]?.id || '');
                                setShowQuickCreateFR(false);
                                setMappingModalOpen(true);
                              }}
                              title="Create map link"
                              className="px-2.5 py-1 rounded-lg border border-blue-200 hover:bg-blue-50 text-blue-600 text-[10px] font-bold transition-all cursor-pointer font-sans"
                            >
                              Map Link
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300 text-[10px]">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Mapping Modal */}
      {mappingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => !saving && setMappingModalOpen(false)}
          />

          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-premium border border-slate-100 p-8 flex flex-col z-10 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <h2 className="text-base font-bold text-slate-800 font-sans flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-blue-600" />
                {editingMapping ? 'Edit Requirements Mapping' : 'Add Requirements Mapping'}
              </h2>
              <button 
                onClick={() => setMappingModalOpen(false)}
                disabled={saving}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleSaveMapping} className="space-y-5">
              {/* User Story Selection */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-sans">
                  Select User Story
                </label>
                <select
                  value={selectedStoryId}
                  onChange={(e) => setSelectedStoryId(e.target.value)}
                  disabled={saving || !!editingMapping} // Story is fixed during edit mapping
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer font-sans"
                >
                  <option value="">Select a user story...</option>
                  {userStories.map(story => (
                    <option key={story.id} value={story.id}>
                      {storyDisplayIdMap[story.id]} : {story.title.substring(0, 50)}{story.title.length > 50 ? '...' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Functional Requirement Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">
                    Select Functional Requirement
                  </label>
                  {!showQuickCreateFR && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowQuickCreateFR(true);
                        setQuickFRError('');
                      }}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer font-sans"
                    >
                      + Create New
                    </button>
                  )}
                </div>

                {!showQuickCreateFR ? (
                  <select
                    value={selectedFRId}
                    onChange={(e) => setSelectedFRId(e.target.value)}
                    disabled={saving}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer font-sans"
                  >
                    <option value="">Select a functional requirement...</option>
                    {functionalRequirements.map(req => (
                      <option key={req.id} value={req.id}>
                        {req.reqId}: {req.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  /* Quick Create FR Sub-Form */
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans flex items-center gap-1.5">
                      <Settings className="w-3.5 h-3.5" />
                      Quick Create Functional Req
                    </div>

                    {quickFRError && (
                      <div className="text-[10px] font-bold text-red-500 font-sans">
                        {quickFRError}
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <input
                          type="text"
                          value={quickFRId}
                          onChange={(e) => setQuickFRId(e.target.value)}
                          placeholder="ID (e.g. FR-005)"
                          className="w-full bg-white border border-slate-200 rounded-lg py-2 px-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 font-sans"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={quickFRTitle}
                          onChange={(e) => setQuickFRTitle(e.target.value)}
                          placeholder="Requirement Title"
                          className="w-full bg-white border border-slate-200 rounded-lg py-2 px-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 font-sans"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowQuickCreateFR(false)}
                        disabled={creatingQuickFR}
                        className="px-2.5 py-1 text-[10px] font-bold text-slate-500 hover:bg-slate-150 rounded-lg border border-slate-200 cursor-pointer font-sans"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleQuickCreateFR}
                        disabled={creatingQuickFR}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg cursor-pointer font-sans flex items-center gap-1"
                      >
                        {creatingQuickFR ? 'Creating...' : 'Create & Select'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setMappingModalOpen(false)}
                  disabled={saving}
                  className="px-4 py-2 border border-slate-200 hover:border-slate-300 rounded-xl text-slate-600 font-bold text-xs bg-white hover:bg-slate-50 transition-all cursor-pointer font-sans"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !selectedStoryId || !selectedFRId || showQuickCreateFR}
                  className="flex items-center gap-1 px-5 py-2.5 rounded-xl text-white font-bold text-xs bg-blue-600 hover:bg-blue-700 transition-all cursor-pointer shadow-md shadow-blue-600/10 disabled:opacity-50 disabled:cursor-not-allowed font-sans"
                >
                  {saving ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin mr-1" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      {editingMapping ? 'Save Changes' : 'Create Link'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => !saving && setDeleteModalOpen(false)}
          />

          <div className="relative w-full max-w-xs bg-white rounded-3xl shadow-premium border border-slate-100 p-6 flex flex-col z-10 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 font-sans">Delete Mapping</h3>
            </div>
            
            <p className="text-xs text-slate-500 font-sans leading-relaxed mb-6">
              Are you sure you want to delete this mapping relation between <strong className="text-slate-700">{mappingToDelete?.userStoryDisplayId}</strong> and <strong className="text-slate-700">{mappingToDelete?.functionalRequirementReqId}</strong>? 
              This will only remove the mapping relation and will not delete either the User Story or the Functional Requirement.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={saving}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold text-xs bg-white hover:bg-slate-50 transition-all cursor-pointer font-sans"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-white font-bold text-xs bg-red-600 hover:bg-red-700 transition-all cursor-pointer shadow-md shadow-red-600/10 font-sans"
              >
                {saving ? 'Deleting...' : 'Delete mapping'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RequirementsMappingList;

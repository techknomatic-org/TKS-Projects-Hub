import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Search, SlidersHorizontal, User, Shield, ShieldCheck, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { useMsal } from '@azure/msal-react';
import { productService } from '../services/productService.js';
import { authService } from '../services/authService.js';
import MemberModal from './MemberModal.jsx';
import DeleteConfirmationModal from './DeleteConfirmationModal.jsx';

export const MembersList = ({ userRole }) => {
  const [members, setMembers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters State
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);

  const isAdmin = userRole === 'ADMIN' || userRole === 'BOTH';
  const currentUser = authService.getUser();
  const { instance, accounts } = useMsal();
  const fetchedPhotosRef = useRef(new Set());

  // Silent automatic MS Graph profile picture sync
  useEffect(() => {
    const fetchMissingPhotos = async () => {
      if (accounts.length === 0 || members.length === 0) return;

      const membersWithNoPhoto = members.filter(
        (m) => !m.profileImage && m.email && !fetchedPhotosRef.current.has(m.email)
      );

      if (membersWithNoPhoto.length === 0) return;

      try {
        const tokenResponse = await instance.acquireTokenSilent({
          scopes: ['user.read', 'User.ReadBasic.All'],
          account: accounts[0]
        }).catch(() => {
          return instance.acquireTokenSilent({
            scopes: ['user.read'],
            account: accounts[0]
          });
        });

        const accessToken = tokenResponse.accessToken;

        for (const member of membersWithNoPhoto) {
          const email = member.email;
          fetchedPhotosRef.current.add(email);

          try {
            console.log(`[GRAPH] Querying profile picture for: ${email}`);
            const response = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(email)}/photo/$value`, {
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            });

            if (response.ok) {
              const blob = await response.blob();
              const base64Photo = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(blob);
              });

              if (base64Photo) {
                // Update frontend state
                setMembers(prev => prev.map(m => m.id === member.id ? { ...m, profileImage: base64Photo } : m));

                // Save to DB
                console.log(`[API] Saving profile image to DB for user: ${email}`);
                await productService.updateUser(member.id, { profileImage: base64Photo }).catch(e => {
                  console.warn(`Failed to save fetched photo for ${email} in DB:`, e);
                });
              }
            }
          } catch (itemErr) {
            console.warn(`Failed fetching photo for ${email}:`, itemErr);
          }
        }
      } catch (err) {
        console.warn('MSAL silent token acquisition failed for Graph user directory photo fetch:', err);
      }
    };

    fetchMissingPhotos();
  }, [members, accounts, instance]);

  const fetchMembersAndProducts = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [usersData, productsData] = await Promise.all([
        productService.getAllUsers(),
        productService.getProducts()
      ]);
      setMembers(usersData);
      setProducts(productsData);
    } catch (err) {
      console.error('Failed to load members or projects:', err);
      setErrorMsg(err.message || 'Failed to fetch workspace members and projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembersAndProducts();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, statusFilter, projectFilter]);

  // Combined Filters Logic
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());

    let matchesRole = true;
    if (roleFilter === 'ADMIN') {
      matchesRole = m.role === 'ADMIN' || m.role === 'BOTH';
    } else if (roleFilter === 'EMPLOYEE') {
      matchesRole = m.role === 'EMPLOYEE' || m.role === 'BOTH';
    } else if (roleFilter === 'BOTH') {
      matchesRole = m.role === 'BOTH';
    }

    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = m.isActive === true;
    if (statusFilter === 'inactive') matchesStatus = m.isActive === false;

    const matchesProject = !projectFilter ||
      (m.taggedProductIds && m.taggedProductIds.includes(projectFilter)) ||
      (m.assignedProductIds && m.assignedProductIds.includes(projectFilter));

    return matchesSearch && matchesRole && matchesStatus && matchesProject;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMembers.slice(indexOfFirstItem, indexOfLastItem);

  const handleClearFilters = () => {
    setSearch('');
    setRoleFilter('');
    setStatusFilter('');
    setProjectFilter('');
  };

  const handleAddClick = () => {
    setSelectedMember({ id: 'new' });
    setModalOpen(true);
  };

  const handleEditClick = (member) => {
    setSelectedMember(member);
    setModalOpen(true);
  };

  const handleDeleteClick = (member) => {
    setMemberToDelete(member);
    setDeleteModalOpen(true);
  };

  const handleSaveMember = async (payload, isNew) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      if (isNew) {
        const newMember = await productService.createUser(payload);
        setMembers((prev) => [...prev, newMember].sort((a, b) => a.name.localeCompare(b.name)));
        setSuccessMsg(`Successfully added and pre-approved ${payload.name}.`);
      } else {
        const updatedMember = await productService.updateUser(selectedMember.id, payload);
        setMembers((prev) =>
          prev.map((m) => (m.id === selectedMember.id ? updatedMember : m))
        );
        setSuccessMsg(`Successfully updated member profile for ${payload.name}.`);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred while saving the member.');
      throw err;
    }
  };

  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await productService.deleteUser(memberToDelete.id);
      setMembers((prev) => prev.filter((m) => m.id !== memberToDelete.id));
      setSuccessMsg(`Successfully removed member ${memberToDelete.name} from workspace.`);
      setDeleteModalOpen(false);
      setMemberToDelete(null);
    } catch (err) {
      console.error('Failed to delete user:', err);
      setErrorMsg(err.message || 'Failed to remove member. They may have active tasks assigned.');
      setDeleteModalOpen(false);
      setMemberToDelete(null);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="flex-1 flex flex-col gap-6 p-6 md:p-8 overflow-y-auto animate-in fade-in duration-200">

      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Workspace Members</h1>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            View whitelisted developers, administrators, and manage platform permissions.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleAddClick}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Member
          </button>
        )}
      </div>

      {/* Global alert feedback messages */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-green-50 border border-green-100 text-green-600 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter panel */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col md:flex-row items-center gap-4">

        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 focus:border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
          />
        </div>

        {/* Filters Grid */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">Administrators</option>
            <option value="EMPLOYEE">Developers</option>
            <option value="BOTH">Admin & Developer</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Access</option>
            <option value="inactive">Inactive / Blocked</option>
          </select>

          {/* Project Filter */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer"
          >
            <option value="">All Projects</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Clear Button */}
          {(search || roleFilter || statusFilter || projectFilter) && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Members directory table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {['Member', 'Role', 'Projects', 'Status', 'Pre-approved Date', 'Actions'].map((h, i) => (
                  <th key={i} className="py-4 px-6">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(3)].map((_, i) => (
                <tr key={i} className="border-b border-slate-50 last:border-0">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 animate-pulse" />
                      <div>
                        <div className="h-4 w-32 bg-slate-100 rounded animate-pulse mb-1.5" />
                        <div className="h-3 w-44 bg-slate-50 rounded animate-pulse" />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6"><div className="h-6 w-16 bg-slate-100 rounded-md animate-pulse" /></td>
                  <td className="py-4 px-6"><div className="h-6 w-24 bg-slate-100 rounded-md animate-pulse" /></td>
                  <td className="py-4 px-6"><div className="h-6 w-16 bg-slate-100 rounded-md animate-pulse" /></td>
                  <td className="py-4 px-6"><div className="h-4 w-20 bg-slate-100 rounded animate-pulse" /></td>
                  <td className="py-4 px-6"><div className="h-8 w-16 bg-slate-100 rounded-lg animate-pulse" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
          <p className="text-slate-400 font-semibold text-sm">No members found matching the search/filter criteria.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10">
                  <th className="py-4 px-6">Member</th>
                  <th className="py-4 px-6 w-32">Role</th>
                  <th className="py-4 px-6 w-48">Projects</th>
                  <th className="py-4 px-6 w-32">SSO Login Access</th>
                  <th className="py-4 px-6 w-44">Pre-approved Date</th>
                  {isAdmin && <th className="py-4 px-6 w-28 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {currentItems.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors last:border-0 group"
                  >
                    {/* User profile image/initials & details */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {member.profileImage ? (
                          <img
                            src={member.profileImage}
                            alt={member.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-100"
                          />
                        ) : (
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm uppercase ${member.role === 'BOTH' ? 'bg-gradient-to-r from-indigo-600 to-blue-600' : member.role === 'ADMIN' ? 'bg-indigo-600' : 'bg-blue-600'
                            }`}>
                            {getInitials(member.name)}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-800 text-sm leading-tight flex items-center gap-1.5">
                            {member.name}
                            {member.id === currentUser?.id && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 font-bold rounded-md uppercase">You</span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 font-semibold mt-0.5 break-all">
                            {member.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role Pillar */}
                    <td className="py-4 px-6">
                      {member.role === 'BOTH' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider bg-purple-50 text-purple-600 border border-purple-100 shadow-xs">
                          <Shield className="w-3 h-3 text-purple-500" />
                          Admin & Dev
                        </span>
                      ) : member.role === 'ADMIN' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-xs">
                          <Shield className="w-3 h-3 text-indigo-500" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100 shadow-xs">
                          <User className="w-3 h-3 text-blue-500" />
                          Developer
                        </span>
                      )}
                    </td>

                    {/* Tagged Projects Column */}
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                        {(() => {
                          const taggedProds = products.filter(p => member.taggedProductIds?.includes(p.id));
                          if (taggedProds.length === 0) {
                            return <span className="text-slate-400 text-xs font-semibold">-</span>;
                          }
                          return taggedProds.map((p) => (
                            <span 
                              key={p.id} 
                              className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200/60 shadow-2xs"
                            >
                              {p.name}
                            </span>
                          ));
                        })()}
                      </div>
                    </td>

                    {/* Access switch (isActive) */}
                    <td className="py-4 px-6">
                      {member.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider bg-green-50 text-green-600 border border-green-100">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider bg-red-50 text-red-600 border border-red-100">
                          <XCircle className="w-3.5 h-3.5" />
                          Deactivated
                        </span>
                      )}
                    </td>

                    {/* Preapproved Date */}
                    <td className="py-4 px-6 text-xs font-semibold text-slate-500">
                      {formatDate(member.createdAt)}
                    </td>

                    {/* Edit/Delete actions (restricted to admins) */}
                    {isAdmin && (
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditClick(member)}
                            title="Edit details"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {member.id !== currentUser?.id && (
                            <button
                              onClick={() => handleDeleteClick(member)}
                              title="Remove member"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination controls */}
      {!loading && filteredMembers.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-400">
            Showing <span className="text-slate-700 font-bold">{indexOfFirstItem + 1}</span> to{' '}
            <span className="text-slate-700 font-bold">
              {Math.min(indexOfLastItem, filteredMembers.length)}
            </span>{' '}
            of <span className="text-slate-700 font-bold">{filteredMembers.length}</span> members
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer"
            >
              <Search className="w-4 h-4 rotate-180 hidden" /> {/* dummy placeholder structure */}
              &lt;
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${currentPage === i + 1
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer"
            >
              &gt;
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <MemberModal
        member={selectedMember}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedMember(null);
        }}
        onSave={handleSaveMember}
        products={products}
      />

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setMemberToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Remove Member"
        message={`Are you sure you want to remove ${memberToDelete?.name} from this workspace? They will lose access to log in or modify projects.`}
      />

    </div>
  );
};

export default MembersList;

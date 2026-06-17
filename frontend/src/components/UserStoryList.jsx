import React, { useState, useEffect } from 'react';
import { Download, ChevronLeft, ChevronRight, Upload, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { productService } from '../services/productService.js';
import UserStoryFilters from './UserStoryFilters.jsx';
import UserStoryTable from './UserStoryTable.jsx';

export const UserStoryList = ({ selectedProduct, userRole }) => {
  const [userStories, setUserStories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const canImportExcel = userRole === 'ADMIN' || userRole === 'BOTH';

  // Fetch stories and employees
  const fetchData = async () => {
    if (!selectedProduct) return;
    setLoading(true);
    try {
      const [storiesData, employeesData] = await Promise.all([
        productService.getUserStories(selectedProduct.id),
        productService.getEmployees(selectedProduct.id)
      ]);
      setUserStories(storiesData);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Failed to load user stories panel data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedProduct]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, priorityFilter, ownerFilter]);

  // Combined Filters Logic
  const filteredStories = userStories.filter((us) => {
    const matchesSearch =
      us.title.toLowerCase().includes(search.toLowerCase()) ||
      (us.description && us.description.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = !statusFilter || us.status === statusFilter;
    const matchesPriority = !priorityFilter || us.priority === priorityFilter;
    const matchesOwner = !ownerFilter || us.ownerId === ownerFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesOwner;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredStories.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStories.slice(indexOfFirstItem, indexOfLastItem);

  // Clear Filters
  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setOwnerFilter('');
  };

  // Export Logic
  const prepareExportData = () => {
    return filteredStories.map((us, i) => ({
      'Story ID': `US-${String(i + 1).padStart(3, '0')}`,
      'User Story': us.title,
      'Description': us.description || '',
      'Priority': us.priority,
      'Status': us.status,
      'Story Points': us.storyPoints !== undefined ? us.storyPoints : 0,
      'Sprint': us.sprint || 'N/A',
      'Owner': us.owner ? us.owner.name : 'Unassigned',
      'Created Date': us.createdAt ? new Date(us.createdAt).toLocaleDateString() : ''
    }));
  };

  const handleExportExcel = () => {
    const formatted = prepareExportData();
    const ws = XLSX.utils.json_to_sheet(formatted);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'User Stories');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(data, `${selectedProduct.name}_user_stories_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setLoading(true);
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws);

        if (rawData.length === 0) {
          alert('The Excel file is empty.');
          return;
        }

        const mappedStories = rawData.map((row) => {
          const getVal = (possibleKeys) => {
            const key = Object.keys(row).find(k => 
              possibleKeys.some(pk => k.toLowerCase().trim() === pk.toLowerCase())
            );
            return key ? String(row[key]).trim() : undefined;
          };

          const rawTitle = getVal(['user story', 'title', 'story', 'name', 'user story title']);
          const rawDescription = getVal(['description', 'desc']);
          const rawPriority = getVal(['priority']);
          const rawStatus = getVal(['status']);
          const rawPoints = getVal(['story points', 'storypoints', 'points', 'sp']);
          const rawOwner = getVal(['owner', 'assigned to', 'assigned', 'owner email', 'email']);
          const rawSprint = getVal(['sprint']);

          let priority = 'LOW';
          if (rawPriority) {
            const lowerPriority = rawPriority.toLowerCase();
            if (lowerPriority.includes('medium')) priority = 'MEDIUM';
            else if (lowerPriority.includes('high')) priority = 'HIGH';
            else if (lowerPriority.includes('critical')) priority = 'CRITICAL';
          }

          let status = 'BACKLOG';
          if (rawStatus) {
            const lowerStatus = rawStatus.toLowerCase().replace(' ', '_');
            if (lowerStatus.includes('ready')) status = 'READY';
            else if (lowerStatus.includes('progress') || lowerStatus.includes('started')) status = 'IN_PROGRESS';
            else if (lowerStatus.includes('testing')) status = 'TESTING';
            else if (lowerStatus.includes('done') || lowerStatus.includes('completed')) status = 'DONE';
          }

          // Lookup matching registered employee to get valid email
          let ownerEmail = null;
          if (rawOwner) {
            const matchedEmployee = employees.find(emp => 
              emp.name.toLowerCase().trim() === rawOwner.toLowerCase().trim() ||
              emp.email.toLowerCase().trim() === rawOwner.toLowerCase().trim()
            );
            if (matchedEmployee) {
              ownerEmail = matchedEmployee.email;
            } else if (rawOwner.includes('@')) {
              ownerEmail = rawOwner.toLowerCase().trim();
            }
          }

          return {
            title: rawTitle || 'Unnamed User Story',
            description: rawDescription || '',
            priority,
            status,
            storyPoints: rawPoints && !isNaN(rawPoints) ? parseInt(rawPoints, 10) : 0,
            ownerEmail,
            sprint: rawSprint || ''
          };
        });

        // Call backend API
        await productService.importUserStoriesBulk(selectedProduct.id, mappedStories);
        
        // Refresh user stories
        await fetchData();
        alert(`Successfully imported ${mappedStories.length} user stories!`);
      } catch (err) {
        console.error('Import failed:', err);
        alert(err.message || 'Failed to parse or import Excel file.');
      } finally {
        setLoading(false);
        e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleClearUserStories = async () => {
    const message = "Are you sure you want to clear all user stories for this product? This action cannot be undone.";
    if (!window.confirm(message)) {
      return;
    }

    try {
      setLoading(true);
      await productService.clearUserStories(selectedProduct.id);
      await fetchData();
      alert("User stories cleared successfully!");
    } catch (error) {
      console.error("Failed to clear user stories:", error);
      alert("Failed to clear user stories: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 p-6 md:p-8 overflow-y-auto animate-in fade-in duration-200">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">User Stories</h1>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Manage and track Agile user stories for <span className="text-blue-600 font-bold">{selectedProduct.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Import Excel Button (Admins only) */}
          {canImportExcel && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="file"
                  id="user-story-file-import"
                  accept=".xlsx, .xls"
                  onChange={handleImportExcel}
                  className="hidden"
                />
                <label
                  htmlFor="user-story-file-import"
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#0F52BA] hover:bg-[#0A3D91] text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  Import Excel
                </label>
              </div>

              {/* Clear Button */}
              <button
                onClick={handleClearUserStories}
                className="p-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 hover:text-red-700 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md"
                title="Clear all user stories"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters bar */}
      <UserStoryFilters
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        ownerFilter={ownerFilter}
        setOwnerFilter={setOwnerFilter}
        employees={employees}
        onClear={handleClearFilters}
      />

      {/* Stories Table */}
      <UserStoryTable
        stories={currentItems}
        loading={loading}
        indexOffset={indexOfFirstItem}
      />

      {/* Pagination indicators */}
      {!loading && filteredStories.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-400">
            Showing <span className="text-slate-700 font-bold">{indexOfFirstItem + 1}</span> to{' '}
            <span className="text-slate-700 font-bold">
              {Math.min(indexOfLastItem, filteredStories.length)}
            </span>{' '}
            of <span className="text-slate-700 font-bold">{filteredStories.length}</span> user stories
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer"
            >
              &lt;
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentPage === i + 1
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
    </div>
  );
};

export default UserStoryList;

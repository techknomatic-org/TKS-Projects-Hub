import React, { useState, useEffect } from 'react';
import { Download, ChevronLeft, ChevronRight, Upload, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { productService } from '../services/productService.js';
import FeatureFilters from './FeatureFilters.jsx';
import FeatureTable from './FeatureTable.jsx';

export const FeatureList = ({ selectedProduct, userRole }) => {
  const [features, setFeatures] = useState([]);
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

  // Fetch features and employees
  const fetchData = async () => {
    if (!selectedProduct) return;
    setLoading(true);
    try {
      const [featuresData, employeesData] = await Promise.all([
        productService.getFeatures(selectedProduct.id),
        productService.getEmployees(selectedProduct.id)
      ]);
      setFeatures(featuresData);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Failed to load features panel data:', error);
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
  const filteredFeatures = features.filter((f) => {
    const matchesSearch =
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      (f.description && f.description.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = !statusFilter || f.status === statusFilter;
    const matchesPriority = !priorityFilter || f.priority === priorityFilter;
    const matchesOwner = !ownerFilter || f.ownerId === ownerFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesOwner;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredFeatures.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredFeatures.slice(indexOfFirstItem, indexOfLastItem);

  // Clear Filters
  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setOwnerFilter('');
  };

  // Export Logic
  const prepareExportData = () => {
    return filteredFeatures.map((f, i) => ({
      'ID': `F-${String(i + 1).padStart(2, '0')}`,
      'Feature Name': f.title,
      'Description': f.description || '',
      'Priority': f.priority,
      'Status': f.status,
      'Owner': f.owner ? f.owner.name : 'Unassigned',
      'Target Release': f.releaseVersion || 'N/A',
      'Created Date': f.createdAt ? new Date(f.createdAt).toLocaleDateString() : ''
    }));
  };

  const handleExportExcel = () => {
    const formatted = prepareExportData();
    const ws = XLSX.utils.json_to_sheet(formatted);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Features');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(data, `${selectedProduct.name}_features_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws);

        if (rawData.length === 0) {
          alert('The Excel file is empty.');
          return;
        }

        const mappedFeatures = rawData.map((row) => {
          const getVal = (possibleKeys) => {
            const key = Object.keys(row).find(k => 
              possibleKeys.some(pk => k.toLowerCase().trim() === pk.toLowerCase())
            );
            return key ? String(row[key]).trim() : undefined;
          };

          const rawTitle = getVal(['feature title', 'title', 'feature name', 'featurename', 'name']);
          const rawDescription = getVal(['description', 'desc']);
          const rawPriority = getVal(['priority']);
          const rawStatus = getVal(['status']);
          const rawOwner = getVal(['assigned to', 'assigned', 'owner', 'owner name', 'email']);
          const rawRelease = getVal(['target release', 'release', 'releaseversion', 'release version']);

          let priority = 'LOW';
          if (rawPriority) {
            const lowerPriority = rawPriority.toLowerCase();
            if (lowerPriority.includes('medium')) priority = 'MEDIUM';
            else if (lowerPriority.includes('high')) priority = 'HIGH';
            else if (lowerPriority.includes('critical')) priority = 'CRITICAL';
          }

          let status = 'PLANNED';
          if (rawStatus) {
            const lowerStatus = rawStatus.toLowerCase();
            if (lowerStatus.includes('progress') || lowerStatus.includes('started')) {
              status = 'IN_PROGRESS';
            } else if (lowerStatus.includes('completed') || lowerStatus.includes('done')) {
              status = 'COMPLETED';
            } else if (lowerStatus.includes('hold') || lowerStatus.includes('paused')) {
              status = 'ON_HOLD';
            }
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
            title: rawTitle || 'Unnamed Feature',
            description: rawDescription || '',
            priority,
            status,
            ownerEmail,
            releaseVersion: rawRelease || ''
          };
        });

        // Basic validation
        const invalidRows = mappedFeatures.filter(f => !f.title);
        if (invalidRows.length > 0) {
          alert('Import failed: Every feature must have a Feature Title.');
          return;
        }

        // Call backend API to save the features to the database
        await productService.importFeaturesBulk(selectedProduct.id, mappedFeatures);
        
        // Refresh features list from backend
        await fetchData();
        alert('Features imported and stored successfully!');
      } catch (err) {
        console.error('Error importing excel:', err);
        alert('Failed to import features: ' + err.message);
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleClearFeatures = async () => {
    if (!window.confirm("Are you sure you want to clear all features for this product? This action cannot be undone.")) {
      return;
    }
    
    try {
      setLoading(true);
      await productService.clearFeatures(selectedProduct.id);
      await fetchData();
      alert("All features cleared successfully!");
    } catch (error) {
      console.error("Failed to clear features:", error);
      alert("Failed to clear features: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 p-6 md:p-8 overflow-y-auto">
      {/* Upper header action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Feature List</h1>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Manage and export features for <span className="text-blue-600 font-bold">{selectedProduct.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Single Export Button */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-600 font-bold text-sm shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-400" />
            Export List
          </button>

          {/* Import Excel Button (Admins only) */}
          {canImportExcel && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  className="hidden"
                  id="excel-import-input"
                  onChange={handleImportExcel}
                />
                <label
                  htmlFor="excel-import-input"
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  Import Excel
                </label>
              </div>

              {/* Clear Features Delete Button */}
              <button
                onClick={handleClearFeatures}
                className="p-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 hover:text-red-700 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md"
                title="Clear all features"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Row */}
      <FeatureFilters
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

      {/* Feature Table Display */}
      <FeatureTable
        features={currentItems}
        loading={loading}
        indexOffset={indexOfFirstItem}
      />

      {/* Pagination Controls */}
      {!loading && filteredFeatures.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-400">
            Showing <span className="text-slate-700 font-bold">{indexOfFirstItem + 1}</span> to{' '}
            <span className="text-slate-700 font-bold">
              {Math.min(indexOfLastItem, filteredFeatures.length)}
            </span>{' '}
            of <span className="text-slate-700 font-bold">{filteredFeatures.length}</span> features
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
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
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureList;

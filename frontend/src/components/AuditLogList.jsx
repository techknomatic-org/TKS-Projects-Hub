import React, { useState, useEffect, useRef } from 'react';
import { Download, ChevronLeft, ChevronRight, SlidersHorizontal, RefreshCw, ClipboardList, Search, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { productService } from '../services/productService.js';
import AuditLogFilters from './AuditLogFilters.jsx';
import AuditLogTable from './AuditLogTable.jsx';
import AuditLogDetailsModal from './AuditLogDetailsModal.jsx';

export const AuditLogList = () => {
  const [logs, setLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal State
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Export dropdown state
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (userFilter) params.userId = userFilter;
      if (entityFilter) params.entityType = entityFilter;
      if (actionFilter) params.action = actionFilter;
      if (search.trim()) params.search = search.trim();
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const [logsData, employeesData] = await Promise.all([
        productService.getAuditLogs(params),
        productService.getEmployees()
      ]);
      setLogs(logsData);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [userFilter, entityFilter, actionFilter, startDate, endDate]);

  // Click outside to close export menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset page to 1 when filters or search submit changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, userFilter, entityFilter, actionFilter, startDate, endDate]);

  const handleClearFilters = () => {
    setSearch('');
    setUserFilter('');
    setEntityFilter('');
    setActionFilter('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      fetchLogs();
    }
  };

  // Pagination Logic
  const totalPages = Math.ceil(logs.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = logs.slice(indexOfFirstItem, indexOfLastItem);

  // Details Modal handler
  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setDetailsModalOpen(true);
  };

  const getEntityTypeLabel = (type) => {
    switch (type) {
      case 'STATUS':
        return 'Kanban Task';
      case 'FEATURE':
        return 'Feature';
      case 'USER_STORY':
        return 'User Story';
      default:
        return type;
    }
  };

  const getSummaryText = (log) => {
    const userName = log.user ? log.user.name : 'Unknown User';
    const actionText = log.action === 'CREATE' ? 'created' : log.action === 'UPDATE' ? 'updated' : 'deleted';
    const entityLabel = getEntityTypeLabel(log.entityType);
    
    let objectTitle = '';
    const details = log.newValue || log.oldValue;
    if (details && details.title) {
      objectTitle = ` "${details.title}"`;
    }

    return `${userName} ${actionText} ${entityLabel}${objectTitle} (${log.entityId.substring(0, 8)}).`;
  };

  // Export Formatting Logic
  const prepareExportData = () => {
    return logs.map((log) => ({
      'Timestamp': log.createdAt ? new Date(log.createdAt).toLocaleString() : '',
      'Performed By': log.user ? log.user.name : 'System',
      'User Email': log.user ? log.user.email : '',
      'Entity Type': getEntityTypeLabel(log.entityType),
      'Entity ID': log.entityId,
      'Action': log.action,
      'Summary': getSummaryText(log)
    }));
  };

  const handleExportCSV = () => {
    const formatted = prepareExportData();
    const ws = XLSX.utils.json_to_sheet(formatted);
    const csvOutput = XLSX.utils.sheet_to_csv(ws);
    const data = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    saveAs(data, `TKS_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    setShowExportMenu(false);
  };

  const handleExportExcel = () => {
    const formatted = prepareExportData();
    const ws = XLSX.utils.json_to_sheet(formatted);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Audit Logs');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(data, `TKS_Audit_Logs_${new Date().toISOString().slice(0, 10)}.xlsx`);
    setShowExportMenu(false);
  };

  return (
    <div className="flex-1 flex flex-col gap-6 p-6 md:p-8 overflow-y-auto">
      {/* Title Action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Audit Logs</h1>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Track and audit all changes made to task statuses, features, and user stories.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Refresh Action */}
          <button
            onClick={fetchLogs}
            title="Refresh logs"
            className="p-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-500 hover:text-slate-700 shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Export Dropdown Menu */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-600 font-bold text-sm shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-400" />
              Export Logs
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                <button
                  onClick={handleExportCSV}
                  className="w-full text-left px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Export to CSV
                </button>
                <button
                  onClick={handleExportExcel}
                  className="w-full text-left px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Export to Excel (.xlsx)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar Input */}
      <div className="relative max-w-md">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search logs by user, entity ID, or summary... (Press Enter)"
          className="w-full pl-10 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
        {search && (
          <button
            onClick={() => {
              setSearch('');
              setTimeout(fetchLogs, 0);
            }}
            className="absolute inset-y-0 right-10 pr-3 flex items-center text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={fetchLogs}
          className="absolute inset-y-0 right-0 px-3 bg-slate-50 hover:bg-slate-100 border-l border-slate-200 rounded-r-xl text-xs font-bold text-slate-600 transition-all"
        >
          Go
        </button>
      </div>

      {/* Audit Filters */}
      <AuditLogFilters
        userFilter={userFilter}
        setUserFilter={setUserFilter}
        entityFilter={entityFilter}
        setEntityFilter={setEntityFilter}
        actionFilter={actionFilter}
        setActionFilter={setActionFilter}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        employees={employees}
        onClear={handleClearFilters}
      />

      {/* Audit Log Table */}
      <AuditLogTable
        logs={currentItems}
        loading={loading}
        onViewDetails={handleViewDetails}
      />

      {/* Pagination Controls */}
      {!loading && logs.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-400">
            Showing <span className="text-slate-700 font-bold">{indexOfFirstItem + 1}</span> to{' '}
            <span className="text-slate-700 font-bold">
              {Math.min(indexOfLastItem, logs.length)}
            </span>{' '}
            of <span className="text-slate-700 font-bold">{logs.length}</span> log records
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

      {/* Details comparison Modal */}
      <AuditLogDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedLog(null);
        }}
        log={selectedLog}
      />
    </div>
  );
};

export default AuditLogList;

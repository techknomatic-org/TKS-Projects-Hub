import React, { useState, useEffect, useRef } from 'react';
import { Download, Calendar, RefreshCw, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { productService } from '../services/productService.js';
import StatusDistributionChart from './StatusDistributionChart.jsx';
import FeatureOverviewChart from './FeatureOverviewChart.jsx';
import StoryOverviewChart from './StoryOverviewChart.jsx';
import SprintVelocityChart from './SprintVelocityChart.jsx';
import EmployeeWorkloadChart from './EmployeeWorkloadChart.jsx';
import ReleaseReadinessCard from './ReleaseReadinessCard.jsx';

export const ReportsDashboard = ({ selectedProduct }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  // Datasets State
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [featureOverview, setFeatureOverview] = useState([]);
  const [storyOverview, setStoryOverview] = useState([]);
  const [sprintVelocity, setSprintVelocity] = useState([]);
  const [workload, setWorkload] = useState([]);
  const [releaseReadiness, setReleaseReadiness] = useState([]);

  // Export dropdown
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);

  const fetchData = async () => {
    if (!selectedProduct) return;
    setLoading(true);
    try {
      const productId = selectedProduct.id;
      const [statusData, featureData, storyData, sprintData, workloadData, readinessData] = await Promise.all([
        productService.getReportStatusDistribution(productId, startDate, endDate),
        productService.getReportFeatureOverview(productId, startDate, endDate),
        productService.getReportStoryOverview(productId, startDate, endDate),
        productService.getReportSprintVelocity(productId, startDate, endDate),
        productService.getReportWorkload(productId, startDate, endDate),
        productService.getReportReleaseReadiness(productId, startDate, endDate)
      ]);

      setStatusDistribution(statusData);
      setFeatureOverview(featureData);
      setStoryOverview(storyData);
      setSprintVelocity(sprintData);
      setWorkload(workloadData);
      setReleaseReadiness(readinessData);
    } catch (error) {
      console.error('Failed to load reporting dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedProduct, startDate, endDate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  const handleExportCSV = () => {
    // Compile summary of all metrics into a single CSV
    const rows = [];
    rows.push(['TKS Reports Summary', selectedProduct.name]);
    rows.push(['Date Range', `${startDate || 'Start'} to ${endDate || 'End'}`]);
    rows.push([]);

    rows.push(['TASK STATUS DISTRIBUTION']);
    statusDistribution.forEach((item) => rows.push([item.name, item.value]));
    rows.push([]);

    rows.push(['FEATURE OVERVIEW']);
    featureOverview.forEach((item) => rows.push([item.name, item.value]));
    rows.push([]);

    rows.push(['USER STORY OVERVIEW']);
    storyOverview.forEach((item) => rows.push([item.name, item.value]));
    rows.push([]);

    rows.push(['SPRINT VELOCITY']);
    sprintVelocity.forEach((item) => rows.push([item.sprint, item.points]));
    rows.push([]);

    rows.push(['DEVELOPER WORKLOAD']);
    rows.push(['Name', 'Tasks', 'Features', 'Stories']);
    workload.forEach((item) => rows.push([item.name, item.tasks, item.features, item.stories]));
    rows.push([]);

    rows.push(['RELEASE READINESS']);
    rows.push(['Product', 'Readiness (%)', 'Completed Features', 'Total Features']);
    releaseReadiness.forEach((item) => rows.push([item.productName, `${item.percentage}%`, item.completedFeatures, item.totalFeatures]));

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const csvOutput = XLSX.utils.sheet_to_csv(ws);
    const dataBlob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    saveAs(dataBlob, `${selectedProduct.name}_reports_summary_${new Date().toISOString().slice(0, 10)}.csv`);
    setShowExportMenu(false);
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Status Distribution
    const ws1 = XLSX.utils.json_to_sheet(statusDistribution);
    XLSX.utils.book_append_sheet(wb, ws1, 'Status Distribution');

    // Sheet 2: Features Completion
    const ws2 = XLSX.utils.json_to_sheet(featureOverview);
    XLSX.utils.book_append_sheet(wb, ws2, 'Features Completion');

    // Sheet 3: User Stories Overview
    const ws3 = XLSX.utils.json_to_sheet(storyOverview);
    XLSX.utils.book_append_sheet(wb, ws3, 'User Stories Status');

    // Sheet 4: Sprint Velocity
    const ws4 = XLSX.utils.json_to_sheet(sprintVelocity);
    XLSX.utils.book_append_sheet(wb, ws4, 'Sprint Velocity');

    // Sheet 5: Developer Workload
    const ws5 = XLSX.utils.json_to_sheet(workload);
    XLSX.utils.book_append_sheet(wb, ws5, 'Developer Workload');

    // Sheet 6: Release Readiness
    const ws6 = XLSX.utils.json_to_sheet(releaseReadiness);
    XLSX.utils.book_append_sheet(wb, ws6, 'Release Readiness');

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(dataBlob, `${selectedProduct.name}_reports_bundle_${new Date().toISOString().slice(0, 10)}.xlsx`);
    setShowExportMenu(false);
  };

  return (
    <div className="flex-1 flex flex-col gap-6 p-6 md:p-8 overflow-y-auto">
      {/* Action and title row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Reports & Analytics</h1>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Track product progress and team performance metrics for <span className="text-blue-600 font-bold">{selectedProduct.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Refresh Action */}
          <button
            onClick={fetchData}
            title="Refresh reports data"
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
              Export Charts
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                <button
                  onClick={handleExportCSV}
                  className="w-full text-left px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Export Summary (CSV)
                </button>
                <button
                  onClick={handleExportExcel}
                  className="w-full text-left px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Export All Sheets (.xlsx)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Date Filters Row */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date Filters</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold">From</span>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold">To</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            />
          </div>

          {(startDate || endDate) && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <X className="w-3 h-3" />
              Reset Dates
            </button>
          )}
        </div>
      </div>

      {loading ? (
        // Skeleton grids during fetch
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between h-80">
              <div className="h-4 w-40 bg-slate-100 rounded animate-pulse" />
              <div className="w-36 h-36 rounded-full bg-slate-100 animate-pulse mx-auto" />
              <div className="h-4 w-24 bg-slate-50 rounded animate-pulse mx-auto" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Release Readiness Row */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Release Readiness</h2>
            <ReleaseReadinessCard data={releaseReadiness} />
          </div>

          {/* Main Analytics charts grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Status Distribution */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <StatusDistributionChart data={statusDistribution} />
            </div>

            {/* Feature Overview */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <FeatureOverviewChart data={featureOverview} />
            </div>

            {/* User Story Overview */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <StoryOverviewChart data={storyOverview} />
            </div>

            {/* Sprint Velocity */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm lg:col-span-2">
              <SprintVelocityChart data={sprintVelocity} />
            </div>

            {/* Workload */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm lg:col-span-1">
              <EmployeeWorkloadChart data={workload} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsDashboard;

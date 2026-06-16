import React, { useState, useEffect } from 'react';
import { CheckCheck, RefreshCw, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { productService } from '../services/productService.js';
import NotificationFilters from './NotificationFilters.jsx';
import NotificationCard from './NotificationCard.jsx';

export const NotificationsList = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [readFilter, setReadFilter] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const fetchNotifications = async (page = currentPage) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search: search.trim(),
        type: typeFilter,
        isRead: readFilter
      };

      const data = await productService.getNotifications(params);
      setNotifications(data.notifications);
      setTotalPages(data.totalPages);
      setUnreadCount(data.unreadCount);
      setCurrentPage(data.page);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(1);
  }, [typeFilter, readFilter]);

  const handleSearchSubmit = () => {
    fetchNotifications(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setTypeFilter('');
    setReadFilter('');
    setCurrentPage(1);
    // Explicit trigger after state clear
    setTimeout(() => fetchNotifications(1), 0);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await productService.markNotificationAsRead(id);
      // Optimistic state update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(prev - 1, 0));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await productService.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 p-6 md:p-8 overflow-y-auto">
      {/* Title & Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Notifications</h1>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Stay updated with assignments and project activities.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Refresh Action */}
          <button
            onClick={() => fetchNotifications(currentPage)}
            title="Refresh notifications"
            className="p-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-500 hover:text-slate-700 shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Mark All Read */}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-600 font-bold text-sm shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <CheckCheck className="w-4 h-4 text-emerald-500" />
              Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <NotificationFilters
        search={search}
        setSearch={setSearch}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        readFilter={readFilter}
        setReadFilter={setReadFilter}
        onClear={handleClearFilters}
        onSubmit={handleSearchSubmit}
      />

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 border border-slate-100 rounded-2xl flex items-center justify-between gap-4 bg-white animate-pulse">
              <div className="flex gap-3 w-full">
                <div className="w-10 h-10 bg-slate-100 rounded-xl shrink-0" />
                <div className="space-y-2 w-full">
                  <div className="h-3 w-40 bg-slate-100 rounded" />
                  <div className="h-3 w-4/5 bg-slate-50 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4">
            <Inbox className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-bold text-slate-700 mb-1">No notifications found</h3>
          <p className="text-slate-400 text-xs">
            {search || typeFilter || readFilter 
              ? 'Try modifying your search or filter criteria.' 
              : 'You are all caught up! No notifications yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-400">
            Page <span className="text-slate-700 font-bold">{currentPage}</span> of{' '}
            <span className="text-slate-700 font-bold">{totalPages}</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchNotifications(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => fetchNotifications(i + 1)}
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
              onClick={() => fetchNotifications(currentPage + 1)}
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

export default NotificationsList;

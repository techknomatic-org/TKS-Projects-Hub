import React, { useState, useRef, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService.js';
import { socketService } from '../services/socketService.js';
import Toast from './Toast.jsx';
import { ChevronDown, LogOut, User, Shield, FolderKanban, Menu } from 'lucide-react';

const Header = ({ setActiveTab, sidebarOpen, setSidebarOpen }) => {
  const { instance } = useMsal();
  const navigate = useNavigate();
  const user = authService.getUser();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    // Connect to Socket.IO
    socketService.connect();

    // Listen to new socket notifications to show real-time Toast alerts
    const unsubscribe = socketService.addListener((newNotif) => {
      setToast({
        id: Date.now(),
        title: newNotif.title,
        message: newNotif.message,
        type: newNotif.type.toLowerCase()
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    authService.logout();
    socketService.disconnect();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const isEmployee = user?.role === 'EMPLOYEE';
  const isBoth = user?.role === 'BOTH';

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4 md:px-8 md:py-5 flex items-center justify-between shadow-sm relative z-30 transition-all duration-300">

      {/* Decorative gradient line at bottom for modern feel */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-600/35 via-indigo-600/60 to-purple-600/35 opacity-90 select-none pointer-events-none" />

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

      {/* Workspace Identity (Title, Subtitle, & Workspace Icon) */}
      <div className="flex-1 min-w-0 flex items-start gap-4 animate-in fade-in slide-in-from-left-3 duration-250">
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-all cursor-pointer shadow-xs shrink-0 self-center mr-1"
            title="Open Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        {/* Workspace Icon */}
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0F52BA] to-[#2563EB] flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/10 hover:scale-105 transition-transform duration-200 cursor-pointer">
          <FolderKanban className="w-5.5 h-5.5" />
        </div>

        {/* Workspace Titles */}
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight select-none">
            TKS Projects Hub
          </h1>
          <p className="text-[11px] md:text-xs text-slate-500 font-medium mt-1 select-none leading-relaxed max-w-2xl">
            Centralized workspace to track, manage, and collaborate across all TKS initiatives.
          </p>
        </div>
      </div>

      {/* Right Block - User Dropdown */}
      <div className="flex items-center gap-5 shrink-0 ml-4 animate-in fade-in slide-in-from-right-3 duration-250">

        {/* User Info Block */}
        <div className="relative" ref={dropdownRef}>
          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 px-3.5 py-1.5 rounded-2xl border border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-all select-none shadow-xs"
          >
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.name}
                className="w-9 h-9 rounded-full object-cover border border-slate-100"
              />
            ) : (
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm ${
                isBoth ? 'bg-gradient-to-tr from-indigo-600 to-blue-600' : isEmployee ? 'bg-blue-600' : 'bg-indigo-600'
              }`}>
                {getInitials(user?.name)}
              </div>
            )}

            <div className="text-left hidden sm:block">
              <div className="text-sm font-bold text-slate-800 leading-tight">
                {user?.name || 'User'}
              </div>
              <div className="text-[11px] text-slate-400 font-semibold capitalize leading-none mt-0.5">
                {isBoth ? 'Admin & Developer' : isEmployee ? 'Developer' : 'Admin'}
              </div>
            </div>

            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </div>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-premium border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-3 border-b border-slate-50">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Signed in as</div>
                <div className="text-sm font-bold text-slate-800 mt-1 break-all">{user?.name}</div>
                <div className="text-xs text-slate-500 break-all mt-0.5">{user?.email}</div>
              </div>

              <div className="px-4 py-2.5 border-b border-slate-50 flex items-center justify-between text-xs text-slate-600">
                <span className="font-semibold uppercase tracking-wider text-slate-400">Role Badge</span>
                <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                  isBoth
                    ? 'bg-purple-50 text-purple-600 border border-purple-100'
                    : isEmployee
                      ? 'bg-blue-50 text-blue-600 border border-blue-100'
                      : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                }`}>
                  {isEmployee ? <User className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                  {isBoth ? 'Admin & Dev' : user?.role}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:text-red-600 hover:bg-red-50 font-medium transition-all duration-150 cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-600" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

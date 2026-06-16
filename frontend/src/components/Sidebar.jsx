import React from 'react';
import { useMsal } from '@azure/msal-react';
import { authService } from '../services/authService.js';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Layers,
  FileText,
  BarChart3,
  ClipboardList,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Users
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen }) => {
  const { instance } = useMsal();
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();

    // Check if MSAL is initialized and can log out
    if (instance) {
      instance.logoutRedirect({ postLogoutRedirectUri: window.location.origin + '/login' })
        .catch(err => {
          console.error('Logout redirect failed:', err);
          navigate('/login');
        });
    } else {
      navigate('/login');
    }
  };

  const menuItems = [
    { id: 'STATUS', label: 'Status', icon: Grid },
    { id: 'FEATURE_LIST', label: 'Feature List', icon: Layers },
    { id: 'USER_STORY', label: 'User Story', icon: FileText },
    { id: 'REQUIREMENTS_MAPPING', label: 'Requirements Mapping', icon: ClipboardList },
    { id: 'MEMBERS', label: 'Members', icon: Users }
  ];

  return (
    <aside className={`bg-[#050C1E] text-white flex flex-col justify-between h-screen shrink-0 border-r border-[#111C35] transition-all duration-300 ease-in-out overflow-hidden ${
      isOpen ? 'w-[240px]' : 'w-0 border-r-0'
    }`}>
      <div className="w-[240px] flex flex-col justify-between h-full py-4 select-none">
        
        {/* Top & Menu Items */}
        <div className="px-5 flex flex-col gap-4">
          {/* Logo & Close Button Card */}
          <div className="bg-white rounded-[20px] p-2 flex items-center justify-between shadow-md border border-slate-100">
            <div className="flex-1 flex items-center justify-center py-0.5">
              <img 
                src="/tks.png" 
                alt="TKS Logo" 
                className="h-8 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <div className="h-6 w-[1px] bg-slate-200 mx-1.5" />
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all cursor-pointer shrink-0"
              title="Close Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-[14px] transition-all duration-200 group cursor-pointer ${
                    isActive 
                      ? 'bg-[#1B65F3] text-white shadow-lg shadow-blue-500/10' 
                      : 'text-[#94A3B8] hover:text-white hover:bg-[#111C35]/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#111C35] text-[#94A3B8] group-hover:text-white'
                    }`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className={`text-left font-semibold leading-snug text-xs ${
                      isActive ? 'text-white' : 'text-[#94A3B8] group-hover:text-white'
                    }`}>{item.label}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                    isActive ? 'text-white' : 'text-[#64748B] group-hover:text-slate-400'
                  }`} />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section - Logout */}
        <div className="px-5">
          <div className="border-t border-[#111C35] mb-4" />
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-2 rounded-[14px] text-[#94A3B8] hover:text-white hover:bg-[#111C35]/40 transition-all duration-200 group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-[#111C35] text-[#94A3B8] group-hover:text-white flex items-center justify-center shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <span className="text-left font-semibold leading-tight text-xs text-[#94A3B8] group-hover:text-white">Logout</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-slate-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

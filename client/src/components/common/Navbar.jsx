import React from 'react';
import { Sparkles, ShieldCheck, User as UserIcon, LogOut, Briefcase, Search, Cpu, Home, Users, Bell, Grid } from 'lucide-react';

export const Navbar = ({ user, activeTab, setActiveTab, onOpenAuth, onLogout, onHeaderSearch }) => {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm transition-all duration-200">
      <div className="max-w-[1128px] mx-auto px-4 h-[60px] flex items-center justify-between">
        
        {/* Left Side: Brand & Search Input simulation */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div 
            onClick={() => setActiveTab('LANDING')} 
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            {/* LinkedIn Blue Style Logo */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm group-hover:bg-blue-700 transition-colors">
              <span className="text-lg tracking-tighter">SB</span>
            </div>
            <div className="hidden lg:block">
              <span className="text-lg font-bold tracking-tight text-gray-900">
                Signal Board
              </span>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="tracking-wide uppercase">AI Job Board</span>
              </div>
            </div>
          </div>

          {/* LinkedIn Style Header Search Input */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const val = e.target.elements.headerSearch?.value;
              if (val !== undefined && onHeaderSearch) {
                onHeaderSearch(val);
              }
            }}
            className="hidden sm:flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-900 px-3 py-1.5 rounded-lg sm:w-64 border border-transparent focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all text-xs"
          >
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              name="headerSearch"
              type="text"
              placeholder="Search jobs, skills, AI roles..."
              className="bg-transparent border-none outline-none text-xs text-gray-900 placeholder-gray-400 w-full"
            />
          </form>
        </div>

        {/* Center Navigation Tabs (LinkedIn Social Nav Style) */}
        <nav className="flex items-center h-full gap-1 sm:gap-3 md:gap-6 text-center">
          <button
            onClick={() => setActiveTab('LANDING')}
            className={`flex flex-col items-center justify-center px-2 h-full border-b-2 transition-all cursor-pointer ${
              activeTab === 'LANDING'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <Home className="w-5 h-5 sm:w-5 sm:h-5 mb-0.5" />
            <span className="hidden sm:inline text-[11px] font-semibold tracking-wide">Home</span>
          </button>
          
          <button
            onClick={() => setActiveTab('SEARCH')}
            className={`flex flex-col items-center justify-center px-2 h-full border-b-2 transition-all cursor-pointer ${
              activeTab === 'SEARCH'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <Briefcase className="w-5 h-5 sm:w-5 sm:h-5 mb-0.5" />
            <span className="hidden sm:inline text-[11px] font-semibold tracking-wide">Jobs & AI Feed</span>
          </button>

          {(!user || user.role === 'EMPLOYER') && (
            <button
              onClick={() => setActiveTab('GENERATE')}
              className={`flex flex-col items-center justify-center px-2 h-full border-b-2 transition-all cursor-pointer ${
                activeTab === 'GENERATE'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <Sparkles className="w-5 h-5 sm:w-5 sm:h-5 mb-0.5" />
              <span className="hidden sm:inline text-[11px] font-semibold tracking-wide">Employer Studio</span>
            </button>
          )}
        </nav>

        {/* Right Side: Identity & Profile Portal */}
        <div className="flex items-center gap-2 pl-2 sm:pl-4 border-l border-gray-200">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 cursor-default">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white">
                  {(user.firstName?.[0] || user.companyName?.[0] || user.email[0]).toUpperCase()}
                </div>
                <div className="hidden xl:flex flex-col items-start leading-tight">
                  <span className="text-xs font-bold text-gray-900 max-w-[120px] truncate">
                    {user.companyName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email.split('@')[0]}
                  </span>
                  <span className="text-[10px] text-blue-600 font-semibold tracking-wide uppercase">
                    {user.role}
                  </span>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Sign out"
                className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('CANDIDATE')}
                className="btn-secondary text-xs !py-1.5 !px-3"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
              <button
                onClick={() => onOpenAuth('EMPLOYER')}
                className="btn-primary text-xs !py-1.5 !px-3.5"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Post a Job</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

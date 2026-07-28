import React from 'react';
import { Sparkles, ShieldCheck, User as UserIcon, LogOut, Briefcase, Search, Cpu, Home, Users, Bell, Grid } from 'lucide-react';

export const Navbar = ({ user, activeTab, setActiveTab, onOpenAuth, onLogout, onHeaderSearch }) => {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-[#DBDBDB] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="max-w-[1128px] mx-auto px-4 h-[56px] flex items-center justify-between">
        
        {/* Left Side: Brand & Search Input simulation */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div 
            onClick={() => setActiveTab('LANDING')} 
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            {/* LinkedIn Blue Style Logo */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded bg-[#0A66C2] flex items-center justify-center font-bold text-white shadow-sm group-hover:bg-[#004182] transition-colors">
              <span className="text-lg tracking-tighter">SB</span>
            </div>
            <div className="hidden lg:block">
              <span className="text-lg font-bold tracking-tight text-[#191919]">
                Signal Board
              </span>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-[#057642]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#057642] animate-pulse" />
                <span>AI Job Board</span>
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
            className="hidden sm:flex items-center gap-2 bg-[#EDF3F8] hover:bg-[#E1F0FE] text-[#191919] px-3 py-1.5 rounded sm:w-64 border border-transparent focus-within:border-[#0A66C2] focus-within:bg-white transition-colors text-xs"
          >
            <Search className="w-4 h-4 text-[#0A66C2] shrink-0" />
            <input
              name="headerSearch"
              type="text"
              placeholder="Search jobs, skills, AI roles..."
              className="bg-transparent border-none outline-none text-xs text-[#191919] placeholder-[#666666] w-full"
            />
          </form>
        </div>

        {/* Center Navigation Tabs (LinkedIn Social Nav Style) */}
        <nav className="flex items-center h-full gap-1 sm:gap-3 md:gap-6 text-center">
          <button
            onClick={() => setActiveTab('LANDING')}
            className={`flex flex-col items-center justify-center px-2 h-full border-b-2 transition-all cursor-pointer ${
              activeTab === 'LANDING'
                ? 'border-[#0A66C2] text-[#0A66C2]'
                : 'border-transparent text-[#666666] hover:text-[#191919]'
            }`}
          >
            <Home className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="hidden sm:inline text-[11px] font-medium mt-0.5">Home</span>
          </button>
          
          <button
            onClick={() => setActiveTab('SEARCH')}
            className={`flex flex-col items-center justify-center px-2 h-full border-b-2 transition-all cursor-pointer ${
              activeTab === 'SEARCH'
                ? 'border-[#0A66C2] text-[#0A66C2]'
                : 'border-transparent text-[#666666] hover:text-[#191919]'
            }`}
          >
            <Briefcase className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="hidden sm:inline text-[11px] font-medium mt-0.5">Jobs & AI Feed</span>
          </button>

          {(!user || user.role === 'EMPLOYER') && (
            <button
              onClick={() => setActiveTab('GENERATE')}
              className={`flex flex-col items-center justify-center px-2 h-full border-b-2 transition-all cursor-pointer ${
                activeTab === 'GENERATE'
                  ? 'border-[#0A66C2] text-[#0A66C2]'
                  : 'border-transparent text-[#666666] hover:text-[#191919]'
              }`}
            >
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="hidden sm:inline text-[11px] font-medium mt-0.5">Employer Studio</span>
            </button>
          )}
        </nav>

        {/* Right Side: Identity & Profile Portal */}
        <div className="flex items-center gap-2 pl-2 sm:pl-4 border-l border-[#DBDBDB]">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 cursor-default">
                <div className="w-8 h-8 rounded-full bg-[#0A66C2] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  {(user.firstName?.[0] || user.companyName?.[0] || user.email[0]).toUpperCase()}
                </div>
                <div className="hidden xl:flex flex-col items-start leading-tight">
                  <span className="text-xs font-bold text-[#191919] max-w-[120px] truncate">
                    {user.companyName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email.split('@')[0]}
                  </span>
                  <span className="text-[10px] text-[#0A66C2] font-semibold">
                    {user.role} Profile
                  </span>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Sign out of decentralized session"
                className="text-[#666666] hover:text-[#191919] p-1.5 rounded hover:bg-[#F3F2EF] transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-[#D11124]" />
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

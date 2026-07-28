import React, { useState, useEffect } from 'react';
import { Navbar } from './components/common/Navbar.jsx';
import { AuthModal } from './components/auth/AuthModal.jsx';
import { AiJobGenerator } from './components/employer/AiJobGenerator.jsx';
import { SmartJobSearch } from './components/candidate/SmartJobSearch.jsx';
import { JobDetailModal } from './components/candidate/JobDetailModal.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import { apiService } from './services/api.js';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('LANDING');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [defaultAuthRole, setDefaultAuthRole] = useState('CANDIDATE');
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    const activeUser = apiService.getCurrentUser();
    if (activeUser) {
      setUser(activeUser);
    }
  }, []);

  const handleOpenAuth = (role = 'CANDIDATE') => {
    setDefaultAuthRole(role);
    setSelectedJob(null);
    setAuthModalOpen(true);
  };

  const handleLogout = () => {
    apiService.logout();
    setUser(null);
  };

  const handleAuthSuccess = () => {
    const loggedIn = apiService.getCurrentUser();
    setUser(loggedIn);
  };

  const [headerQuery, setHeaderQuery] = useState('');

  const handleHeaderSearch = (queryStr) => {
    setHeaderQuery(queryStr);
    setActiveTab('SEARCH');
  };

  return (
    <div className="min-h-screen bg-[#F3F2EF] text-[#191919] flex flex-col">
      
      {/* Top Header & Role Switcher */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onHeaderSearch={handleHeaderSearch}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'LANDING' && (
          <LandingPage
            user={user}
            onExploreSearch={() => setActiveTab('SEARCH')}
            onExploreAiStudio={() => setActiveTab('GENERATE')}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {activeTab === 'SEARCH' && (
          <SmartJobSearch
            user={user}
            headerQuery={headerQuery}
            onSelectJob={(job) => setSelectedJob(job)}
            onOpenAuth={() => handleOpenAuth('CANDIDATE')}
          />
        )}

        {activeTab === 'GENERATE' && (
          <AiJobGenerator
            user={user}
            onOpenAuth={() => handleOpenAuth('EMPLOYER')}
            onJobPublished={() => setActiveTab('SEARCH')}
          />
        )}
      </main>

      {/* Interactive Authentication & Job Inspection Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultRole={defaultAuthRole}
        onAuthSuccess={handleAuthSuccess}
      />

      <JobDetailModal
        job={selectedJob}
        user={user}
        onClose={() => setSelectedJob(null)}
        onOpenAuth={() => handleOpenAuth('CANDIDATE')}
      />



    </div>
  );
}

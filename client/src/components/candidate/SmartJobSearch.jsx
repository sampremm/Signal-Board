import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Sparkles, MapPin, Briefcase, DollarSign, Building2, RefreshCw } from 'lucide-react';
import { apiService } from '../../services/api.js';

export function SmartJobSearch({ user, headerQuery, onSelectJob, onOpenAuth }) {
  const [query, setQuery] = useState('');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [extractedParams, setExtractedParams] = useState(null);
  const [fromDatabase, setFromDatabase] = useState(false);
  const [searchEngine, setSearchEngine] = useState('');

  const exampleQueries = useMemo(() => [
    "Full stack PostgreSQL and Prisma remote",
    "React and Tailwind CSS developer in Austin",
    "Senior Node.js engineer with high salary",
    "Junior developer roles for beginners"
  ], []);

  const isEmployer = user?.role === 'EMPLOYER';
  
  const displayedJobs = useMemo(() => {
    return isEmployer
      ? jobs.filter(j => j.employerId === user?.id || j.employerId === user?.profileId || (user?.companyName && j.companyName === user.companyName))
      : jobs;
  }, [jobs, isEmployer, user]);

  console.log('[SmartSearch Render] Rendering SmartJobSearch with displayedJobs count:', displayedJobs.length);

  const fetchInitialJobs = useCallback(async () => {
    setLoading(true);
    try {
      const allJobs = await apiService.getJobs();
      console.log('[SmartSearch Init] Loaded initial jobs count:', allJobs.length);
      setJobs(allJobs);
    } catch {
      // Offline fallback managed in service layer
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSmartSearch = useCallback(async (overrideQuery) => {
    // Ensure searchText is strictly a string (not an Event object from onClick/onSubmit)
    const searchText = typeof overrideQuery === 'string' ? overrideQuery : query;
    console.log('[SmartSearch UI] Smart Search executed for query string:', searchText);

    if (!searchText || typeof searchText !== 'string' || !searchText.trim()) {
      console.log('[SmartSearch UI] Empty query string provided — reloading default jobs feed.');
      setExtractedParams(null);
      await fetchInitialJobs();
      return;
    }

    setSearching(true);
    try {
      console.log('[SmartSearch UI] Invoking apiService.smartAiSearch with:', searchText);
      const res = await apiService.smartAiSearch(searchText);
      console.log('[SmartSearch State] Setting jobs state from API response count:', (res.jobs || []).length);
      setJobs(res.jobs || []);
      setExtractedParams(res.extractedParameters || null);
      setFromDatabase(res.fromDatabase || false);
      setSearchEngine(res.searchEngine || 'heuristic');
    } catch (err) {
      console.error('[SmartSearch Error] Smart search request failed:', err);
    } finally {
      setSearching(false);
    }
  }, [query, fetchInitialJobs]);

  useEffect(() => {
    if (headerQuery && typeof headerQuery === 'string' && headerQuery.trim()) {
      setQuery(headerQuery);
      handleSmartSearch(headerQuery);
    } else {
      fetchInitialJobs();
    }
  }, [headerQuery, fetchInitialJobs, handleSmartSearch]);

  const executeExample = useCallback((ex) => {
    setQuery(ex);
    handleSmartSearch(ex);
  }, [handleSmartSearch]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setExtractedParams(null);
    fetchInitialJobs();
  }, [fetchInitialJobs]);

  return (
    <div className="max-w-[1128px] mx-auto px-4 py-6">
      
      {/* 3-Column LinkedIn Grid Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Candidate Profile / Identity Card (col-span-3) */}
        <div className="md:col-span-3 space-y-4 md:sticky md:top-[72px]">
          <div className="linkedin-card overflow-hidden text-center pb-4">
            {/* LinkedIn Background Header Banner */}
            <div className="h-14 bg-gradient-to-r from-[#0A66C2] via-[#004182] to-[#057642]" />
            <div className="w-16 h-16 rounded-full bg-white border-2 border-white text-[#0A66C2] font-bold text-2xl mx-auto -mt-8 shadow flex items-center justify-center">
              {user ? (user.firstName?.[0] || user.companyName?.[0] || user.email[0]).toUpperCase() : 'C'}
            </div>

            <div className="px-4 mt-2">
              <h3 className="font-bold text-[#191919] text-base">
                {user ? (user.companyName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email.split('@')[0]) : 'Guest Candidate'}
              </h3>
              <p className="text-xs text-[#666666] mt-0.5">
                {user ? `${user.role} Profile` : 'Searching active tech roles'}
              </p>
            </div>

            <hr className="my-3 border-[#DBDBDB]" />

            <div className="px-4 text-left space-y-2 text-xs">
              <div className="flex justify-between text-[#666666]">
                <span>Active Session Role</span>
                <span className="font-bold text-[#0A66C2]">{user ? user.role : 'CANDIDATE'}</span>
              </div>
              <div className="flex justify-between text-[#666666]">
                <span>AI Job Board</span>
                <span className="font-semibold text-[#057642]">Neon Postgres</span>
              </div>
            </div>

            <hr className="my-3 border-[#DBDBDB]" />

            <div className="px-4 text-left">
              <p className="text-[11px] font-bold text-[#191919] uppercase mb-1">Matched Skills</p>
              <div className="flex flex-wrap gap-1 mt-1">
                <span className="bg-[#EDF3F8] text-[#0A66C2] text-[10px] font-semibold px-2 py-0.5 rounded">Node.js</span>
                <span className="bg-[#EDF3F8] text-[#0A66C2] text-[10px] font-semibold px-2 py-0.5 rounded">React</span>
                <span className="bg-[#EDF3F8] text-[#0A66C2] text-[10px] font-semibold px-2 py-0.5 rounded">PostgreSQL</span>
                <span className="bg-[#EDF3F8] text-[#0A66C2] text-[10px] font-semibold px-2 py-0.5 rounded">Prisma</span>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: AI Smart Search Box & Jobs Feed */}
        <div className="md:col-span-9 space-y-4">
          
          {/* Hide AI Search Card for Employers */}
          {!isEmployer && (
            <div className="linkedin-card p-5 border-l-4 border-l-[#0A66C2]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-[#0A66C2] text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-[#057642]" />
                  <span>
                    {searchEngine === 'grok_live' ? 'AI Search Powered by Groq' :
                     searchEngine === 'gemini_live' ? 'AI Search Powered by Gemini' :
                     'AI-Assisted Natural Language Search'}
                  </span>
                </div>
                <span className="text-[11px] text-[#666666]">
                  {searchEngine === 'grok_live' ? '⚡ Parsed By: Groq' :
                   searchEngine === 'gemini_live' ? '🤖 Parsed By: Gemini' :
                   searchEngine === 'cached_ai' ? '⚡ Cached AI' :
                   '🔍 Parsed By: Heuristic'}
                </span>
              </div>

              <h2 className="text-lg font-bold text-[#191919] mb-2">
                Find your ideal technical role naturally
              </h2>
              <p className="text-xs text-[#666666] mb-4 leading-relaxed">
                Skip cumbersome filters. Enter a conversational phrase and AI will automatically extract criteria to filter active tech roles.
              </p>

              <form 
                onSubmit={(e) => { 
                  e.preventDefault(); 
                  handleSmartSearch(query); 
                }} 
                className="flex gap-2 items-center"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#666666]" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., remote senior javascript roles..."
                    className="input-field !pl-9 !py-2 !text-sm w-full"
                  />
                </div>
                <button
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSmartSearch(query);
                  }}
                  disabled={searching}
                  className="btn-primary !px-5 !py-2 text-sm shrink-0 shadow-sm cursor-pointer"
                >
                  {searching ? (
                    <>
                      <RefreshCw className="w-4 h-4 text-white animate-spin" />
                      <span>Parsing...</span>
                    </>
                  ) : (
                    <span>Smart Search</span>
                  )}
                </button>
                {query && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="btn-secondary !px-3 !py-2 text-xs cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </form>

              {/* Conversational Query Chips */}
              <div className="mt-3.5 pt-3 border-t border-[#EDF3F8] flex flex-wrap gap-1.5 items-center">
                <span className="text-[11px] text-[#666666] font-medium mr-1">Try:</span>
                {exampleQueries.map((ex, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => executeExample(ex)}
                    className="bg-[#EDF3F8] hover:bg-[#D7E8F7] text-[#0A66C2] px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer"
                  >
                    "{ex}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* AI Extracted Criteria Visualizer */}
          {extractedParams && !isEmployer && (
            <div className="linkedin-card p-4 border-l-4 border-l-[#057642] bg-[#F4F9F6]">
              <div className="text-xs font-bold text-[#057642] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Extracted Search Parameters ({extractedParams.parsedBy || 'AI'})</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {extractedParams.title && (
                  <span className="bg-white border border-[#DBDBDB] px-2.5 py-1 rounded font-medium text-[#191919]">
                    <span className="text-[#666666]">Title Contains: </span>"{extractedParams.title}"
                  </span>
                )}
                {extractedParams.location && (
                  <span className="bg-white border border-[#DBDBDB] px-2.5 py-1 rounded font-medium text-[#191919]">
                    <span className="text-[#666666]">Location: </span>{extractedParams.location}
                  </span>
                )}
                {typeof extractedParams.isRemote === 'boolean' && (
                  <span className="bg-white border border-[#DBDBDB] px-2.5 py-1 rounded font-medium text-[#057642]">
                    <span className="text-[#666666]">Workplace: </span>{extractedParams.isRemote ? 'Remote Only' : 'Onsite / Hybrid'}
                  </span>
                )}
                {extractedParams.skills && extractedParams.skills.length > 0 && (
                  <span className="bg-white border border-[#DBDBDB] px-2.5 py-1 rounded font-medium text-[#0A66C2]">
                    <span className="text-[#666666]">Skills: </span>{extractedParams.skills.join(', ')}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Feed Header */}
          <div className="flex items-center justify-between px-1 pt-2">
            <div className="text-sm font-bold text-[#191919]">
              {isEmployer ? 'Your Posted Positions' : 'Recommended Technical Positions'} <span className="text-[#666666] font-normal">({displayedJobs.length})</span>
            </div>
            <div className="text-xs text-[#666666]">
              Source: <span className="font-semibold text-[#0A66C2]">
                {fromDatabase ? 'Neon Postgres DB' : 'Local Cache'}
              </span>
              {!isEmployer && searchEngine && (
                <span className="ml-2 text-[10px] bg-[#EDF3F8] text-[#0A66C2] font-bold px-1.5 py-0.5 rounded">
                  {searchEngine === 'grok_live' ? '⚡ Groq AI' :
                   searchEngine === 'gemini_live' ? '🤖 Gemini AI' :
                   searchEngine === 'cached_ai' ? '⚡ Cached' : '🔍 Heuristic'}
                </span>
              )}
            </div>
          </div>

          {/* Job Cards List */}
          {loading ? (
            <div className="linkedin-card py-16 flex flex-col items-center justify-center text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-[#0A66C2] animate-spin" />
              <p className="text-sm text-[#666666] font-medium">Loading opportunities...</p>
            </div>
          ) : displayedJobs.length === 0 ? (
            <div className="linkedin-card p-10 text-center text-[#666666] space-y-3">
              <Search className="w-10 h-10 mx-auto text-[#0A66C2]" />
              <h3 className="text-base font-bold text-[#191919]">
                {isEmployer ? 'No positions posted yet' : 'No roles found matching filters'}
              </h3>
              <p className="text-xs max-w-sm mx-auto">
                {isEmployer 
                  ? 'Use Employer AI Studio to draft and publish your first job opening.' 
                  : 'Try clearing your conversational search prompt or selecting a broader technical domain.'}
              </p>
              {!isEmployer && (
                <button onClick={clearSearch} className="btn-secondary !text-xs !py-1.5 mt-2">
                  Show All Opportunities
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {displayedJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => onSelectJob(job)}
                  className="linkedin-card p-5 hover:bg-[#F9FAFB] transition-all cursor-pointer flex flex-col sm:flex-row justify-between sm:items-center gap-4 group"
                >
                  <div className="flex items-start gap-3.5 flex-1">
                    {/* Company Logo Badge */}
                    <div className="w-12 h-12 rounded bg-[#EDF3F8] border border-[#B3D3EA] flex items-center justify-center font-bold text-lg text-[#0A66C2] shrink-0">
                      {(job.companyName || 'C').charAt(0)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-[#0A66C2] text-base group-hover:underline leading-tight">
                          {job.title}
                        </h4>
                        {job.isRemote && (
                          <span className="bg-[#E7F3ED] text-[#057642] border border-[#B2DFCB] text-[10px] font-extrabold px-[#666666] py-0.5 rounded-sm uppercase">
                            Remote
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#666666]">
                        <span className="flex items-center gap-1 font-semibold text-[#191919]">
                          <Building2 className="w-3.5 h-3.5 text-[#666666]" />
                          {job.companyName}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#666666]" />
                          {job.location}
                        </span>
                        {job.salaryRange && (
                          <span className="flex items-center gap-1 text-[#057642] font-semibold">
                            <DollarSign className="w-3.5 h-3.5" />
                            {job.salaryRange}
                          </span>
                        )}
                      </div>

                      {/* Technical Skills Pill Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        {(job.skills || []).map((skill, idx) => (
                          <span
                            key={idx}
                            className="bg-[#F3F2EF] text-[#666666] border border-[#E0DFDC] text-[11px] px-2 py-0.5 rounded font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Apply Action Button — Hidden for Employers */}
                  {!isEmployer && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!user) {
                          onOpenAuth();
                        } else {
                          onSelectJob(job);
                        }
                      }}
                      className="btn-primary text-xs !py-1.5 !px-4 self-start sm:self-center shrink-0"
                    >
                      {user ? 'Apply Now' : 'Sign in to Apply'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

export default SmartJobSearch;

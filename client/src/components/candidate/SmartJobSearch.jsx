import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Search, Sparkles, MapPin, Briefcase, DollarSign, Building2, RefreshCw } from 'lucide-react';
import { apiService } from '../../services/api.js';

const JobSkeleton = () => (
  <div className="saas-card p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
    <div className="flex items-start gap-4 flex-1 w-full">
      <div className="w-12 h-12 rounded-lg skeleton-box shrink-0" />
      <div className="space-y-3 w-full max-w-md">
        <div className="h-5 w-3/4 skeleton-box" />
        <div className="flex gap-4">
          <div className="h-4 w-24 skeleton-box" />
          <div className="h-4 w-24 skeleton-box" />
        </div>
        <div className="flex gap-2 pt-1">
          <div className="h-6 w-16 skeleton-box" />
          <div className="h-6 w-16 skeleton-box" />
          <div className="h-6 w-20 skeleton-box" />
        </div>
      </div>
    </div>
    <div className="w-28 h-10 skeleton-box rounded-lg shrink-0 mt-3 sm:mt-0" />
  </div>
);

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

  const fetchInitialJobs = useCallback(async (signal) => {
    setLoading(true);
    try {
      const allJobs = await apiService.getJobs(signal);
      setJobs(allJobs);
    } catch (err) {
      if (err?.code !== 'ERR_CANCELED' && err?.name !== 'AbortError') {
        console.warn('[SmartSearch Init] Jobs fetch failed:', err?.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSmartSearch = useCallback(async (overrideQuery) => {
    const searchText = typeof overrideQuery === 'string' ? overrideQuery : query;
    if (!searchText || typeof searchText !== 'string' || !searchText.trim()) {
      setExtractedParams(null);
      await fetchInitialJobs();
      return;
    }

    setSearching(true);
    try {
      const res = await apiService.smartAiSearch(searchText);
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

  const handleSmartSearchRef = useRef(handleSmartSearch);
  useEffect(() => {
    handleSmartSearchRef.current = handleSmartSearch;
  }, [handleSmartSearch]);

  useEffect(() => {
    const controller = new AbortController();
    if (headerQuery && typeof headerQuery === 'string' && headerQuery.trim()) {
      setQuery(headerQuery);
      handleSmartSearchRef.current(headerQuery);
    } else {
      fetchInitialJobs(controller.signal);
    }
    return () => controller.abort();
  }, [headerQuery, fetchInitialJobs]);

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
    <div className="max-w-[1128px] mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Candidate Profile / Identity Card */}
        <div className="md:col-span-3 space-y-4 md:sticky md:top-[88px]">
          <div className="saas-card overflow-hidden text-center pb-4">
            <div className="h-16 bg-gradient-to-r from-blue-600 to-indigo-600" />
            <div className="w-16 h-16 rounded-full bg-white border-4 border-white text-blue-600 font-bold text-2xl mx-auto -mt-8 shadow-sm flex items-center justify-center">
              {user ? (user.firstName?.[0] || user.companyName?.[0] || user.email[0]).toUpperCase() : 'G'}
            </div>

            <div className="px-4 mt-2">
              <h3 className="font-bold text-gray-900 text-base">
                {user ? (user.companyName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email.split('@')[0]) : 'Guest User'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">
                {user ? `${user.role} Profile` : 'Searching active tech roles'}
              </p>
            </div>

            <hr className="my-4 border-gray-200 mx-4" />

            <div className="px-4 text-left space-y-2.5 text-xs font-medium">
              <div className="flex justify-between text-gray-500">
                <span>Active Session Role</span>
                <span className="font-bold text-blue-600">{user ? user.role : 'CANDIDATE'}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>AI Job Board</span>
                <span className="font-semibold text-emerald-600">Neon Postgres</span>
              </div>
            </div>

            <hr className="my-4 border-gray-200 mx-4" />

            <div className="px-4 text-left">
              <p className="text-[11px] font-bold text-gray-900 uppercase tracking-wider mb-2">Matched Skills</p>
              <div className="flex flex-wrap gap-1.5">
                <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-md">Node.js</span>
                <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-md">React</span>
                <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-md">PostgreSQL</span>
                <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-md">Prisma</span>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: AI Smart Search Box & Jobs Feed */}
        <div className="md:col-span-9 space-y-6">
          
          {/* AI Search Card */}
          {!isEmployer && (
            <div className="saas-card p-6 border-l-4 border-l-blue-600 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                 <Sparkles className="w-24 h-24 text-blue-600" />
              </div>
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>
                    {searchEngine === 'grok_live' ? 'AI Search (Groq)' :
                     searchEngine === 'gemini_live' ? 'AI Search (Gemini)' :
                     'AI Natural Language Search'}
                  </span>
                </div>
                <span className="text-[11px] text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                  {searchEngine === 'grok_live' ? '⚡ Parsed By: Groq' :
                   searchEngine === 'gemini_live' ? '🤖 Parsed By: Gemini' :
                   searchEngine === 'cached_ai' ? '⚡ Cached AI' :
                   '🔍 Parsed By: Heuristic'}
                </span>
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-2 relative z-10">
                Find your ideal technical role naturally
              </h2>
              <p className="text-sm text-gray-500 mb-5 leading-relaxed max-w-2xl relative z-10">
                Skip cumbersome filters. Enter a conversational phrase and AI will automatically extract criteria to filter active tech roles.
              </p>

              <form 
                onSubmit={(e) => { e.preventDefault(); handleSmartSearch(query); }} 
                className="flex flex-col sm:flex-row gap-3 items-start sm:items-center relative z-10"
              >
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., remote senior javascript roles..."
                    className="input-field !pl-10 w-full shadow-sm"
                  />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    type="submit"
                    disabled={searching}
                    className="btn-primary w-full sm:w-auto shrink-0 shadow-sm"
                  >
                    {searching ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
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
                      className="btn-secondary w-full sm:w-auto shrink-0"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </form>

              {/* Conversational Query Chips */}
              <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap gap-2 items-center relative z-10">
                <span className="text-xs text-gray-400 font-semibold mr-1 uppercase tracking-wider">Try:</span>
                {exampleQueries.map((ex, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => executeExample(ex)}
                    className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  >
                    "{ex}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* AI Extracted Criteria Visualizer */}
          {extractedParams && !isEmployer && (
            <div className="saas-card p-5 border-l-4 border-l-emerald-500 bg-emerald-50/30">
              <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Extracted Search Parameters ({extractedParams.parsedBy || 'AI'})</span>
              </div>
              <div className="flex flex-wrap gap-2.5 text-xs">
                {extractedParams.title && (
                  <span className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg font-medium text-gray-900 shadow-sm">
                    <span className="text-gray-500 mr-1">Title Contains:</span>"{extractedParams.title}"
                  </span>
                )}
                {extractedParams.location && (
                  <span className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg font-medium text-gray-900 shadow-sm">
                    <span className="text-gray-500 mr-1">Location:</span>{extractedParams.location}
                  </span>
                )}
                {typeof extractedParams.isRemote === 'boolean' && (
                  <span className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg font-medium text-emerald-600 shadow-sm">
                    <span className="text-gray-500 mr-1">Workplace:</span>{extractedParams.isRemote ? 'Remote Only' : 'Onsite / Hybrid'}
                  </span>
                )}
                {extractedParams.skills && extractedParams.skills.length > 0 && (
                  <span className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg font-medium text-blue-600 shadow-sm">
                    <span className="text-gray-500 mr-1">Skills:</span>{extractedParams.skills.join(', ')}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Feed Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-1 gap-2">
            <div className="text-lg font-bold text-gray-900">
              {isEmployer ? 'Your Posted Positions' : 'Recommended Technical Positions'} 
              <span className="text-gray-400 font-medium ml-2 text-sm bg-gray-100 px-2 py-0.5 rounded-full">{displayedJobs.length}</span>
            </div>
            <div className="text-xs text-gray-500 font-medium flex items-center gap-2">
              <span>Source: <span className="font-bold text-gray-900">{fromDatabase ? 'Neon Postgres DB' : 'Local Cache'}</span></span>
              {!isEmployer && searchEngine && (
                <span className="bg-blue-50 text-blue-700 border border-blue-100 font-bold px-2 py-0.5 rounded-md">
                  {searchEngine === 'grok_live' ? '⚡ Groq AI' :
                   searchEngine === 'gemini_live' ? '🤖 Gemini AI' :
                   searchEngine === 'cached_ai' ? '⚡ Cached' : '🔍 Heuristic'}
                </span>
              )}
            </div>
          </div>

          {/* Job Cards List */}
          <div className="space-y-4">
            {loading ? (
              <>
                <JobSkeleton />
                <JobSkeleton />
                <JobSkeleton />
              </>
            ) : displayedJobs.length === 0 ? (
              <div className="saas-card p-12 text-center text-gray-500 space-y-4 flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  {isEmployer ? 'No positions posted yet' : 'No roles found matching filters'}
                </h3>
                <p className="text-sm max-w-sm mx-auto leading-relaxed">
                  {isEmployer 
                    ? 'Use Employer AI Studio to draft and publish your first job opening.' 
                    : 'Try clearing your conversational search prompt or selecting a broader technical domain.'}
                </p>
                {!isEmployer && (
                  <button onClick={clearSearch} className="btn-secondary mt-4">
                    Show All Opportunities
                  </button>
                )}
              </div>
            ) : (
              displayedJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => onSelectJob(job)}
                  className="saas-card p-5 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col sm:flex-row justify-between sm:items-center gap-5 group"
                >
                  <div className="flex items-start gap-4 flex-1">
                    {/* Company Logo Badge */}
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-xl text-blue-600 shrink-0 shadow-sm">
                      {(job.companyName || 'C').charAt(0)}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h4 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors leading-tight">
                          {job.title}
                        </h4>
                        {job.isRemote && (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                            Remote
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          {job.companyName}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {job.location}
                        </span>
                        {job.salaryRange && (
                          <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                            <DollarSign className="w-4 h-4" />
                            {job.salaryRange}
                          </span>
                        )}
                      </div>

                      {/* Technical Skills Pill Tags */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        {(job.skills || []).map((skill, idx) => (
                          <span
                            key={idx}
                            className="bg-gray-50 text-gray-600 border border-gray-200 text-xs px-2.5 py-1 rounded-md font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Apply Action Button */}
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
                      className="btn-primary self-start sm:self-center shrink-0 w-full sm:w-auto"
                    >
                      {user ? 'Apply Now' : 'Sign in to Apply'}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default SmartJobSearch;

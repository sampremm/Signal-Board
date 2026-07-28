import React, { useState } from 'react';
import { Sparkles, Briefcase, Zap, CheckCircle, ShieldAlert, ArrowRight, MapPin, DollarSign, RefreshCw, Send, Lock, FileText, Building2 } from 'lucide-react';
import { apiService } from '../../services/api.js';

const presetExamples = [
  {
    title: 'Senior Backend Engineer',
    notes: 'Need an expert full stack engineer with React, Vite, Tailwind v4, Node.js, and Prisma over Neon PostgreSQL. Redis experience a plus. Salary is $165k - $210k. Remote option available.',
  },
  {
    title: 'Lead AI Systems Integrator (LLM / Gemini)',
    notes: 'Looking for someone experienced with LLM APIs and the Google AI SDK to turn natural conversational language into database query parameters and recruiter summaries. Salary $190k+.',
  },
  {
    title: 'Staff Frontend Architect (Tailwind v4 & Light Theme)',
    notes: 'We want state-of-the-art aesthetics, clean LinkedIn-style white cards, smooth micro-animations, and fast page load times in React and Tailwind CSS v4 Vite plugin. Must care deeply about visual excellence and developer experience.',
  },
];

export const AiJobGenerator = ({ user, onOpenAuth, onJobPublished }) => {
  const [title, setTitle] = useState('Senior Backend Engineer');
  const [location, setLocation] = useState('San Francisco, CA (Remote Option)');
  const [salaryRange, setSalaryRange] = useState('$160,000 - $210,000 / year');
  const [isRemote, setIsRemote] = useState(true);
  const [skills, setSkills] = useState('React, JavaScript, Node.js, Prisma, Tailwind v4, Upstash Redis, Gemini AI');
  const [rawNotes, setRawNotes] = useState(presetExamples[0].notes);
  
  const [generating, setGenerating] = useState(false);
  const [formattedDescription, setFormattedDescription] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setPublishedSuccess(false);

    try {
      const company = user?.companyName || 'Apex Technologies';
      const resultText = await apiService.generateAiJobDescription(rawNotes, title, company);
      setFormattedDescription(resultText);
    } catch (err) {
      setError('Network or API issue. Using local formatting template.');
      const fallbackTemplate = `# Senior Role: ${title}
      
### Role Summary
We are actively recruiting an exceptional professional to architect scalable systems and deliver outstanding business value at ${user?.companyName || 'Apex Technologies'}.

### Key Requirements
* ${rawNotes || 'Strong technical background and engineering excellence.'}

*(Note: AI generation unavailable — formatted via local browser template.)*`;
      setFormattedDescription(fallbackTemplate);
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!user || user.role !== 'EMPLOYER') {
      onOpenAuth('EMPLOYER');
      return;
    }

    if (!formattedDescription) {
      setError('Please generate a job description before publishing.');
      return;
    }

    setPublishing(true);
    setError(null);

    try {
      const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
      await apiService.createJob({
        title,
        location,
        salaryRange,
        isRemote,
        skills: skillsArray,
        description: formattedDescription,
      });
      setPublishedSuccess(true);
      if (onJobPublished) onJobPublished();
    } catch (err) {
      setError('Failed to publish job posting to storage layer.');
    } finally {
      setPublishing(false);
    }
  };

  const selectPreset = (idx) => {
    setTitle(presetExamples[idx].title);
    setRawNotes(presetExamples[idx].notes);
    setFormattedDescription('');
    setPublishedSuccess(false);
  };

  return (
    <div className="max-w-[1128px] mx-auto px-4 py-8">
      
      {/* Employer Studio Banner */}
      <div className="saas-card p-6 md:p-8 mb-8 bg-gradient-to-r from-gray-50 to-blue-50/50 border-l-4 border-l-blue-600 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
          <Sparkles className="w-48 h-48 text-blue-600" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-blue-600 text-xs font-extrabold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Employer AI Studio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              AI-Assisted Technical Recruiter Workbench
            </h1>
            <p className="text-sm sm:text-base text-gray-500 max-w-2xl mt-2 leading-relaxed">
              Transform rough hiring notes into a structured job post in seconds using AI-assisted generation, then publish directly to the job board.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            {presetExamples.map((ex, idx) => (
              <button
                key={idx}
                onClick={() => selectPreset(idx)}
                className="bg-white hover:bg-gray-50 text-blue-600 border border-gray-200 hover:border-blue-300 text-xs px-3 py-1.5 rounded-lg font-bold transition-all shadow-sm cursor-pointer hover:shadow-md"
              >
                ⚡ {ex.title.split(' ')[0]} {ex.title.split(' ')[1]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Studio Grid: Input Notes on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Input Specifications (col-span-6) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="saas-card p-6 md:p-8 space-y-5">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b border-gray-200 pb-3 mb-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <span>1. Position Details & Raw Notes</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                Job Title / Position
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  Salary Range
                </label>
                <input
                  type="text"
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-orange-500" />
                Target Technical Skills (Comma Separated)
              </label>
              <input
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="input-field"
                placeholder="React, JavaScript, Node.js, Prisma"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Rough Hiring Manager Notes
                </label>
                <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border border-blue-100">
                  Gemini Input
                </span>
              </div>
              <textarea
                rows={5}
                value={rawNotes}
                onChange={(e) => setRawNotes(e.target.value)}
                className="input-field font-mono !text-sm leading-relaxed resize-none bg-gray-50"
                placeholder="Type quick engineering requirements, salary notes, or team directives..."
              />
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="w-full btn-primary py-3 text-base font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-5 h-5 text-white animate-spin" />
                  <span>Gemini Formatting in Progress...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate AI Job Post</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {error && (
              <div className="p-3 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 text-sm flex items-start gap-2">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: AI Generated Output & Publishing (col-span-6) */}
        <div className="lg:col-span-6 flex flex-col h-full min-h-[600px]">
          <div className="saas-card p-6 md:p-8 flex-1 flex flex-col justify-between space-y-6 bg-gray-50/50">
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span>2. AI Recruiter Profile Preview</span>
                </h3>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border ${
                  formattedDescription ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                }`}>
                  {formattedDescription ? 'Ready to Publish' : 'Waiting for Input'}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar bg-white rounded-xl border border-gray-200 p-4 shadow-inner min-h-[400px]">
                {generating ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 animate-pulse">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      <Sparkles className="w-8 h-8 animate-spin-slow" />
                    </div>
                    <div className="text-gray-900 font-bold text-base">
                      Executing Gemini Recruiter Persona...
                    </div>
                    <p className="text-sm text-gray-500 max-w-sm">
                      Structuring markdown, formatting requirements, and optimizing for high candidate conversion.
                    </p>
                  </div>
                ) : formattedDescription ? (
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-xs font-bold text-blue-700 flex items-center justify-between uppercase tracking-wider">
                      <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4"/> AI-assisted</span>
                      <span>Neon DB Sync Ready</span>
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed text-sm text-gray-800 font-sans px-2">
                      {formattedDescription}
                    </div>
                  </div>
                ) : (
                  <div className="h-full border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-center p-8 text-gray-500 space-y-3 bg-gray-50/50">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 mb-2">
                      <Briefcase className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="font-bold text-gray-900 text-base">No Job Generated Yet</p>
                    <p className="text-sm max-w-sm leading-relaxed text-gray-500">
                      Fill out position notes on the left and click <strong>Generate AI Job Post</strong> to watch Gemini assemble your listing.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Publishing Banner */}
            <div className="pt-5 border-t border-gray-200 mt-auto">
              {publishedSuccess ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 shrink-0 text-emerald-600" />
                    <div>
                      <h4 className="font-bold text-base text-gray-900">Job Published Successfully!</h4>
                      <p className="text-xs text-emerald-700 mt-0.5">Persisted directly to Neon Postgres relational tables.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPublishedSuccess(false)}
                    className="bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50 text-sm font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors shadow-sm w-full sm:w-auto"
                  >
                    Create Another
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={publishing || !formattedDescription}
                    className={`flex-1 btn-accent py-3 text-base font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                      !formattedDescription ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {publishing ? (
                      <>
                        <RefreshCw className="w-5 h-5 text-white animate-spin" />
                        <span>Publishing to Database...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Publish to Live Job Board</span>
                      </>
                    )}
                  </button>
                  
                  {!user || user.role !== 'EMPLOYER' ? (
                    <button
                      type="button"
                      onClick={() => onOpenAuth('EMPLOYER')}
                      className="btn-secondary py-3 px-6 flex items-center justify-center gap-2 cursor-pointer"
                      title="Requires Employer Split-Entity Profile"
                    >
                      <Lock className="w-4 h-4 text-orange-500" />
                      <span>Employer Login</span>
                    </button>
                  ) : null}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

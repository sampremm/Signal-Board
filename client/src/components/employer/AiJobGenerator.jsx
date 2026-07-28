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
    <div className="max-w-[1128px] mx-auto px-4 py-6">
      
      {/* LinkedIn Style Employer Studio Banner */}
      <div className="linkedin-card p-6 mb-6 bg-gradient-to-r from-[#F3F6F8] to-[#E8F3FA] border-l-4 border-l-[#0A66C2]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#0A66C2] text-xs font-extrabold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-[#057642]" />
              <span>Feature 1: Employer AI Studio</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#191919]">
              AI-Assisted Technical Recruiter Workbench
            </h1>
            <p className="text-xs sm:text-sm text-[#666666] max-w-2xl mt-1 leading-relaxed">
              Transform rough hiring notes into a structured job post in seconds using AI-assisted generation, then publish directly to the job board.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 shrink-0">
            {presetExamples.map((ex, idx) => (
              <button
                key={idx}
                onClick={() => selectPreset(idx)}
                className="bg-white hover:bg-[#EDF3F8] text-[#0A66C2] border border-[#0A66C2]/40 text-xs px-3 py-1.5 rounded-full font-medium transition-colors shadow-2xs cursor-pointer"
              >
                ⚡ {ex.title.split(' ')[0]} {ex.title.split(' ')[1]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Studio Grid: Input Notes on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Input Specifications (col-span-6) */}
        <div className="md:col-span-6 space-y-4">
          <div className="linkedin-card p-6 space-y-4">
            <h3 className="text-base font-bold text-[#191919] flex items-center gap-2 border-b border-[#DBDBDB] pb-2.5">
              <Briefcase className="w-5 h-5 text-[#0A66C2]" />
              <span>1. Position Details & Raw Notes</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-[#666666] mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-[#0A66C2]" />
                Job Title / Position
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#666666] mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#057642]" />
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
                <label className="block text-xs font-semibold text-[#666666] mb-1 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-[#0A66C2]" />
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
              <label className="block text-xs font-semibold text-[#666666] mb-1 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-[#E68523]" />
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#666666] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#057642]" />
                  Rough Hiring Manager Notes
                </label>
                <span className="text-[10px] bg-[#EDF3F8] text-[#0A66C2] px-1.5 py-0.5 rounded font-bold">
                  Gemini Input
                </span>
              </div>
              <textarea
                rows={5}
                value={rawNotes}
                onChange={(e) => setRawNotes(e.target.value)}
                className="input-field font-mono !text-xs leading-relaxed resize-none"
                placeholder="Type quick engineering requirements, salary notes, or team directives..."
              />
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="w-full btn-primary py-2.5 text-sm font-bold shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 text-white animate-spin" />
                  <span>Gemini Formatting in Progress...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate AI Job Post</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {error && (
              <div className="p-3 rounded bg-[#FFF0E0] border border-[#F2C08A] text-[#A65300] text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: AI Generated Output & Publishing (col-span-6) */}
        <div className="md:col-span-6 flex flex-col">
          <div className="linkedin-card p-6 flex-1 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-[#DBDBDB] pb-2.5 mb-3">
                <h3 className="text-base font-bold text-[#191919] flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#057642]" />
                  <span>2. AI Recruiter Profile Preview</span>
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  formattedDescription ? 'bg-[#E7F3ED] text-[#057642]' : 'bg-[#F3F2EF] text-[#666666]'
                }`}>
                  {formattedDescription ? 'READY TO PUBLISH' : 'WAITING FOR INPUT'}
                </span>
              </div>

              <div className="min-h-[340px] max-h-[480px] overflow-y-auto pr-1">
                {generating ? (
                  <div className="py-24 flex flex-col items-center justify-center text-center space-y-3 animate-pulse">
                    <div className="w-12 h-12 rounded-full bg-[#EDF3F8] text-[#0A66C2] flex items-center justify-center font-bold">
                      <Sparkles className="w-6 h-6 animate-spin-slow" />
                    </div>
                    <div className="text-[#191919] font-bold text-sm">
                      Executing Gemini Recruiter Persona...
                    </div>
                    <p className="text-xs text-[#666666] max-w-xs">
                      Structuring markdown, formatting requirements, and optimizing for high candidate conversion.
                    </p>
                  </div>
                ) : formattedDescription ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded bg-[#EDF3F8] border border-[#B3D3EA] text-xs font-medium text-[#0A66C2] flex items-center justify-between">
                      <span>✨ AI-assisted</span>
                      <span>Neon DB Relational Sync Ready</span>
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed text-sm text-[#191919] font-sans pr-2">
                      {formattedDescription}
                    </div>
                  </div>
                ) : (
                  <div className="py-24 border-2 border-dashed border-[#DBDBDB] rounded-lg flex flex-col items-center justify-center text-center p-6 text-[#666666] space-y-2">
                    <Briefcase className="w-10 h-10 text-[#757575]" />
                    <p className="font-bold text-[#191919] text-sm">No Job Generated Yet</p>
                    <p className="text-xs max-w-xs leading-relaxed">
                      Fill out position notes on the left and click **Generate AI Job Post** to watch Gemini assemble your listing.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Publishing Banner */}
            <div className="pt-4 border-t border-[#DBDBDB]">
              {publishedSuccess ? (
                <div className="p-3.5 rounded-lg bg-[#E7F3ED] border border-[#B2DFCB] text-[#057642] flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm text-[#191919]">Job Published Successfully!</h4>
                      <p className="text-xs text-[#666666]">Persisted directly to Neon Postgres relational tables.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPublishedSuccess(false)}
                    className="bg-white text-[#057642] border border-[#057642] hover:bg-[#E7F3ED] text-xs font-bold px-3 py-1 rounded-full cursor-pointer transition-colors"
                  >
                    Create Another
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={publishing || !formattedDescription}
                    className={`flex-1 btn-accent py-2.5 text-sm flex items-center justify-center gap-2 cursor-pointer ${
                      !formattedDescription ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {publishing ? (
                      <>
                        <RefreshCw className="w-4 h-4 text-white animate-spin" />
                        <span>Publishing to Database...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Publish to Live Job Board</span>
                      </>
                    )}
                  </button>
                  
                  {!user || user.role !== 'EMPLOYER' ? (
                    <button
                      type="button"
                      onClick={() => onOpenAuth('EMPLOYER')}
                      className="btn-secondary !text-xs !py-2 !px-4 flex items-center gap-1 cursor-pointer"
                      title="Requires Employer Split-Entity Profile"
                    >
                      <Lock className="w-3.5 h-3.5 text-[#E68523]" />
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

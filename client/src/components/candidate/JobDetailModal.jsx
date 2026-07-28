import React, { useState } from 'react';
import { X, Building, MapPin, DollarSign, Send, CheckCircle2, ShieldCheck, Lock, Sparkles, FileText } from 'lucide-react';
import confetti from 'canvas-confetti';
import { apiService } from '../../services/api.js';

export const JobDetailModal = ({ job, user, onClose, onOpenAuth }) => {
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [error, setError] = useState(null);

  if (!job) return null;

  const handleApply = async (e) => {
    e.preventDefault();
    if (!user || user.role !== 'CANDIDATE') {
      onOpenAuth('CANDIDATE');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await apiService.submitApplication(job.id, coverLetter);
      setAppliedSuccess(true);
      
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#057642', '#0A66C2', '#34D399'],
      });
    } catch (err) {
      setError('Unable to record application in database.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] overflow-y-auto">
      <div className="w-full max-w-3xl bg-white rounded-lg border border-[#DBDBDB] shadow-2xl my-8 max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <div className="p-6 bg-gradient-to-r from-[#F3F6F8] to-[#E8F3FA] border-b border-[#DBDBDB]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#0A66C2] mb-1">
                <Building className="w-3.5 h-3.5" />
                <span>{job.companyName}</span>
                <span>•</span>
                <span>{job.isRemote ? 'REMOTE POSITION' : 'ONSITE POSITION'}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#191919]">
                {job.title}
              </h2>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-[#666666]">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {job.location}
                </span>
                {job.salaryRange && (
                  <span className="flex items-center gap-1 text-[#057642] font-bold">
                    <DollarSign className="w-3.5 h-3.5" />
                    {job.salaryRange}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-[#666666] hover:text-[#191919] p-1 rounded hover:bg-[#EDF3F8]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Skills Chips */}
          <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-[#DBDBDB]/60">
            {job.skills.map((s, idx) => (
              <span key={idx} className="px-2.5 py-0.5 rounded bg-[#EDF3F8] text-[#0A66C2] text-xs font-semibold">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 font-sans text-[#191919]">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0A66C2] mb-2 flex items-center gap-1">
              <FileText className="w-4 h-4" />
              <span>Role Specifications</span>
            </h4>
            
            <div className="p-4 rounded bg-[#F9FAFB] border border-[#DBDBDB] whitespace-pre-wrap leading-relaxed text-sm text-[#191919]">
              {job.description}
            </div>
          </div>

          {/* Application Submission Portal */}
          <div className="pt-4 border-t border-[#DBDBDB]">
            {user?.role === 'EMPLOYER' ? (
              <div className="p-4 rounded bg-[#EDF3F8] border border-[#B3D3EA] text-center space-y-1">
                <h4 className="text-sm font-bold text-[#191919]">Employer View — Posting Details</h4>
                <p className="text-xs text-[#666666]">
                  You are viewing this job posting as an employer. Application submissions are managed directly via your candidate pipeline.
                </p>
              </div>
            ) : appliedSuccess ? (
              <div className="p-4 rounded bg-[#E7F3ED] border border-[#B2DFCB] text-[#057642] text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-[#057642]" />
                <h4 className="text-base font-bold text-[#191919]">Application Submitted to Hiring Team!</h4>
                <p className="text-xs text-[#666666] max-w-md mx-auto">
                  Your candidate profile and cover text have been linked to this posting in Neon PostgreSQL.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-accent !text-xs !py-1.5 !px-6 mt-2"
                >
                  Return to Jobs Feed
                </button>
              </div>
            ) : (
              <form onSubmit={handleApply} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#191919] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#057642]" />
                    <span>Apply to Job Opportunity</span>
                  </h4>
                  {user && user.role === 'CANDIDATE' ? (
                    <span className="text-xs text-[#057642] font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified Candidate
                    </span>
                  ) : null}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#666666] uppercase mb-1">
                    Cover Note / Highlights (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    className="input-field !text-sm"
                    placeholder="Highlight your relevant experience and why you are a fit for this position..."
                  />
                </div>

                {error && (
                  <div className="p-2.5 rounded bg-[#FFF0E0] border border-[#F2C08A] text-[#A65300] text-xs">
                    ⚠️ {error}
                  </div>
                )}

                <div>
                  {!user || user.role !== 'CANDIDATE' ? (
                    <button
                      type="button"
                      onClick={() => onOpenAuth('CANDIDATE')}
                      className="w-full btn-primary py-2.5 text-sm font-bold flex items-center justify-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Sign in as Candidate to Apply</span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full btn-accent py-2.5 text-sm font-bold flex items-center justify-center gap-2"
                    >
                      {submitting ? 'Transmitting...' : 'Submit Application Now'}
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

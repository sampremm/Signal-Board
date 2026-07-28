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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-3xl bg-white rounded-2xl border border-gray-200 shadow-2xl my-8 max-h-[90vh] flex flex-col overflow-hidden transition-all">
        
        {/* Top Header */}
        <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-blue-600 mb-2 tracking-wide uppercase">
                <Building className="w-3.5 h-3.5" />
                <span>{job.companyName}</span>
                <span>•</span>
                <span>{job.isRemote ? 'REMOTE POSITION' : 'ONSITE POSITION'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
                {job.title}
              </h2>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {job.location}
                </span>
                {job.salaryRange && (
                  <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                    <DollarSign className="w-4 h-4" />
                    {job.salaryRange}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Skills Chips */}
          <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-gray-100">
            {job.skills.map((s, idx) => (
              <span key={idx} className="px-3 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold tracking-wide">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-8 flex-1 font-sans text-gray-900">
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-blue-600 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Role Specifications</span>
            </h4>
            
            <div className="p-5 rounded-xl bg-gray-50 border border-gray-200 whitespace-pre-wrap leading-relaxed text-sm text-gray-700">
              {job.description}
            </div>
          </div>

          {/* Application Submission Portal */}
          <div className="pt-6 border-t border-gray-200">
            {user?.role === 'EMPLOYER' ? (
              <div className="p-5 rounded-xl bg-blue-50 border border-blue-100 text-center space-y-2">
                <h4 className="text-sm font-bold text-gray-900">Employer View — Posting Details</h4>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  You are viewing this job posting as an employer. Application submissions are managed directly via your candidate pipeline.
                </p>
              </div>
            ) : appliedSuccess ? (
              <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-center space-y-3 shadow-inner">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600" />
                <h4 className="text-lg font-bold text-gray-900 tracking-tight">Application Submitted to Hiring Team!</h4>
                <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                  Your candidate profile and cover text have been linked to this posting in Neon PostgreSQL.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-accent py-2 px-6 mt-4"
                >
                  Return to Jobs Feed
                </button>
              </div>
            ) : (
              <form onSubmit={handleApply} className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Apply to Job Opportunity</span>
                  </h4>
                  {user && user.role === 'CANDIDATE' ? (
                    <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md flex items-center gap-1.5 w-max">
                      <ShieldCheck className="w-4 h-4" /> Verified Candidate
                    </span>
                  ) : null}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                    Cover Note / Highlights (Optional)
                  </label>
                  <textarea
                    rows={4}
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    className="input-field resize-y"
                    placeholder="Highlight your relevant experience and why you are a fit for this position..."
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                    ⚠️ {error}
                  </div>
                )}

                <div className="pt-2">
                  {!user || user.role !== 'CANDIDATE' ? (
                    <button
                      type="button"
                      onClick={() => onOpenAuth('CANDIDATE')}
                      className="w-full btn-primary py-3 text-base"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Sign in as Candidate to Apply</span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full btn-accent py-3 text-base"
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

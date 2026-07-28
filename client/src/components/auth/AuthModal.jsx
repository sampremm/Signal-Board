import React, { useState } from 'react';
import { X, Lock, Mail, Building, User as UserIcon, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { apiService } from '../../services/api.js';

export const AuthModal = ({ isOpen, onClose, defaultRole = 'CANDIDATE', onAuthSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [role, setRole] = useState(defaultRole);
  const [email, setEmail] = useState(defaultRole === 'EMPLOYER' ? 'employer@signalboard.ai' : 'candidate@signalboard.ai');
  const [password, setPassword] = useState('demo1234');
  const [companyName, setCompanyName] = useState('Apex Technologies');
  const [firstName, setFirstName] = useState('Sam Prem');
  const [lastName, setLastName] = useState('Kumar Thalla');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegistering) {
        await apiService.register({
          email,
          password,
          role,
          companyName: role === 'EMPLOYER' ? companyName : undefined,
          firstName: role === 'CANDIDATE' ? firstName : undefined,
          lastName: role === 'CANDIDATE' ? lastName : undefined,
          skills: role === 'CANDIDATE' ? ['JavaScript', 'React', 'PostgreSQL', 'Vite', 'Gemini AI', 'Tailwind CSS'] : undefined,
        });
      } else {
        await apiService.login({ email, password });
      }
      onAuthSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoRole) => {
    setLoading(true);
    setError(null);
    try {
      const demoEmail = demoRole === 'EMPLOYER' ? 'employer@signalboard.ai' : 'candidate@signalboard.ai';
      await apiService.login({ email: demoEmail, password: 'demo1234' });
      onAuthSuccess();
      onClose();
    } catch (err) {
      setError('Unable to authenticate demo session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
      <div className="w-full max-w-md bg-white rounded-lg border border-[#DBDBDB] shadow-2xl p-6 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#DBDBDB]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#0A66C2] text-white flex items-center justify-center font-bold text-sm">
              SB
            </div>
            <div>
              <h3 className="text-base font-bold text-[#191919]">
                {isRegistering ? 'Create Signal Board Profile' : 'Sign in to Signal Board'}
              </h3>
              <p className="text-[11px] text-[#666666]">Decentralized JWT session authentication</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#666666] hover:text-[#191919] p-1 rounded hover:bg-[#F3F2EF]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo Login Buttons */}
        <div className="my-4 bg-[#EDF3F8] border border-[#B3D3EA] rounded p-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A66C2] mb-2 uppercase">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#057642]" />
            <span>Instant Demo Sessions</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('CANDIDATE')}
              disabled={loading}
              className="btn-secondary !text-xs !py-1.5 flex items-center justify-center gap-1 !bg-white"
            >
              <UserIcon className="w-3.5 h-3.5 text-[#057642]" />
              <span>Demo Candidate</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('EMPLOYER')}
              disabled={loading}
              className="btn-secondary !text-xs !py-1.5 flex items-center justify-center gap-1 !bg-white"
            >
              <Building className="w-3.5 h-3.5 text-[#0A66C2]" />
              <span>Demo Employer</span>
            </button>
          </div>
        </div>

        {/* Role Selector */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#F3F2EF] rounded mb-4 border border-[#DBDBDB]">
          <button
            type="button"
            onClick={() => {
              setRole('CANDIDATE');
              setEmail('candidate@signalboard.ai');
            }}
            className={`py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
              role === 'CANDIDATE' ? 'bg-white text-[#0A66C2] shadow-xs' : 'text-[#666666] hover:text-[#191919]'
            }`}
          >
            Candidate (Job Seeker)
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('EMPLOYER');
              setEmail('employer@signalboard.ai');
            }}
            className={`py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
              role === 'EMPLOYER' ? 'bg-white text-[#0A66C2] shadow-xs' : 'text-[#666666] hover:text-[#191919]'
            }`}
          >
            Employer (Hiring Studio)
          </button>
        </div>

        {error && (
          <div className="p-2.5 mb-3 rounded bg-[#FFF0E0] border border-[#F2C08A] text-[#A65300] text-xs">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-[#666666] uppercase mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field !text-sm"
              placeholder="user@domain.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#666666] uppercase mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field !text-sm"
              placeholder="••••••••"
            />
          </div>

          {isRegistering && role === 'EMPLOYER' && (
            <div>
              <label className="block text-xs font-bold text-[#666666] uppercase mb-1">
                Company Name
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="input-field !text-sm"
              />
            </div>
          )}

          {isRegistering && role === 'CANDIDATE' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-[#666666] uppercase mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input-field !text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#666666] uppercase mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input-field !text-sm"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-2.5 font-bold text-sm mt-1"
          >
            {loading ? 'Authenticating...' : isRegistering ? `Register ${role} Profile` : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-[#DBDBDB] text-center text-xs text-[#666666]">
          {isRegistering ? 'Already have an account?' : 'Need a split-entity account?'}
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="ml-1.5 font-bold text-[#0A66C2] hover:underline"
          >
            {isRegistering ? 'Sign In' : 'Create Account'}
          </button>
        </div>

      </div>
    </div>
  );
};

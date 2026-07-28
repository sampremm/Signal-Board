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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl p-6 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-inner">
              SB
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {isRegistering ? 'Create Signal Board Profile' : 'Sign in to Signal Board'}
              </h3>
              <p className="text-xs text-gray-500 font-medium">Decentralized JWT session authentication</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo Login Buttons */}
        <div className="my-5 bg-blue-50 border border-blue-100 rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 mb-2 uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Instant Demo Sessions</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('CANDIDATE')}
              disabled={loading}
              className="btn-secondary !text-xs !py-2 flex items-center justify-center gap-1.5"
            >
              <UserIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>Demo Candidate</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('EMPLOYER')}
              disabled={loading}
              className="btn-secondary !text-xs !py-2 flex items-center justify-center gap-1.5"
            >
              <Building className="w-3.5 h-3.5 text-blue-600" />
              <span>Demo Employer</span>
            </button>
          </div>
        </div>

        {/* Role Selector */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-lg mb-5 border border-gray-200">
          <button
            type="button"
            onClick={() => {
              setRole('CANDIDATE');
              setEmail('candidate@signalboard.ai');
            }}
            className={`py-2 rounded-md text-sm font-bold transition-all cursor-pointer ${
              role === 'CANDIDATE' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Candidate
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('EMPLOYER');
              setEmail('employer@signalboard.ai');
            }}
            className={`py-2 rounded-md text-sm font-bold transition-all cursor-pointer ${
              role === 'EMPLOYER' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Employer
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2">
            <span className="text-lg">⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="user@domain.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
            />
          </div>

          {isRegistering && role === 'EMPLOYER' && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Company Name
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="input-field"
              />
            </div>
          )}

          {isRegistering && role === 'CANDIDATE' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 font-bold text-sm mt-2"
          >
            {loading ? 'Authenticating...' : isRegistering ? `Register ${role} Profile` : 'Sign In'}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-gray-200 text-center text-sm text-gray-500 font-medium">
          {isRegistering ? 'Already have an account?' : 'Need a split-entity account?'}
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="ml-1.5 font-bold text-blue-600 hover:text-blue-700 hover:underline"
          >
            {isRegistering ? 'Sign In' : 'Create Account'}
          </button>
        </div>

      </div>
    </div>
  );
};

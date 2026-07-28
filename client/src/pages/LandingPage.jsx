import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

export const LandingPage = ({ user, onExploreSearch, onExploreAiStudio, onOpenAuth }) => {
  return (
    <div className="max-w-[1128px] mx-auto px-4 py-12 space-y-8">
      
      {/* Modern SaaS Hero Section */}
      <section className="saas-card overflow-hidden">
        {/* Banner */}
        <div className="h-40 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600" />
        
        <div className="px-8 pb-12 -mt-12 relative z-10 text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-white rounded-2xl shadow-md border border-gray-100 flex items-center justify-center p-2 mb-2">
            <div className="w-full h-full bg-blue-600 rounded-xl text-white flex items-center justify-center font-extrabold text-3xl tracking-tighter shadow-inner">
              SB
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight max-w-4xl mx-auto">
            AI-Powered <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Job Platform</span>
          </h1>

          <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Signal Board is a two-sided job board built on React, Express, Neon PostgreSQL, and the Gemini API. Employers draft job descriptions with AI assist; candidates search with plain-language queries.
          </p>

          {/* Interactive Call to Actions */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onExploreSearch}
              className="w-full sm:w-auto btn-primary py-3 px-8 shadow-sm flex items-center justify-center gap-2"
            >
              <span>Try AI Smart Search</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {(!user || user.role === 'EMPLOYER') && (
              <button
                onClick={onExploreAiStudio}
                className="w-full sm:w-auto btn-secondary py-3 px-8 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Employer AI Job Studio</span>
              </button>
            )}
          </div>
        </div>
      </section>





    </div>
  );
};

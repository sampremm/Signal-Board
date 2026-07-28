import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

export const LandingPage = ({ user, onExploreSearch, onExploreAiStudio, onOpenAuth }) => {
  return (
    <div className="max-w-[1128px] mx-auto px-4 py-8 space-y-8">
      
      {/* LinkedIn Style Hero Section */}
      <section className="linkedin-card overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-[#0A66C2] via-[#004182] to-[#0A66C2]" />
        
        <div className="px-8 pb-10 -mt-10 relative z-10 text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-white rounded-lg shadow-sm border border-[#DBDBDB] flex items-center justify-center p-2 mb-2">
            <div className="w-full h-full bg-[#0A66C2] rounded text-white flex items-center justify-center font-extrabold text-2xl tracking-tighter">
              SB
            </div>
          </div>
          


          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#191919] tracking-tight leading-tight max-w-3xl mx-auto">
            AI-Powered <br />
            <span className="text-[#0A66C2]">Job Platform</span>
          </h1>

          <p className="text-sm sm:text-base text-[#666666] max-w-2xl mx-auto leading-relaxed">
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

/**
 * LoadingState — animated loading display shown during research.
 * Styled with the Stitch "Field Ledger" aesthetic.
 */

import { useState, useEffect } from 'react';

const RESEARCH_STAGES = [
  { label: 'Fetching financial data…', icon: 'monitoring' },
  { label: 'Scanning recent news…', icon: 'newspaper' },
  { label: 'Analyzing competitive position…', icon: 'emoji_events' },
  { label: 'Reviewing management signals…', icon: 'business_center' },
  { label: 'Synthesizing investment verdict…', icon: 'psychology' },
];

export default function LoadingState() {
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStage((prev) => {
        if (prev >= RESEARCH_STAGES.length - 1) return prev;
        return prev + 1;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div id="loading-state" className="w-full max-w-2xl mx-auto animate-fade-in">
      <div className="ledger-card p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-2 w-2 bg-secondary rounded-full animate-pulse" />
          <h2 className="font-serif text-headline-sm text-primary">Research in Progress</h2>
        </div>

        <div className="space-y-2">
          {RESEARCH_STAGES.map((stage, index) => {
            const isActive = index === activeStage;
            const isComplete = index < activeStage;
            const isPending = index > activeStage;

            return (
              <div
                key={stage.label}
                className={`flex items-center gap-3 px-4 py-3 transition-all duration-500 ${
                  isActive
                    ? 'bg-secondary/5 border border-secondary/20'
                    : isComplete
                    ? 'bg-invest/5 border border-transparent'
                    : 'border border-transparent opacity-40'
                }`}
              >
                <span className={`material-symbols-outlined text-xl ${
                  isComplete ? 'text-invest' : isActive ? 'text-secondary' : 'text-[#424846]'
                }`}>
                  {isComplete ? 'check_circle' : stage.icon}
                </span>
                <span className={`text-body-md font-medium ${
                  isActive ? 'text-secondary' : isComplete ? 'text-invest' : 'text-[#424846]'
                }`}>
                  {stage.label}
                </span>
                {isActive && (
                  <div className="ml-auto">
                    <div className="h-1.5 w-16 rounded-full shimmer-bg" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-body-md text-[#424846] opacity-60 text-center">
          This typically takes 15–30 seconds due to multiple AI analysis steps.
        </p>
      </div>
    </div>
  );
}

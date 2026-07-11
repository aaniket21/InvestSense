/**
 * LoadingState — animated loading display shown during research.
 * Per PRD §5: show progress per signal being researched.
 * Since we can't stream individual node progress from the backend,
 * we simulate the stages with timed animations.
 */

import { useState, useEffect } from 'react';

const RESEARCH_STAGES = [
  { label: 'Fetching financial data…', icon: '📊' },
  { label: 'Scanning recent news…', icon: '📰' },
  { label: 'Analyzing competitive position…', icon: '🏆' },
  { label: 'Reviewing management signals…', icon: '👔' },
  { label: 'Synthesizing investment verdict…', icon: '🧠' },
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
      <div className="glass-card p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-2 w-2 bg-brand-500 rounded-full animate-pulse" />
          <h2 className="text-lg font-semibold text-white">Research in Progress</h2>
        </div>

        <div className="space-y-3">
          {RESEARCH_STAGES.map((stage, index) => {
            const isActive = index === activeStage;
            const isComplete = index < activeStage;
            const isPending = index > activeStage;

            return (
              <div
                key={stage.label}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500 ${
                  isActive
                    ? 'bg-brand-500/10 border border-brand-500/20'
                    : isComplete
                    ? 'bg-invest/5 border border-transparent'
                    : 'border border-transparent opacity-40'
                }`}
              >
                <span className="text-xl w-8 text-center">
                  {isComplete ? '✅' : stage.icon}
                </span>
                <span className={`text-sm font-medium ${
                  isActive ? 'text-brand-300' : isComplete ? 'text-invest' : 'text-gray-500'
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

        <p className="mt-6 text-xs text-gray-500 text-center">
          This typically takes 15–30 seconds due to multiple AI analysis steps.
        </p>
      </div>
    </div>
  );
}

/**
 * SignalCard — expandable card for a single research signal.
 * Per PRD §5: per-signal breakdown with expandable cards for
 * financial/news/competition/management.
 */

import { useState } from 'react';

const SIGNAL_ICONS = {
  'Financial Health': '📊',
  'Recent News & Sentiment': '📰',
  'Competitive Position': '🏆',
  'Management & Strategy': '👔',
};

export default function SignalCard({ signal, delay = 0 }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!signal) return null;

  const icon = SIGNAL_ICONS[signal.signalName] || '📋';
  const verdictClass = `signal-${signal.verdict}`;

  return (
    <div
      id={`signal-${signal.signalName.toLowerCase().replace(/[^a-z]/g, '-')}`}
      className="glass-card-hover overflow-hidden animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center gap-4 text-left"
        aria-expanded={isExpanded}
      >
        <span className="text-2xl">{icon}</span>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white">{signal.signalName}</h3>
          <p className="text-xs text-gray-400 truncate mt-0.5">{signal.summary}</p>
        </div>

        <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${
          signal.verdict === 'positive' ? 'verdict-invest' :
          signal.verdict === 'negative' ? 'verdict-pass' :
          'verdict-watch'
        }`}>
          {signal.verdict}
        </span>

        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="px-5 pb-5 pt-1 border-t border-white/5">
          <p className="text-sm text-gray-300 mb-3">{signal.summary}</p>

          {signal.evidence && signal.evidence.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Evidence</h4>
              <ul className="space-y-1.5">
                {signal.evidence.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      signal.verdict === 'positive' ? 'bg-invest' :
                      signal.verdict === 'negative' ? 'bg-pass' :
                      'bg-watch'
                    }`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

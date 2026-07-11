/**
 * SignalCard — expandable card for a single research signal.
 * Styled with the Stitch "Field Ledger" aesthetic:
 * white card, hairline borders, material icons, label-caps headers.
 */

import { useState } from 'react';

const SIGNAL_ICONS = {
  'Financial Health': 'monitoring',
  'Recent News & Sentiment': 'newspaper',
  'Competitive Position': 'emoji_events',
  'Management & Strategy': 'business_center',
};

export default function SignalCard({ signal, delay = 0 }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!signal) return null;

  const icon = SIGNAL_ICONS[signal.signalName] || 'description';

  return (
    <div
      id={`signal-${signal.signalName.toLowerCase().replace(/[^a-z]/g, '-')}`}
      className="ledger-card-hover overflow-hidden animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center gap-4 text-left"
        aria-expanded={isExpanded}
      >
        <span className="material-symbols-outlined text-2xl text-[#424846]">{icon}</span>

        <div className="flex-1 min-w-0">
          <h3 className="text-body-md font-semibold text-primary">{signal.signalName}</h3>
          <p className="text-body-md text-[#424846] truncate mt-0.5 opacity-70">{signal.summary}</p>
        </div>

        <span className={`px-3 py-1 text-label-caps font-bold uppercase border ${
          signal.verdict === 'positive' ? 'verdict-invest' :
          signal.verdict === 'negative' ? 'verdict-pass' :
          'verdict-watch'
        }`}>
          {signal.verdict}
        </span>

        <span className={`material-symbols-outlined text-[#424846] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="px-5 pb-5 pt-1 border-t border-[#D4D9CC]">
          <p className="text-body-md text-[#1B1C1B] mb-4">{signal.summary}</p>

          {signal.evidence && signal.evidence.length > 0 && (
            <div className="space-y-2">
              <h4 className="label-caps">Evidence</h4>
              <ul className="space-y-2">
                {signal.evidence.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-body-md text-[#424846]">
                    <span className={`mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
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

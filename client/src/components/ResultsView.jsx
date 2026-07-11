/**
 * ResultsView — full research results display.
 * Per PRD §5: verdict badge, confidence meter, reasoning list,
 * per-signal breakdown (expandable cards).
 */

import VerdictBadge from './VerdictBadge';
import SignalCard from './SignalCard';

export default function ResultsView({ result, onNewSearch }) {
  if (!result) return null;

  const { companyName, finalVerdict, financialSummary, newsSummary, competitionSummary, managementSummary, errors } = result;

  const signals = [financialSummary, newsSummary, competitionSummary, managementSummary].filter(Boolean);

  return (
    <div id="results-view" className="w-full max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">
          Research Report
        </h2>
        <p className="text-lg gradient-text font-semibold">{companyName}</p>
      </div>

      {/* Verdict */}
      {finalVerdict && (
        <div className="flex justify-center">
          <VerdictBadge verdict={finalVerdict} />
        </div>
      )}

      {/* Reasoning */}
      {finalVerdict && finalVerdict.reasoning && finalVerdict.reasoning.length > 0 && (
        <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Key Reasoning
          </h3>
          <ul className="space-y-2">
            {finalVerdict.reasoning.map((reason, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-200">
                <span className="mt-0.5 text-brand-400 font-bold text-xs">{i + 1}.</span>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risks */}
      {finalVerdict && finalVerdict.risks && finalVerdict.risks.length > 0 && (
        <div className="glass-card p-6 border-pass/10 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <h3 className="text-sm font-semibold text-pass/80 uppercase tracking-wider mb-3">
            ⚠️ Key Risks
          </h3>
          <ul className="space-y-2">
            {finalVerdict.risks.map((risk, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-pass flex-shrink-0" />
                {risk}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Signal Breakdown */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider px-1">
          Signal Breakdown
        </h3>
        {signals.map((signal, i) => (
          <SignalCard key={signal.signalName} signal={signal} delay={400 + i * 100} />
        ))}
      </div>

      {/* Errors */}
      {errors && errors.length > 0 && (
        <div className="glass-card p-4 border-watch/20 animate-slide-up">
          <h3 className="text-xs font-semibold text-watch uppercase tracking-wider mb-2">
            Data Collection Issues
          </h3>
          <ul className="space-y-1">
            {errors.map((error, i) => (
              <li key={i} className="text-xs text-gray-400">• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* New Search Button */}
      <div className="flex justify-center pt-2">
        <button
          id="new-search"
          onClick={onNewSearch}
          className="px-6 py-2.5 text-sm font-medium text-brand-400 border border-brand-500/30 rounded-xl hover:bg-brand-500/10 transition-all duration-200"
        >
          ← Research Another Company
        </button>
      </div>
    </div>
  );
}

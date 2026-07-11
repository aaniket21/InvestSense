/**
 * ResultsView — full research results display.
 * Styled with the Stitch "Field Ledger" aesthetic:
 * serif headings, white cards, muted academic tones.
 */

import VerdictBadge from './VerdictBadge';
import SignalCard from './SignalCard';

export default function ResultsView({ result, onNewSearch }) {
  if (!result) return null;

  const { companyName, finalVerdict, financialSummary, newsSummary, competitionSummary, managementSummary, errors } = result;

  const signals = [financialSummary, newsSummary, competitionSummary, managementSummary].filter(Boolean);
  const companyProfile = finalVerdict?.companyProfile;

  return (
    <div id="results-view" className="w-full max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-left space-y-2">
        <h2 className="font-serif text-display-lg text-primary">
          Research Report
        </h2>
        <p className="text-body-lg text-secondary font-medium italic">{companyName}</p>
        {companyProfile && (
          <p className="text-body-md text-[#424846] mt-2 border-l-2 border-secondary/30 pl-4 py-1 italic opacity-80">
            {companyProfile}
          </p>
        )}
      </div>

      {/* Verdict */}
      {finalVerdict && (
        <div className="ledger-card p-10 flex justify-center">
          <VerdictBadge verdict={finalVerdict} />
        </div>
      )}

      {/* Reasoning */}
      {finalVerdict && finalVerdict.reasoning && finalVerdict.reasoning.length > 0 && (
        <div className="ledger-card p-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <h3 className="label-caps mb-4">
            Key Reasoning
          </h3>
          <ul className="space-y-3">
            {finalVerdict.reasoning.map((reason, i) => (
              <li key={i} className="flex items-start gap-3 text-body-md text-[#1B1C1B]">
                <span className="mt-0.5 text-secondary font-bold text-mono-data">{i + 1}.</span>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risks */}
      {finalVerdict && finalVerdict.risks && finalVerdict.risks.length > 0 && (
        <div className="ledger-card p-8 border-pass/20 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <h3 className="label-caps text-pass mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">warning</span>
            Key Risks
          </h3>
          <ul className="space-y-3">
            {finalVerdict.risks.map((risk, i) => (
              <li key={i} className="flex items-start gap-3 text-body-md text-[#424846]">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-pass flex-shrink-0" />
                {risk}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Signal Breakdown */}
      <div className="space-y-3">
        <h3 className="label-caps px-1">
          Signal Breakdown
        </h3>
        {signals.map((signal, i) => (
          <SignalCard key={signal.signalName} signal={signal} delay={400 + i * 100} />
        ))}
      </div>

      {/* Errors */}
      {errors && errors.length > 0 && (
        <div className="ledger-card p-6 border-watch/30 animate-slide-up">
          <h3 className="label-caps text-watch mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">info</span>
            Data Collection Issues
          </h3>
          <ul className="space-y-1">
            {errors.map((error, i) => (
              <li key={i} className="text-body-md text-[#424846]">• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* New Search Button */}
      <div className="flex justify-center pt-4">
        <button
          id="new-search"
          onClick={onNewSearch}
          className="flex items-center gap-2 px-6 py-3 label-caps text-secondary border border-secondary/30 hover:bg-secondary/5 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Research Another Company
        </button>
      </div>
    </div>
  );
}

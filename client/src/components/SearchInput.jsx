/**
 * SearchInput — company search form with ticker field.
 * Per PRD §5: simple search box + submit.
 */

import { useState } from 'react';

export default function SearchInput({ onSearch, isLoading }) {
  const [companyName, setCompanyName] = useState('');
  const [ticker, setTicker] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = companyName.trim();
    if (!trimmed) return;
    onSearch(trimmed, ticker.trim());
  }

  return (
    <form onSubmit={handleSubmit} id="search-form" className="w-full max-w-2xl mx-auto">
      <div className="glass-card p-6 space-y-4">
        <div className="space-y-2">
          <label htmlFor="company-name" className="block text-sm font-medium text-gray-300">
            Company Name
          </label>
          <input
            id="company-name"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Apple Inc, Reliance Industries"
            disabled={isLoading}
            className="w-full px-4 py-3 bg-surface-800 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all duration-200 disabled:opacity-50"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="ticker-symbol" className="block text-sm font-medium text-gray-300">
            Ticker Symbol <span className="text-gray-500">(optional)</span>
          </label>
          <input
            id="ticker-symbol"
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="e.g. AAPL, RELIANCE.BSE"
            disabled={isLoading}
            className="w-full px-4 py-3 bg-surface-800 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all duration-200 disabled:opacity-50 uppercase"
          />
        </div>

        <button
          type="submit"
          id="submit-research"
          disabled={isLoading || !companyName.trim()}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-brand-600 to-brand-500 text-white font-semibold rounded-xl transition-all duration-300 hover:from-brand-500 hover:to-brand-400 hover:shadow-lg hover:shadow-brand-500/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none active:scale-[0.98]"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Researching…
            </span>
          ) : (
            'Analyze Company'
          )}
        </button>
      </div>

      <p className="mt-3 text-xs text-gray-500 text-center">
        ⚠️ This is a decision-support tool, not financial advice. Always do your own research.
      </p>
    </form>
  );
}

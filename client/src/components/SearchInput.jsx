/**
 * SearchInput — company search form with ticker field.
 * Styled with the Stitch "Field Ledger" aesthetic:
 * white container, hairline borders, sharp corners, label-caps labels.
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
      {/* White ledger container */}
      <div className="bg-white border border-[#D4D9CC] p-10 md:p-14">
        <div className="space-y-8">
          {/* Company Name field */}
          <div className="space-y-2">
            <label htmlFor="company-name" className="label-caps block">
              Company Name <span className="text-error">*</span>
            </label>
            <input
              id="company-name"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Corp"
              required
              disabled={isLoading}
              className="w-full bg-white border border-[#D4D9CC] px-4 py-4 text-body-md text-primary focus:border-primary focus:outline-none transition-all disabled:opacity-50"
            />
          </div>

          {/* Ticker Symbol field */}
          <div className="space-y-2">
            <label htmlFor="ticker-symbol" className="label-caps block">
              Ticker Symbol <span className="text-xs normal-case italic opacity-60">(Optional)</span>
            </label>
            <input
              id="ticker-symbol"
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="e.g. ACM"
              disabled={isLoading}
              className="w-full bg-white border border-[#D4D9CC] px-4 py-4 text-body-md text-primary focus:border-primary focus:outline-none transition-all disabled:opacity-50 uppercase"
            />
          </div>

          {/* CTA Button */}
          <div className="pt-4">
            <button
              type="submit"
              id="submit-research"
              disabled={isLoading || !companyName.trim()}
              className="group flex items-center justify-center gap-3 bg-secondary text-white px-8 py-4 label-caps uppercase tracking-widest transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <span>Processing...</span>
                  <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                </>
              ) : (
                <>
                  <span>Analyze Now</span>
                  <span className="material-symbols-outlined text-[18px]">query_stats</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Academic footnote */}
      <div className="mt-8 flex items-start gap-4 opacity-60">
        <span className="material-symbols-outlined text-[16px] mt-1">info</span>
        <p className="text-body-md max-w-lg">
          Data models utilize proprietary sentiment analysis and historical fundamental data.
          Please ensure the company name is precise for optimal research synthesis.
        </p>
      </div>
    </form>
  );
}

/**
 * App — root component for InvestSense.
 * Manages the three app states: idle (search), loading, results.
 * Styled with the Stitch "Field Ledger" aesthetic.
 */

import { useState } from 'react';
import SearchInput from './components/SearchInput';
import LoadingState from './components/LoadingState';
import ResultsView from './components/ResultsView';
import { fetchResearch } from './api';

function App() {
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'results' | 'error'
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function handleSearch(companyName, ticker) {
    setStatus('loading');
    setError('');
    setResult(null);

    try {
      const data = await fetchResearch(companyName, ticker);
      setResult(data);
      setStatus('results');
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
      setStatus('error');
    }
  }

  function handleNewSearch() {
    setStatus('idle');
    setResult(null);
    setError('');
  }

  return (
    <div className="min-h-screen bg-[#EDF1EA]">
      {/* Header Navigation */}
      <header className="w-full px-gutter max-w-[1120px] mx-auto h-16 flex justify-between items-center border-b border-[#C2C8C5]">
        <div className="flex items-center gap-4">
          {/* <span className="material-symbols-outlined text-primary text-2xl">menu</span> */}
          <h1 className="font-serif text-headline-md font-medium text-primary">InvestSense</h1>
        </div>
        {/* <nav className="hidden md:flex items-center gap-8">
          <a href="#" className="label-caps font-bold text-primary">Research</a>
          <a href="#" className="label-caps text-[#424846] hover:text-primary transition-colors">Watchlist</a>
          <a href="#" className="label-caps text-[#424846] hover:text-primary transition-colors">Portfolio</a>
        </nav> */}
      </header>

      {/* Main Content */}
      <main className="min-h-[80vh] flex items-center py-20 px-gutter">
        <div className="w-full max-w-2xl mx-auto">
          {status === 'idle' && (
            <div className="animate-fade-in">
              {/* Hero Title */}
              <div className="mb-12 text-left">
                <h2 className="font-serif text-display-lg text-primary mb-2">InvestSense</h2>
                <p className="text-body-lg text-[#424846] opacity-80 italic">
                  AI-Driven Investment Analysis
                </p>
              </div>
              <SearchInput onSearch={handleSearch} isLoading={false} />
            </div>
          )}

          {status === 'loading' && (
            <div className="space-y-8">
              <SearchInput onSearch={handleSearch} isLoading={true} />
              <LoadingState />
            </div>
          )}

          {status === 'results' && (
            <ResultsView result={result} onNewSearch={handleNewSearch} />
          )}

          {status === 'error' && (
            <div className="space-y-8 animate-fade-in">
              <SearchInput onSearch={handleSearch} isLoading={false} />
              <div className="ledger-card p-8 border-pass/30 text-center">
                <span className="material-symbols-outlined text-4xl text-pass mb-3">error</span>
                <h3 className="font-serif text-headline-sm text-pass mb-2">Research Failed</h3>
                <p className="text-body-md text-[#424846]">{error}</p>
                <button
                  onClick={handleNewSearch}
                  className="mt-6 px-6 py-2.5 label-caps text-secondary border border-secondary/30 hover:bg-secondary/5 transition-all"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-[#C2C8C5]">
        <p className="text-body-md text-[#424846] opacity-60">
          Built with LangGraph.js + Gemini • Not financial advice
        </p>
      </footer>
    </div>
  );
}

export default App;

/**
 * App — root component for InvestSense.
 * Manages the three app states: idle (search), loading, results.
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
    <div className="min-h-screen bg-surface-900 relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-80 h-80 bg-brand-700/8 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="py-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-300 rounded-lg flex items-center justify-center text-sm font-bold text-surface-900">
              IS
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Invest<span className="gradient-text">Sense</span>
            </h1>
          </div>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            AI-powered investment research agent. Get evidence-backed Invest&nbsp;/&nbsp;Pass&nbsp;/&nbsp;Watch decisions in seconds.
          </p>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-start justify-center px-4 pb-12">
          <div className="w-full max-w-3xl pt-4">
            {status === 'idle' && (
              <div className="animate-fade-in">
                <SearchInput onSearch={handleSearch} isLoading={false} />
              </div>
            )}

            {status === 'loading' && (
              <div className="space-y-6">
                <SearchInput onSearch={handleSearch} isLoading={true} />
                <LoadingState />
              </div>
            )}

            {status === 'results' && (
              <ResultsView result={result} onNewSearch={handleNewSearch} />
            )}

            {status === 'error' && (
              <div className="space-y-6 animate-fade-in">
                <SearchInput onSearch={handleSearch} isLoading={false} />
                <div className="glass-card p-6 border-pass/20 text-center">
                  <div className="text-3xl mb-3">❌</div>
                  <h3 className="text-lg font-semibold text-pass mb-2">Research Failed</h3>
                  <p className="text-sm text-gray-400">{error}</p>
                  <button
                    onClick={handleNewSearch}
                    className="mt-4 px-4 py-2 text-sm text-brand-400 border border-brand-500/30 rounded-xl hover:bg-brand-500/10 transition-all"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="py-6 text-center">
          <p className="text-xs text-gray-600">
            Built with LangGraph.js + Gemini • Not financial advice
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;

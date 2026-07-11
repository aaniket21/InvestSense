/**
 * API client for the InvestSense backend.
 * Communicates with the Express server's /api/research endpoint.
 */

const API_BASE = import.meta.env.VITE_API_BASE || '';

/**
 * Sends a research request for a company.
 *
 * @param {string} companyName - Company name to research
 * @param {string} [ticker] - Optional stock ticker
 * @returns {Promise<object>} Research results
 */
export async function fetchResearch(companyName, ticker = '') {
  const response = await fetch(`${API_BASE}/api/research`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ companyName, ticker }),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Research request failed');
  }

  return data.data;
}

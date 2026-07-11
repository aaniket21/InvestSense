/**
 * Financial data fetcher — Alpha Vantage API integration.
 *
 * Fetches company overview (fundamentals) and income statement data,
 * then normalizes into a structured shape for the LangGraph agent.
 *
 * Per PRD §4 Signal #1: Financial health — revenue growth trend,
 * margin trend, debt levels.
 */

const BASE_URL = 'https://www.alphavantage.co/query';

/**
 * Fetches the company overview from Alpha Vantage.
 * Contains fundamentals like market cap, PE ratio, profit margin, etc.
 *
 * @param {string} ticker - Stock ticker symbol (e.g. "AAPL")
 * @param {string} apiKey - Alpha Vantage API key
 * @returns {Promise<object>} Raw company overview data
 */
async function fetchCompanyOverview(ticker, apiKey) {
  const url = `${BASE_URL}?function=OVERVIEW&symbol=${encodeURIComponent(ticker)}&apikey=${apiKey}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Alpha Vantage API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data['Error Message']) {
    throw new Error(`Alpha Vantage error: ${data['Error Message']}`);
  }

  if (data['Note']) {
    throw new Error(`Alpha Vantage rate limit: ${data['Note']}`);
  }

  if (!data.Symbol) {
    throw new Error(`No data found for ticker: ${ticker}`);
  }

  return data;
}

/**
 * Fetches the annual income statement from Alpha Vantage.
 * Contains revenue, net income, gross profit, etc. over multiple years.
 *
 * @param {string} ticker - Stock ticker symbol
 * @param {string} apiKey - Alpha Vantage API key
 * @returns {Promise<object>} Raw income statement data
 */
async function fetchIncomeStatement(ticker, apiKey) {
  const url = `${BASE_URL}?function=INCOME_STATEMENT&symbol=${encodeURIComponent(ticker)}&apikey=${apiKey}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Alpha Vantage API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data['Error Message']) {
    throw new Error(`Alpha Vantage error: ${data['Error Message']}`);
  }

  if (data['Note']) {
    throw new Error(`Alpha Vantage rate limit: ${data['Note']}`);
  }

  if (!data.annualReports || data.annualReports.length === 0) {
    throw new Error(`No income statement data found for ticker: ${ticker}`);
  }

  return data;
}

/**
 * Calculates year-over-year growth rate between two numeric values.
 *
 * @param {number} current - Current period value
 * @param {number} previous - Previous period value
 * @returns {number|null} Growth rate as a decimal (e.g. 0.15 = 15%), or null if previous is 0
 */
function calculateGrowthRate(current, previous) {
  if (previous === 0) {
    return null;
  }
  return (current - previous) / Math.abs(previous);
}

/**
 * Normalizes raw Alpha Vantage data into a structured financial summary.
 *
 * @param {object} overview - Raw company overview data
 * @param {object} incomeStatement - Raw income statement data
 * @returns {object} Normalized financial data
 */
function normalizeFinancialData(overview, incomeStatement) {
  const annualReports = incomeStatement.annualReports || [];

  const revenueHistory = annualReports.slice(0, 5).map((report) => ({
    year: report.fiscalDateEnding.substring(0, 4),
    revenue: parseFloat(report.totalRevenue) || 0,
    netIncome: parseFloat(report.netIncome) || 0,
    grossProfit: parseFloat(report.grossProfit) || 0,
  }));

  const revenueGrowthRates = [];
  for (let i = 0; i < revenueHistory.length - 1; i++) {
    const rate = calculateGrowthRate(
      revenueHistory[i].revenue,
      revenueHistory[i + 1].revenue
    );
    revenueGrowthRates.push({
      period: `${revenueHistory[i].year} vs ${revenueHistory[i + 1].year}`,
      rate,
    });
  }

  const latestRevenue = revenueHistory.length > 0 ? revenueHistory[0].revenue : 0;
  const latestGrossProfit = revenueHistory.length > 0 ? revenueHistory[0].grossProfit : 0;
  const grossMargin = latestRevenue > 0 ? latestGrossProfit / latestRevenue : null;

  return {
    ticker: overview.Symbol,
    companyName: overview.Name,
    sector: overview.Sector,
    industry: overview.Industry,
    marketCap: parseFloat(overview.MarketCapitalization) || null,
    peRatio: parseFloat(overview.PERatio) || null,
    profitMargin: parseFloat(overview.ProfitMargin) || null,
    returnOnEquity: parseFloat(overview.ReturnOnEquityTTM) || null,
    debtToEquity: parseFloat(overview.DebtToEquityRatio) || null,
    currentRatio: parseFloat(overview.CurrentRatio) || null,
    dividendYield: parseFloat(overview.DividendYield) || null,
    grossMargin,
    revenueHistory,
    revenueGrowthRates,
  };
}

/**
 * Main entry point: fetches and normalizes financial data for a ticker.
 *
 * @param {string} ticker - Stock ticker symbol
 * @param {string} [apiKey] - Alpha Vantage API key (defaults to env var)
 * @returns {Promise<object>} Normalized financial data
 */
async function getFinancialData(ticker, apiKey) {
  const key = apiKey || process.env.ALPHA_VANTAGE_API_KEY;

  if (!key) {
    throw new Error('ALPHA_VANTAGE_API_KEY is required');
  }

  const [overview, incomeStatement] = await Promise.all([
    fetchCompanyOverview(ticker, key),
    fetchIncomeStatement(ticker, key),
  ]);

  return normalizeFinancialData(overview, incomeStatement);
}

module.exports = {
  fetchCompanyOverview,
  fetchIncomeStatement,
  calculateGrowthRate,
  normalizeFinancialData,
  getFinancialData,
};

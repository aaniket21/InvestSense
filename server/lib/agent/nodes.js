/**
 * Signal nodes — 4 research nodes + 1 data-fetching node.
 *
 * Each signal node takes the agent state, uses an LLM to analyze
 * one research dimension, and returns a structured SignalResult.
 *
 * Per PRD §5: financial_node, news_node, competition_node,
 * management_node, plus a data_fetch_node for raw data retrieval.
 */

const { createLlm, callLlmWithSchema } = require('./llm');
const { SignalResultSchema } = require('./schemas');

/**
 * Fetches raw data from external APIs (Alpha Vantage, Tavily).
 * Runs before signal nodes so they have data to analyze.
 *
 * @param {object} state - Agent state
 * @returns {object} Updated state with raw data
 */
async function dataFetchNode(state) {
  try {
    const { getFinancialData } = require('../dataSources/financials');
    const { getNewsData } = require('../dataSources/news');

    const [financialData, newsData] = await Promise.allSettled([
      getFinancialData(state.ticker),
      getNewsData(state.companyName),
    ]);

    const result = { errors: [] };

    if (financialData.status === 'fulfilled') {
      result.financialData = financialData.value;
    } else {
      result.errors = [`Financial data fetch failed: ${financialData.reason.message}`];
    }

    if (newsData.status === 'fulfilled') {
      result.newsData = newsData.value;
    } else {
      result.errors = [
        ...result.errors,
        `News data fetch failed: ${newsData.reason.message}`,
      ];
    }

    return result;
  } catch (error) {
    return {
      errors: [`Data fetch node error: ${error.message}`],
    };
  }
}

/**
 * Builds a prompt string from financial data for LLM analysis.
 *
 * @param {string} companyName - Company name
 * @param {object} data - Normalized financial data
 * @returns {string} Formatted prompt
 */
function buildFinancialPrompt(companyName, data) {
  const lines = [
    `Analyze the financial health of ${companyName} based on the following data.`,
    '',
    `Sector: ${data.sector || 'Unknown'}`,
    `Industry: ${data.industry || 'Unknown'}`,
    `Market Cap: ${data.marketCap ? '$' + (data.marketCap / 1e9).toFixed(1) + 'B' : 'N/A'}`,
    `P/E Ratio: ${data.peRatio ?? 'N/A'}`,
    `Profit Margin: ${data.profitMargin != null ? (data.profitMargin * 100).toFixed(1) + '%' : 'N/A'}`,
    `Gross Margin: ${data.grossMargin != null ? (data.grossMargin * 100).toFixed(1) + '%' : 'N/A'}`,
    `Debt-to-Equity: ${data.debtToEquity ?? 'N/A'}`,
    `Return on Equity: ${data.returnOnEquity ?? 'N/A'}`,
    `Current Ratio: ${data.currentRatio ?? 'N/A'}`,
    '',
  ];

  if (data.revenueGrowthRates && data.revenueGrowthRates.length > 0) {
    lines.push('Revenue Growth:');
    for (const rate of data.revenueGrowthRates) {
      const pct = rate.rate != null ? (rate.rate * 100).toFixed(1) + '%' : 'N/A';
      lines.push(`  ${rate.period}: ${pct}`);
    }
    lines.push('');
  }

  if (data.revenueHistory && data.revenueHistory.length > 0) {
    lines.push('Revenue History:');
    for (const year of data.revenueHistory) {
      lines.push(`  ${year.year}: Revenue $${(year.revenue / 1e9).toFixed(1)}B, Net Income $${(year.netIncome / 1e9).toFixed(1)}B`);
    }
    lines.push('');
  }

  lines.push('Provide your analysis as a SignalResult with:');
  lines.push('- signalName: "Financial Health"');
  lines.push('- summary: a concise 2-3 sentence analysis');
  lines.push('- verdict: "positive", "neutral", or "negative"');
  lines.push('- evidence: an array of 3-5 specific data-backed observations');

  return lines.join('\n');
}

/**
 * Builds a prompt from news articles for LLM sentiment analysis.
 *
 * @param {string} companyName - Company name
 * @param {object} newsData - Normalized news data
 * @returns {string} Formatted prompt
 */
function buildNewsPrompt(companyName, newsData) {
  const lines = [
    `Analyze the recent news sentiment for ${companyName} based on the following articles.`,
    '',
  ];

  if (newsData.answer) {
    lines.push(`Summary: ${newsData.answer}`);
    lines.push('');
  }

  const articles = newsData.articles || [];
  for (let i = 0; i < Math.min(articles.length, 10); i++) {
    const article = articles[i];
    lines.push(`Article ${i + 1}: ${article.title}`);
    if (article.content) {
      lines.push(`  ${article.content.substring(0, 300)}`);
    }
    lines.push('');
  }

  lines.push('Provide your analysis as a SignalResult with:');
  lines.push('- signalName: "Recent News & Sentiment"');
  lines.push('- summary: a concise 2-3 sentence sentiment analysis');
  lines.push('- verdict: "positive", "neutral", or "negative"');
  lines.push('- evidence: an array of 3-5 specific observations from the articles');

  return lines.join('\n');
}

/**
 * Builds a prompt for competitive position analysis.
 *
 * @param {string} companyName - Company name
 * @param {object|null} financialData - Financial data (may be null)
 * @param {object|null} newsData - News data (may be null)
 * @returns {string} Formatted prompt
 */
function buildCompetitionPrompt(companyName, financialData, newsData) {
  const lines = [
    `Analyze the competitive position of ${companyName}.`,
    '',
  ];

  if (financialData) {
    lines.push(`Sector: ${financialData.sector || 'Unknown'}`);
    lines.push(`Industry: ${financialData.industry || 'Unknown'}`);
    if (financialData.marketCap) {
      lines.push(`Market Cap: $${(financialData.marketCap / 1e9).toFixed(1)}B`);
    }
    lines.push('');
  }

  if (newsData && newsData.articles) {
    lines.push('Recent news context:');
    for (const article of newsData.articles.slice(0, 5)) {
      lines.push(`- ${article.title}`);
    }
    lines.push('');
  }

  lines.push('Based on your knowledge of this company, identify:');
  lines.push('1. The 2-3 main competitors');
  lines.push('2. Whether the company is gaining or losing market share');
  lines.push('3. Key competitive advantages or disadvantages');
  lines.push('');
  lines.push('Provide your analysis as a SignalResult with:');
  lines.push('- signalName: "Competitive Position"');
  lines.push('- summary: a concise 2-3 sentence competitive analysis');
  lines.push('- verdict: "positive", "neutral", or "negative"');
  lines.push('- evidence: an array of 3-5 specific competitive observations');

  return lines.join('\n');
}

/**
 * Builds a prompt for management commentary analysis.
 *
 * @param {string} companyName - Company name
 * @param {object} managementNews - Normalized news data about management
 * @returns {string} Formatted prompt
 */
function buildManagementPrompt(companyName, managementNews) {
  const lines = [
    `Analyze recent management commentary and strategy signals for ${companyName}.`,
    '',
  ];

  const articles = managementNews.articles || [];
  for (let i = 0; i < Math.min(articles.length, 10); i++) {
    const article = articles[i];
    lines.push(`Article ${i + 1}: ${article.title}`);
    if (article.content) {
      lines.push(`  ${article.content.substring(0, 300)}`);
    }
    lines.push('');
  }

  lines.push('Focus on:');
  lines.push('1. CEO/executive statements and guidance');
  lines.push('2. Strategic direction and forward-looking statements');
  lines.push('3. Any management changes or governance concerns');
  lines.push('');
  lines.push('Provide your analysis as a SignalResult with:');
  lines.push('- signalName: "Management & Strategy"');
  lines.push('- summary: a concise 2-3 sentence analysis of management signals');
  lines.push('- verdict: "positive", "neutral", or "negative"');
  lines.push('- evidence: an array of 3-5 specific observations about management');

  return lines.join('\n');
}

/**
 * Analyzes financial health — revenue growth, margins, debt.
 * Per PRD Signal #1.
 *
 * @param {object} state - Agent state
 * @returns {object} Updated state with financialSummary
 */
async function financialNode(state) {
  if (!state.financialData) {
    return {
      financialSummary: {
        signalName: 'Financial Health',
        summary: `No financial data available for ${state.companyName}. Unable to perform financial analysis.`,
        verdict: 'neutral',
        evidence: ['No financial data available'],
      },
    };
  }

  const llm = createLlm();
  const prompt = buildFinancialPrompt(state.companyName, state.financialData);
  const result = await callLlmWithSchema(llm, SignalResultSchema, prompt);

  return { financialSummary: result };
}

/**
 * Analyzes recent news sentiment — last 30-60 days.
 * Per PRD Signal #2.
 *
 * @param {object} state - Agent state
 * @returns {object} Updated state with newsSummary
 */
async function newsNode(state) {
  if (!state.newsData || !state.newsData.articles || state.newsData.articles.length === 0) {
    return {
      newsSummary: {
        signalName: 'Recent News & Sentiment',
        summary: `No news data available for ${state.companyName}. Unable to perform sentiment analysis.`,
        verdict: 'neutral',
        evidence: ['No news data available'],
      },
    };
  }

  const llm = createLlm();
  const prompt = buildNewsPrompt(state.companyName, state.newsData);
  const result = await callLlmWithSchema(llm, SignalResultSchema, prompt);

  return { newsSummary: result };
}

/**
 * Analyzes competitive position — main competitors, market share.
 * Per PRD Signal #3. LLM-reasoning-heavy: can reason from company name alone.
 *
 * @param {object} state - Agent state
 * @returns {object} Updated state with competitionSummary
 */
async function competitionNode(state) {
  const llm = createLlm();
  const prompt = buildCompetitionPrompt(
    state.companyName,
    state.financialData,
    state.newsData
  );
  const result = await callLlmWithSchema(llm, SignalResultSchema, prompt);

  return { competitionSummary: result };
}

/**
 * Analyzes management commentary and strategy signals.
 * Per PRD Signal #4. Fetches its own management-specific news.
 *
 * @param {object} state - Agent state
 * @returns {object} Updated state with managementSummary
 */
async function managementNode(state) {
  let managementNews;

  try {
    const { getManagementNews } = require('../dataSources/news');
    managementNews = await getManagementNews(state.companyName);
  } catch (error) {
    return {
      managementSummary: {
        signalName: 'Management & Strategy',
        summary: `Could not retrieve management news for ${state.companyName}.`,
        verdict: 'neutral',
        evidence: [`Management news fetch failed: ${error.message}`],
      },
    };
  }

  const llm = createLlm();
  const prompt = buildManagementPrompt(state.companyName, managementNews);
  const result = await callLlmWithSchema(llm, SignalResultSchema, prompt);

  return { managementSummary: result };
}

module.exports = {
  dataFetchNode,
  financialNode,
  newsNode,
  competitionNode,
  managementNode,
  // Exported for testing
  buildFinancialPrompt,
  buildNewsPrompt,
  buildCompetitionPrompt,
  buildManagementPrompt,
};

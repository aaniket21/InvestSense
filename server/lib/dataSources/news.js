/**
 * News/search data fetcher — Tavily Search API integration.
 *
 * Fetches recent news articles for a company using Tavily's
 * search API, which is designed for LLM agent use cases.
 *
 * Per PRD §4 Signal #2: Recent news & sentiment — last 30–60 days.
 * Also used by Signal #4 (management commentary) for quote extraction.
 */

const TAVILY_BASE_URL = 'https://api.tavily.com/search';

/**
 * Searches for recent news about a company using the Tavily API.
 *
 * @param {string} query - Search query (e.g. "Apple Inc recent news")
 * @param {object} [options] - Search options
 * @param {string} [options.apiKey] - Tavily API key (defaults to env var)
 * @param {number} [options.maxResults=10] - Maximum number of results
 * @param {string} [options.searchDepth='advanced'] - 'basic' or 'advanced'
 * @param {string} [options.topic='news'] - Topic filter: 'general' or 'news'
 * @returns {Promise<object>} Tavily search results
 */
async function searchNews(query, options = {}) {
  const apiKey = options.apiKey || process.env.TAVILY_API_KEY;

  if (!apiKey) {
    throw new Error('TAVILY_API_KEY is required');
  }

  const maxResults = options.maxResults || 10;
  const searchDepth = options.searchDepth || 'advanced';
  const topic = options.topic || 'news';

  const response = await fetch(TAVILY_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: maxResults,
      search_depth: searchDepth,
      topic,
      include_answer: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Tavily API error: ${response.status} — ${errorText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Normalizes raw Tavily results into a structured list of articles.
 *
 * @param {object} tavilyResponse - Raw Tavily API response
 * @returns {object} Normalized news data
 */
function normalizeNewsData(tavilyResponse) {
  const results = tavilyResponse.results || [];

  const articles = results.map((result) => ({
    title: result.title || 'Untitled',
    url: result.url || '',
    content: result.content || '',
    publishedDate: result.published_date || null,
    score: result.score || 0,
  }));

  return {
    query: tavilyResponse.query || '',
    answer: tavilyResponse.answer || null,
    articles,
    totalResults: articles.length,
  };
}

/**
 * Main entry point: fetches and normalizes news for a company.
 *
 * @param {string} companyName - Company name to search for
 * @param {object} [options] - Search options (apiKey, maxResults, etc.)
 * @returns {Promise<object>} Normalized news data
 */
async function getNewsData(companyName, options = {}) {
  const query = `${companyName} latest news financial updates`;
  const rawData = await searchNews(query, options);
  return normalizeNewsData(rawData);
}

/**
 * Fetches news specifically about management commentary and guidance.
 * Used by Signal #4 (management_node).
 *
 * @param {string} companyName - Company name
 * @param {object} [options] - Search options
 * @returns {Promise<object>} Normalized news data focused on management
 */
async function getManagementNews(companyName, options = {}) {
  const query = `${companyName} CEO management guidance earnings call statements`;
  const rawData = await searchNews(query, options);
  return normalizeNewsData(rawData);
}

module.exports = {
  searchNews,
  normalizeNewsData,
  getNewsData,
  getManagementNews,
};

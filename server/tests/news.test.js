const {
  searchNews,
  normalizeNewsData,
  getNewsData,
  getManagementNews,
} = require('../lib/dataSources/news');

// --- Unit tests for normalizeNewsData ---

describe('normalizeNewsData', () => {
  const mockTavilyResponse = {
    query: 'Apple latest news',
    answer: 'Apple reported strong earnings...',
    results: [
      {
        title: 'Apple Q4 Earnings Beat Expectations',
        url: 'https://example.com/article1',
        content: 'Apple reported revenue of $94.9 billion...',
        published_date: '2024-11-01',
        score: 0.95,
      },
      {
        title: 'Apple Launches New iPhone',
        url: 'https://example.com/article2',
        content: 'The new iPhone features...',
        published_date: '2024-09-15',
        score: 0.88,
      },
    ],
  };

  it('extracts the search query', () => {
    const result = normalizeNewsData(mockTavilyResponse);
    expect(result.query).toBe('Apple latest news');
  });

  it('extracts the answer summary', () => {
    const result = normalizeNewsData(mockTavilyResponse);
    expect(result.answer).toBe('Apple reported strong earnings...');
  });

  it('normalizes all articles', () => {
    const result = normalizeNewsData(mockTavilyResponse);
    expect(result.articles).toHaveLength(2);
    expect(result.totalResults).toBe(2);
  });

  it('extracts article fields correctly', () => {
    const result = normalizeNewsData(mockTavilyResponse);
    const article = result.articles[0];
    expect(article.title).toBe('Apple Q4 Earnings Beat Expectations');
    expect(article.url).toBe('https://example.com/article1');
    expect(article.content).toContain('$94.9 billion');
    expect(article.publishedDate).toBe('2024-11-01');
    expect(article.score).toBe(0.95);
  });

  it('handles empty results array', () => {
    const result = normalizeNewsData({ query: 'test', results: [] });
    expect(result.articles).toHaveLength(0);
    expect(result.totalResults).toBe(0);
  });

  it('handles missing results key', () => {
    const result = normalizeNewsData({ query: 'test' });
    expect(result.articles).toHaveLength(0);
  });

  it('handles missing answer', () => {
    const result = normalizeNewsData({ query: 'test', results: [] });
    expect(result.answer).toBeNull();
  });

  it('handles articles with missing fields', () => {
    const result = normalizeNewsData({
      query: 'test',
      results: [{ url: 'https://example.com' }],
    });
    const article = result.articles[0];
    expect(article.title).toBe('Untitled');
    expect(article.content).toBe('');
    expect(article.publishedDate).toBeNull();
    expect(article.score).toBe(0);
  });
});

// --- Unit tests for searchNews (with mocked fetch) ---

describe('searchNews', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('sends correct POST request to Tavily API', async () => {
    const mockResponse = { query: 'test', results: [] };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    await searchNews('Apple news', { apiKey: 'test-key' });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.tavily.com/search',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(callBody.api_key).toBe('test-key');
    expect(callBody.query).toBe('Apple news');
    expect(callBody.topic).toBe('news');
    expect(callBody.search_depth).toBe('advanced');
    expect(callBody.include_answer).toBe(true);
  });

  it('throws when no API key is available', async () => {
    const originalKey = process.env.TAVILY_API_KEY;
    delete process.env.TAVILY_API_KEY;

    await expect(searchNews('test'))
      .rejects.toThrow('TAVILY_API_KEY is required');

    process.env.TAVILY_API_KEY = originalKey;
  });

  it('throws on HTTP error response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve('Unauthorized'),
    });

    await expect(searchNews('test', { apiKey: 'bad-key' }))
      .rejects.toThrow('Tavily API error: 401');
  });

  it('respects maxResults option', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ results: [] }),
    });

    await searchNews('test', { apiKey: 'key', maxResults: 5 });
    const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(callBody.max_results).toBe(5);
  });
});

// --- Unit tests for getNewsData ---

describe('getNewsData', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('builds correct query and returns normalized data', async () => {
    const mockResponse = {
      query: 'Apple Inc latest news financial updates',
      answer: 'Summary...',
      results: [
        {
          title: 'Test Article',
          url: 'https://example.com',
          content: 'Content...',
          score: 0.9,
        },
      ],
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await getNewsData('Apple Inc', { apiKey: 'test-key' });
    expect(result.articles).toHaveLength(1);
    expect(result.articles[0].title).toBe('Test Article');

    const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(callBody.query).toContain('Apple Inc');
    expect(callBody.query).toContain('latest news');
  });
});

// --- Unit tests for getManagementNews ---

describe('getManagementNews', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('builds management-specific query', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ results: [] }),
    });

    await getManagementNews('Apple Inc', { apiKey: 'test-key' });

    const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(callBody.query).toContain('Apple Inc');
    expect(callBody.query).toContain('CEO');
    expect(callBody.query).toContain('management');
    expect(callBody.query).toContain('guidance');
  });
});

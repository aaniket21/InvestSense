/**
 * Tests for the LangGraph agent skeleton.
 *
 * These tests verify that:
 * 1. The graph compiles without errors
 * 2. All nodes execute in the correct order
 * 3. The final state contains all expected fields
 *
 * Data fetch and LLM are mocked so tests don't hit real APIs.
 */

// Mock the data source modules before requiring anything
jest.mock('../lib/dataSources/financials', () => ({
  getFinancialData: jest.fn().mockResolvedValue({
    ticker: 'TEST',
    companyName: 'Test Company',
    sector: 'Technology',
    industry: 'Software',
    marketCap: 1000000000,
    peRatio: 25,
    profitMargin: 0.2,
    grossMargin: 0.4,
    debtToEquity: 0.5,
    revenueHistory: [
      { year: '2024', revenue: 100e9, netIncome: 20e9 },
      { year: '2023', revenue: 90e9, netIncome: 18e9 },
    ],
    revenueGrowthRates: [{ period: '2024 vs 2023', rate: 0.111 }],
  }),
}));

jest.mock('../lib/dataSources/news', () => ({
  getNewsData: jest.fn().mockResolvedValue({
    query: 'Test Company latest news',
    answer: 'Test news summary',
    articles: [
      { title: 'Test Article', content: 'Test content', score: 0.9 },
    ],
    totalResults: 1,
  }),
  getManagementNews: jest.fn().mockResolvedValue({
    articles: [
      { title: 'CEO speaks at conference', content: 'Growth plans...' },
    ],
    totalResults: 1,
  }),
}));

jest.mock('../lib/agent/llm', () => ({
  createLlm: jest.fn().mockReturnValue('mock-llm'),
  callLlmWithSchema: jest.fn().mockImplementation((llm, schema, prompt) => {
    // Return appropriate mock based on prompt content
    if (prompt.includes('financial health')) {
      return Promise.resolve({
        signalName: 'Financial Health',
        summary: 'Mock financial analysis.',
        verdict: 'positive',
        evidence: ['Mock evidence 1'],
      });
    }
    if (prompt.includes('news sentiment')) {
      return Promise.resolve({
        signalName: 'Recent News & Sentiment',
        summary: 'Mock news analysis.',
        verdict: 'positive',
        evidence: ['Mock evidence 1'],
      });
    }
    if (prompt.includes('competitive position')) {
      return Promise.resolve({
        signalName: 'Competitive Position',
        summary: 'Mock competition analysis.',
        verdict: 'neutral',
        evidence: ['Mock evidence 1'],
      });
    }
    if (prompt.includes('management commentary')) {
      return Promise.resolve({
        signalName: 'Management & Strategy',
        summary: 'Mock management analysis.',
        verdict: 'positive',
        evidence: ['Mock evidence 1'],
      });
    }
    // Default fallback — synthesis prompt
    return Promise.resolve({
      decision: 'Watch',
      confidence: 60,
      reasoning: ['Mock reasoning based on mixed signals'],
      risks: ['Mock risk assessment'],
    });
  }),
}));

const { buildResearchGraph, runResearchAgent } = require('../lib/agent/graph');

describe('buildResearchGraph', () => {
  it('compiles the graph without errors', () => {
    const app = buildResearchGraph();
    expect(app).toBeDefined();
    expect(typeof app.invoke).toBe('function');
  });
});

describe('runResearchAgent', () => {
  it('executes end-to-end and returns final state', async () => {
    const result = await runResearchAgent('Test Company', 'TEST');

    expect(result).toBeDefined();
    expect(result.companyName).toBe('Test Company');
    expect(result.ticker).toBe('TEST');
  });

  it('populates all 4 signal summaries', async () => {
    const result = await runResearchAgent('Test Company', 'TEST');

    expect(result.financialSummary).toBeDefined();
    expect(result.financialSummary.signalName).toBe('Financial Health');

    expect(result.newsSummary).toBeDefined();
    expect(result.newsSummary.signalName).toBe('Recent News & Sentiment');

    expect(result.competitionSummary).toBeDefined();
    expect(result.competitionSummary.signalName).toBe('Competitive Position');

    expect(result.managementSummary).toBeDefined();
    expect(result.managementSummary.signalName).toBe('Management & Strategy');
  });

  it('produces a final verdict', async () => {
    const result = await runResearchAgent('Test Company', 'TEST');

    expect(result.finalVerdict).toBeDefined();
    expect(['Invest', 'Pass', 'Watch']).toContain(result.finalVerdict.decision);
    expect(typeof result.finalVerdict.confidence).toBe('number');
    expect(result.finalVerdict.confidence).toBeGreaterThanOrEqual(0);
    expect(result.finalVerdict.confidence).toBeLessThanOrEqual(100);
    expect(Array.isArray(result.finalVerdict.reasoning)).toBe(true);
    expect(Array.isArray(result.finalVerdict.risks)).toBe(true);
  });

  it('returns errors array (possibly empty)', async () => {
    const result = await runResearchAgent('Test Company', 'TEST');

    expect(Array.isArray(result.errors)).toBe(true);
  });

  it('each signal summary has required SignalResult fields', async () => {
    const result = await runResearchAgent('Test Company', 'TEST');

    const summaries = [
      result.financialSummary,
      result.newsSummary,
      result.competitionSummary,
      result.managementSummary,
    ];

    for (const summary of summaries) {
      expect(summary).toHaveProperty('signalName');
      expect(summary).toHaveProperty('summary');
      expect(summary).toHaveProperty('verdict');
      expect(summary).toHaveProperty('evidence');
      expect(['positive', 'neutral', 'negative']).toContain(summary.verdict);
      expect(Array.isArray(summary.evidence)).toBe(true);
    }
  });
});

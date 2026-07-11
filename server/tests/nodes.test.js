/**
 * Tests for real signal node implementations.
 *
 * Each node is tested with a mocked LLM to verify:
 * 1. It reads the correct state fields
 * 2. It builds a meaningful prompt from the data
 * 3. It returns a valid SignalResult via the schema
 *
 * Data sources are also mocked — we test node logic, not API calls.
 */

jest.mock('../lib/agent/llm', () => ({
  createLlm: jest.fn().mockReturnValue('mock-llm-instance'),
  callLlmWithSchema: jest.fn(),
}));

jest.mock('../lib/dataSources/news', () => ({
  getNewsData: jest.fn(),
  getManagementNews: jest.fn(),
}));

const { callLlmWithSchema } = require('../lib/agent/llm');
const {
  financialNode,
  newsNode,
  competitionNode,
  managementNode,
} = require('../lib/agent/nodes');

// --- Financial Node ---

describe('financialNode (real implementation)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a valid SignalResult when financial data is available', async () => {
    const mockSignal = {
      signalName: 'Financial Health',
      summary: 'Apple shows strong financial health with consistent revenue growth.',
      verdict: 'positive',
      evidence: ['Revenue grew 5.3% YoY', 'Profit margin at 26%'],
    };
    callLlmWithSchema.mockResolvedValue(mockSignal);

    const state = {
      companyName: 'Apple Inc',
      ticker: 'AAPL',
      financialData: {
        ticker: 'AAPL',
        companyName: 'Apple Inc',
        sector: 'Technology',
        marketCap: 3000000000000,
        peRatio: 28.5,
        profitMargin: 0.26,
        grossMargin: 0.45,
        debtToEquity: 1.76,
        revenueHistory: [
          { year: '2024', revenue: 400e9, netIncome: 100e9 },
          { year: '2023', revenue: 380e9, netIncome: 95e9 },
        ],
        revenueGrowthRates: [{ period: '2024 vs 2023', rate: 0.0526 }],
      },
    };

    const result = await financialNode(state);

    expect(result.financialSummary).toBeDefined();
    expect(result.financialSummary.signalName).toBe('Financial Health');
    expect(result.financialSummary.verdict).toBe('positive');
    expect(callLlmWithSchema).toHaveBeenCalledTimes(1);
  });

  it('returns a degraded SignalResult when financial data is missing', async () => {
    const state = {
      companyName: 'Unknown Corp',
      ticker: 'UNK',
      financialData: null,
    };

    const result = await financialNode(state);

    expect(result.financialSummary).toBeDefined();
    expect(result.financialSummary.verdict).toBe('neutral');
    expect(result.financialSummary.evidence).toContain('No financial data available');
    // Should NOT call the LLM when there's no data
    expect(callLlmWithSchema).not.toHaveBeenCalled();
  });

  it('passes financial data context into the LLM prompt', async () => {
    callLlmWithSchema.mockResolvedValue({
      signalName: 'Financial Health',
      summary: 'Analysis',
      verdict: 'positive',
      evidence: ['evidence'],
    });

    const state = {
      companyName: 'Apple Inc',
      ticker: 'AAPL',
      financialData: {
        ticker: 'AAPL',
        sector: 'Technology',
        peRatio: 28.5,
        profitMargin: 0.26,
        revenueHistory: [],
        revenueGrowthRates: [],
      },
    };

    await financialNode(state);

    const prompt = callLlmWithSchema.mock.calls[0][2];
    expect(prompt).toContain('Apple Inc');
    expect(prompt).toContain('28.5');
  });
});

// --- News Node ---

describe('newsNode (real implementation)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a valid SignalResult when news data is available', async () => {
    const mockSignal = {
      signalName: 'Recent News & Sentiment',
      summary: 'Positive news sentiment around product launches.',
      verdict: 'positive',
      evidence: ['New iPhone launch received positive reviews'],
    };
    callLlmWithSchema.mockResolvedValue(mockSignal);

    const state = {
      companyName: 'Apple Inc',
      newsData: {
        articles: [
          { title: 'Apple launches new iPhone', content: 'Great reviews...' },
        ],
        totalResults: 1,
      },
    };

    const result = await newsNode(state);

    expect(result.newsSummary).toBeDefined();
    expect(result.newsSummary.signalName).toBe('Recent News & Sentiment');
    expect(callLlmWithSchema).toHaveBeenCalledTimes(1);
  });

  it('returns a degraded SignalResult when news data is missing', async () => {
    const state = { companyName: 'Unknown Corp', newsData: null };

    const result = await newsNode(state);

    expect(result.newsSummary.verdict).toBe('neutral');
    expect(result.newsSummary.evidence).toContain('No news data available');
    expect(callLlmWithSchema).not.toHaveBeenCalled();
  });
});

// --- Competition Node ---

describe('competitionNode (real implementation)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a valid SignalResult using LLM reasoning', async () => {
    const mockSignal = {
      signalName: 'Competitive Position',
      summary: 'Apple maintains dominant position in premium smartphones.',
      verdict: 'positive',
      evidence: ['Market leader in premium segment'],
    };
    callLlmWithSchema.mockResolvedValue(mockSignal);

    const state = {
      companyName: 'Apple Inc',
      financialData: { sector: 'Technology', industry: 'Consumer Electronics' },
      newsData: { articles: [{ title: 'Apple vs Samsung' }] },
    };

    const result = await competitionNode(state);

    expect(result.competitionSummary).toBeDefined();
    expect(result.competitionSummary.signalName).toBe('Competitive Position');
    expect(callLlmWithSchema).toHaveBeenCalledTimes(1);
  });

  it('works with partial data (no financials)', async () => {
    const mockSignal = {
      signalName: 'Competitive Position',
      summary: 'Limited analysis.',
      verdict: 'neutral',
      evidence: ['Limited data available'],
    };
    callLlmWithSchema.mockResolvedValue(mockSignal);

    const state = {
      companyName: 'Unknown Corp',
      financialData: null,
      newsData: null,
    };

    const result = await competitionNode(state);

    expect(result.competitionSummary).toBeDefined();
    // Competition node always calls LLM (it can reason from company name alone)
    expect(callLlmWithSchema).toHaveBeenCalledTimes(1);
  });
});

// --- Management Node ---

describe('managementNode (real implementation)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a valid SignalResult from management news', async () => {
    const { getManagementNews } = require('../lib/dataSources/news');
    getManagementNews.mockResolvedValue({
      articles: [
        { title: 'Tim Cook discusses AI strategy', content: 'Apple will invest...' },
      ],
      totalResults: 1,
    });

    const mockSignal = {
      signalName: 'Management & Strategy',
      summary: 'Management shows strong forward vision.',
      verdict: 'positive',
      evidence: ['CEO committed to AI investment'],
    };
    callLlmWithSchema.mockResolvedValue(mockSignal);

    const state = { companyName: 'Apple Inc' };

    const result = await managementNode(state);

    expect(result.managementSummary).toBeDefined();
    expect(result.managementSummary.signalName).toBe('Management & Strategy');
    expect(callLlmWithSchema).toHaveBeenCalledTimes(1);
    expect(getManagementNews).toHaveBeenCalledWith('Apple Inc');
  });

  it('returns degraded result when management news fetch fails', async () => {
    const { getManagementNews } = require('../lib/dataSources/news');
    getManagementNews.mockRejectedValue(new Error('API error'));

    const state = { companyName: 'Unknown Corp' };

    const result = await managementNode(state);

    expect(result.managementSummary.verdict).toBe('neutral');
    expect(result.managementSummary.evidence).toContainEqual(
      expect.stringContaining('fetch failed')
    );
  });
});

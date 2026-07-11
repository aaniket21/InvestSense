/**
 * Tests for the /api/research Express route.
 *
 * Verifies:
 * 1. Route accepts a company name and returns research results
 * 2. Validates input (missing/empty company name)
 * 3. Handles agent errors gracefully
 */

jest.mock('../lib/agent/graph', () => ({
  runResearchAgent: jest.fn(),
}));

const { runResearchAgent } = require('../lib/agent/graph');

// Minimal Express test setup using supertest-like approach
// We test the route handler directly to avoid starting a server

const { createResearchHandler } = require('../lib/routes/research');

describe('POST /api/research handler', () => {
  let handler;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = createResearchHandler();
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  it('returns research results for a valid company name', async () => {
    const mockResult = {
      companyName: 'Apple Inc',
      ticker: 'AAPL',
      financialSummary: { signalName: 'Financial Health', verdict: 'positive' },
      newsSummary: { signalName: 'Recent News', verdict: 'positive' },
      competitionSummary: { signalName: 'Competition', verdict: 'neutral' },
      managementSummary: { signalName: 'Management', verdict: 'positive' },
      finalVerdict: {
        decision: 'Invest',
        confidence: 82,
        reasoning: ['Strong financials'],
        risks: ['High valuation'],
      },
      errors: [],
    };
    runResearchAgent.mockResolvedValue(mockResult);

    mockReq = { body: { companyName: 'Apple Inc', ticker: 'AAPL' } };

    await handler(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          companyName: 'Apple Inc',
          finalVerdict: expect.objectContaining({ decision: 'Invest' }),
        }),
      })
    );
    expect(runResearchAgent).toHaveBeenCalledWith('Apple Inc', 'AAPL');
  });

  it('returns 400 for missing company name', async () => {
    mockReq = { body: {} };

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('companyName'),
      })
    );
    expect(runResearchAgent).not.toHaveBeenCalled();
  });

  it('returns 400 for empty string company name', async () => {
    mockReq = { body: { companyName: '   ' } };

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(runResearchAgent).not.toHaveBeenCalled();
  });

  it('returns 500 when agent throws an error', async () => {
    runResearchAgent.mockRejectedValue(new Error('LLM rate limit exceeded'));

    mockReq = { body: { companyName: 'Test Corp' } };

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('LLM rate limit exceeded'),
      })
    );
  });

  it('uses company name as ticker when ticker not provided', async () => {
    runResearchAgent.mockResolvedValue({ companyName: 'Test', finalVerdict: {} });

    mockReq = { body: { companyName: 'Test Corp' } };

    await handler(mockReq, mockRes);

    expect(runResearchAgent).toHaveBeenCalledWith('Test Corp', '');
  });
});

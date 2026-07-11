/**
 * Tests for the real synthesis node.
 *
 * The synthesis node takes all 4 signal summaries and produces
 * a final investment verdict using LLM reasoning.
 *
 * Per PRD §4: LLM-synthesized judgment over 4 structured signals,
 * rather than a numeric weighted average.
 */

jest.mock('../lib/agent/llm', () => ({
  createLlm: jest.fn().mockReturnValue('mock-llm'),
  callLlmWithSchema: jest.fn(),
}));

const { callLlmWithSchema } = require('../lib/agent/llm');
const { synthesisNode } = require('../lib/agent/synthesis');

describe('synthesisNode (real implementation)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('produces a final verdict from all 4 signals', async () => {
    callLlmWithSchema.mockResolvedValue({
      decision: 'Invest',
      confidence: 82,
      reasoning: ['Strong financials', 'Positive news sentiment'],
      risks: ['High valuation', 'Market saturation'],
    });

    const state = {
      companyName: 'Apple Inc',
      financialSummary: {
        signalName: 'Financial Health',
        summary: 'Strong revenue growth.',
        verdict: 'positive',
        evidence: ['Revenue grew 5%'],
      },
      newsSummary: {
        signalName: 'Recent News & Sentiment',
        summary: 'Positive sentiment.',
        verdict: 'positive',
        evidence: ['Good reviews'],
      },
      competitionSummary: {
        signalName: 'Competitive Position',
        summary: 'Market leader.',
        verdict: 'positive',
        evidence: ['Top market share'],
      },
      managementSummary: {
        signalName: 'Management & Strategy',
        summary: 'Strong leadership.',
        verdict: 'positive',
        evidence: ['CEO vision'],
      },
      errors: [],
    };

    const result = await synthesisNode(state);

    expect(result.finalVerdict).toBeDefined();
    expect(result.finalVerdict.decision).toBe('Invest');
    expect(result.finalVerdict.confidence).toBe(82);
    expect(result.finalVerdict.reasoning).toHaveLength(2);
    expect(result.finalVerdict.risks).toHaveLength(2);
    expect(callLlmWithSchema).toHaveBeenCalledTimes(1);
  });

  it('includes all signal summaries in the prompt', async () => {
    callLlmWithSchema.mockResolvedValue({
      decision: 'Watch',
      confidence: 50,
      reasoning: ['Mixed signals'],
      risks: ['Uncertainty'],
    });

    const state = {
      companyName: 'Test Corp',
      financialSummary: {
        signalName: 'Financial Health',
        summary: 'Decent.',
        verdict: 'neutral',
        evidence: [],
      },
      newsSummary: {
        signalName: 'Recent News & Sentiment',
        summary: 'Mixed.',
        verdict: 'neutral',
        evidence: [],
      },
      competitionSummary: {
        signalName: 'Competitive Position',
        summary: 'Weak.',
        verdict: 'negative',
        evidence: [],
      },
      managementSummary: {
        signalName: 'Management & Strategy',
        summary: 'OK.',
        verdict: 'neutral',
        evidence: [],
      },
      errors: [],
    };

    await synthesisNode(state);

    const prompt = callLlmWithSchema.mock.calls[0][2];
    expect(prompt).toContain('Test Corp');
    expect(prompt).toContain('Financial Health');
    expect(prompt).toContain('Recent News & Sentiment');
    expect(prompt).toContain('Competitive Position');
    expect(prompt).toContain('Management & Strategy');
  });

  it('handles missing signals gracefully (Phase 4.2)', async () => {
    callLlmWithSchema.mockResolvedValue({
      decision: 'Watch',
      confidence: 30,
      reasoning: ['Limited data available'],
      risks: ['Incomplete analysis'],
    });

    const state = {
      companyName: 'Unknown Corp',
      financialSummary: null,
      newsSummary: null,
      competitionSummary: {
        signalName: 'Competitive Position',
        summary: 'Some analysis.',
        verdict: 'neutral',
        evidence: ['Limited info'],
      },
      managementSummary: null,
      errors: ['Financial data fetch failed', 'News data fetch failed'],
    };

    const result = await synthesisNode(state);

    expect(result.finalVerdict).toBeDefined();
    expect(callLlmWithSchema).toHaveBeenCalledTimes(1);

    // The prompt should mention which signals are missing
    const prompt = callLlmWithSchema.mock.calls[0][2];
    expect(prompt).toContain('unavailable');
  });

  it('mentions errors in the prompt when present', async () => {
    callLlmWithSchema.mockResolvedValue({
      decision: 'Pass',
      confidence: 20,
      reasoning: ['Too many data gaps'],
      risks: ['Incomplete picture'],
    });

    const state = {
      companyName: 'Error Corp',
      financialSummary: null,
      newsSummary: null,
      competitionSummary: null,
      managementSummary: null,
      errors: ['Financial data fetch failed: rate limit', 'News API error'],
    };

    await synthesisNode(state);

    const prompt = callLlmWithSchema.mock.calls[0][2];
    expect(prompt).toContain('Financial data fetch failed');
    expect(prompt).toContain('News API error');
  });
});

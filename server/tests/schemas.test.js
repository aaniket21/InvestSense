/**
 * Tests for Zod schemas used by LangGraph signal nodes.
 *
 * Per PRD §5: Each signal node returns a structured SignalResult.
 * The synthesis node returns a finalVerdict.
 * These schemas enforce that structure at runtime.
 */

const {
  SignalResultSchema,
  FinalVerdictSchema,
} = require('../lib/agent/schemas');

describe('SignalResultSchema', () => {
  it('validates a correct SignalResult object', () => {
    const valid = {
      signalName: 'Financial Health',
      summary: 'Revenue is growing steadily.',
      verdict: 'positive',
      evidence: ['Revenue grew 15% YoY', 'Margins expanding'],
    };
    const result = SignalResultSchema.parse(valid);
    expect(result.signalName).toBe('Financial Health');
    expect(result.verdict).toBe('positive');
    expect(result.evidence).toHaveLength(2);
  });

  it('accepts all three verdict values', () => {
    const base = {
      signalName: 'Test',
      summary: 'Test summary',
      evidence: ['evidence'],
    };

    expect(() => SignalResultSchema.parse({ ...base, verdict: 'positive' })).not.toThrow();
    expect(() => SignalResultSchema.parse({ ...base, verdict: 'neutral' })).not.toThrow();
    expect(() => SignalResultSchema.parse({ ...base, verdict: 'negative' })).not.toThrow();
  });

  it('rejects invalid verdict values', () => {
    const invalid = {
      signalName: 'Test',
      summary: 'Test',
      verdict: 'maybe',
      evidence: [],
    };
    expect(() => SignalResultSchema.parse(invalid)).toThrow();
  });

  it('rejects missing required fields', () => {
    expect(() => SignalResultSchema.parse({})).toThrow();
    expect(() => SignalResultSchema.parse({ signalName: 'Test' })).toThrow();
  });

  it('requires evidence to be an array of strings', () => {
    const invalid = {
      signalName: 'Test',
      summary: 'Test',
      verdict: 'positive',
      evidence: 'not an array',
    };
    expect(() => SignalResultSchema.parse(invalid)).toThrow();
  });
});

describe('FinalVerdictSchema', () => {
  it('validates a correct FinalVerdict object', () => {
    const valid = {
      decision: 'Invest',
      confidence: 85,
      reasoning: ['Strong revenue growth', 'Positive news sentiment'],
      risks: ['High valuation', 'Regulatory uncertainty'],
    };
    const result = FinalVerdictSchema.parse(valid);
    expect(result.decision).toBe('Invest');
    expect(result.confidence).toBe(85);
    expect(result.reasoning).toHaveLength(2);
    expect(result.risks).toHaveLength(2);
  });

  it('accepts all three decision values', () => {
    const base = {
      confidence: 50,
      reasoning: ['reason'],
      risks: ['risk'],
    };

    expect(() => FinalVerdictSchema.parse({ ...base, decision: 'Invest' })).not.toThrow();
    expect(() => FinalVerdictSchema.parse({ ...base, decision: 'Pass' })).not.toThrow();
    expect(() => FinalVerdictSchema.parse({ ...base, decision: 'Watch' })).not.toThrow();
  });

  it('rejects invalid decision values', () => {
    const invalid = {
      decision: 'Buy',
      confidence: 50,
      reasoning: ['reason'],
      risks: ['risk'],
    };
    expect(() => FinalVerdictSchema.parse(invalid)).toThrow();
  });

  it('rejects confidence below 0', () => {
    const invalid = {
      decision: 'Watch',
      confidence: -5,
      reasoning: ['reason'],
      risks: ['risk'],
    };
    expect(() => FinalVerdictSchema.parse(invalid)).toThrow();
  });

  it('rejects confidence above 100', () => {
    const invalid = {
      decision: 'Watch',
      confidence: 150,
      reasoning: ['reason'],
      risks: ['risk'],
    };
    expect(() => FinalVerdictSchema.parse(invalid)).toThrow();
  });

  it('rejects missing required fields', () => {
    expect(() => FinalVerdictSchema.parse({})).toThrow();
  });
});

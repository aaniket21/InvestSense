/**
 * Zod schemas for structured outputs from LangGraph nodes.
 *
 * Per PRD §5: Each signal node returns a SignalResult, and the
 * synthesis node returns a FinalVerdict. These schemas enforce
 * the structure at runtime and are used with LangChain's
 * structured output to ensure clean JSON from LLM calls.
 */

const { z } = require('zod');

/**
 * Schema for individual signal node outputs.
 * Each of the 4 research nodes (financial, news, competition,
 * management) must return data matching this shape.
 */
const SignalResultSchema = z.object({
  signalName: z.string(),
  summary: z.string(),
  verdict: z.enum(['positive', 'neutral', 'negative']),
  evidence: z.array(z.string()),
});

/**
 * Schema for the synthesis node's final output.
 * Combines all 4 signal results into an investment decision.
 */
const FinalVerdictSchema = z.object({
  decision: z.enum(['Invest', 'Pass', 'Watch']),
  confidence: z.number().int().min(0).max(100),
  reasoning: z.array(z.string()),
  risks: z.array(z.string()),
});

module.exports = { SignalResultSchema, FinalVerdictSchema };

/**
 * Tests for the LLM helper module.
 *
 * The LLM helper creates a ChatGoogleGenerativeAI instance
 * and provides a utility for structured output calls with retry.
 */

const { createLlm, callLlmWithSchema, isRateLimitError } = require('../lib/agent/llm');

describe('createLlm', () => {
  it('creates an LLM instance with default model', () => {
    const llm = createLlm({ apiKey: 'test-key' });
    expect(llm).toBeDefined();
  });

  it('throws when no API key is available', () => {
    const originalKey = process.env.GOOGLE_API_KEY;
    const originalGemini = process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    delete process.env.GEMINI_API_KEY;

    expect(() => createLlm()).toThrow('GOOGLE_API_KEY is required');

    process.env.GOOGLE_API_KEY = originalKey;
    if (originalGemini) process.env.GEMINI_API_KEY = originalGemini;
  });
});

describe('isRateLimitError', () => {
  it('detects 429 errors', () => {
    expect(isRateLimitError(new Error('429 Too Many Requests'))).toBe(true);
  });

  it('detects quota errors', () => {
    expect(isRateLimitError(new Error('quota exceeded'))).toBe(true);
  });

  it('detects rate limit text', () => {
    expect(isRateLimitError(new Error('rate limit reached'))).toBe(true);
  });

  it('returns false for non-rate-limit errors', () => {
    expect(isRateLimitError(new Error('Invalid API key'))).toBe(false);
  });
});

describe('callLlmWithSchema', () => {
  it('returns parsed output matching the schema', async () => {
    const { z } = require('zod');
    const schema = z.object({
      name: z.string(),
      score: z.number(),
    });

    const mockLlm = {
      withStructuredOutput: jest.fn().mockReturnValue({
        invoke: jest.fn().mockResolvedValue({
          name: 'test',
          score: 42,
        }),
      }),
    };

    const result = await callLlmWithSchema(mockLlm, schema, 'test prompt');
    expect(result).toEqual({ name: 'test', score: 42 });
    expect(mockLlm.withStructuredOutput).toHaveBeenCalledWith(schema);
  });

  it('throws when LLM returns data that fails schema validation', async () => {
    const { z } = require('zod');
    const schema = z.object({
      name: z.string(),
    });

    const mockLlm = {
      withStructuredOutput: jest.fn().mockReturnValue({
        invoke: jest.fn().mockRejectedValue(new Error('Invalid output')),
      }),
    };

    await expect(callLlmWithSchema(mockLlm, schema, 'bad prompt'))
      .rejects.toThrow();
  });

  it('retries on rate limit error', async () => {
    const { z } = require('zod');
    const schema = z.object({ name: z.string() });

    let callCount = 0;
    const mockLlm = {
      withStructuredOutput: jest.fn().mockReturnValue({
        invoke: jest.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.reject(new Error('429 Too Many Requests'));
          }
          return Promise.resolve({ name: 'success' });
        }),
      }),
    };

    const result = await callLlmWithSchema(mockLlm, schema, 'retry test');
    expect(result).toEqual({ name: 'success' });
    expect(callCount).toBe(2);
  }, 15000);

  it('throws after max retries exceeded', async () => {
    const { z } = require('zod');
    const schema = z.object({ name: z.string() });

    const mockLlm = {
      withStructuredOutput: jest.fn().mockReturnValue({
        invoke: jest.fn().mockRejectedValue(new Error('429 quota exceeded')),
      }),
    };

    await expect(callLlmWithSchema(mockLlm, schema, 'exhaust retries'))
      .rejects.toThrow('429 quota exceeded');
  }, 30000);
});

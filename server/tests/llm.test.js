/**
 * Tests for the LLM helper module.
 *
 * The LLM helper creates a ChatGoogleGenerativeAI instance
 * and provides a utility for structured output calls.
 * Tests verify configuration and mock the LLM for unit testing.
 */

const { createLlm, callLlmWithSchema } = require('../lib/agent/llm');

describe('createLlm', () => {
  it('creates an LLM instance with default model', () => {
    const llm = createLlm({ apiKey: 'test-key' });
    expect(llm).toBeDefined();
  });

  it('throws when no API key is available', () => {
    const originalKey = process.env.GOOGLE_API_KEY;
    delete process.env.GOOGLE_API_KEY;

    expect(() => createLlm()).toThrow('GOOGLE_API_KEY is required');

    process.env.GOOGLE_API_KEY = originalKey;
  });
});

describe('callLlmWithSchema', () => {
  it('returns parsed output matching the schema', async () => {
    const { z } = require('zod');
    const schema = z.object({
      name: z.string(),
      score: z.number(),
    });

    // Create a mock LLM that returns valid structured data
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
});

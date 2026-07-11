/**
 * LLM helper — wraps Google Gemini via LangChain for the agent.
 *
 * Provides:
 * - createLlm(): factory for ChatGoogleGenerativeAI instance
 * - callLlmWithSchema(): invoke LLM with Zod schema for structured output
 * - Retry with exponential backoff for rate limit handling
 *
 * Per PRD §6: Uses @langchain/google-genai with Gemini API.
 * Per PRD §11: Retry-with-backoff for Gemini free tier rate limits.
 */

const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 2000;

/**
 * Creates a ChatGoogleGenerativeAI instance.
 *
 * @param {object} [options] - Configuration options
 * @param {string} [options.apiKey] - Google API key (defaults to env var)
 * @param {string} [options.model] - Model name (defaults to gemini-3.5-flash)
 * @param {number} [options.temperature] - Temperature for generation (defaults to 0.3)
 * @returns {ChatGoogleGenerativeAI} Configured LLM instance
 */
function createLlm(options = {}) {
  const apiKey = options.apiKey || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY is required');
  }

  return new ChatGoogleGenerativeAI({
    apiKey,
    model: options.model || 'gemini-3.5-flash',
    temperature: options.temperature ?? 0.3,
  });
}

/**
 * Waits for a specified number of milliseconds.
 *
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Checks if an error is a retryable rate limit error.
 *
 * @param {Error} error - Error to check
 * @returns {boolean} True if the error is a rate limit that should be retried
 */
function isRateLimitError(error) {
  const message = error.message || '';
  return message.includes('429') || message.includes('quota') || message.includes('rate limit');
}

/**
 * Invokes the LLM with a Zod schema to get structured output.
 * Includes retry with exponential backoff for rate limit errors.
 *
 * Uses LangChain's withStructuredOutput to constrain the LLM
 * response to match the provided schema.
 *
 * @param {ChatGoogleGenerativeAI} llm - LLM instance
 * @param {import('zod').ZodSchema} schema - Zod schema for output
 * @param {string} prompt - Prompt to send to the LLM
 * @returns {Promise<object>} Parsed output matching the schema
 */
async function callLlmWithSchema(llm, schema, prompt) {
  const structuredLlm = llm.withStructuredOutput(schema);

  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await structuredLlm.invoke(prompt);
      return result;
    } catch (error) {
      lastError = error;

      if (isRateLimitError(error) && attempt < MAX_RETRIES) {
        const delay = INITIAL_DELAY_MS * Math.pow(2, attempt);
        console.warn(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await sleep(delay);
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

module.exports = { createLlm, callLlmWithSchema, sleep, isRateLimitError };

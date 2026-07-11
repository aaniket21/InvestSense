/**
 * LLM helper — wraps Google Gemini via LangChain for the agent.
 *
 * Provides:
 * - createLlm(): factory for ChatGoogleGenerativeAI instance
 * - callLlmWithSchema(): invoke LLM with Zod schema for structured output
 *
 * Per PRD §6: Uses @langchain/google-genai with Gemini API.
 */

const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');

/**
 * Creates a ChatGoogleGenerativeAI instance.
 *
 * @param {object} [options] - Configuration options
 * @param {string} [options.apiKey] - Google API key (defaults to env var)
 * @param {string} [options.model] - Model name (defaults to gemini-2.0-flash)
 * @param {number} [options.temperature] - Temperature for generation (defaults to 0.3)
 * @returns {ChatGoogleGenerativeAI} Configured LLM instance
 */
function createLlm(options = {}) {
  const apiKey = options.apiKey || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY is required');
  }

  return new ChatGoogleGenerativeAI({
    apiKey,
    model: options.model || 'gemini-2.0-flash',
    temperature: options.temperature ?? 0.3,
  });
}

/**
 * Invokes the LLM with a Zod schema to get structured output.
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
  const result = await structuredLlm.invoke(prompt);
  return result;
}

module.exports = { createLlm, callLlmWithSchema };

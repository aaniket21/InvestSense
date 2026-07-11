/**
 * Research API route handler.
 *
 * POST /api/research — accepts { companyName, ticker? } and
 * invokes the LangGraph research agent, returning the full
 * analysis with verdict.
 *
 * Per PRD §5: POST /api/research route invoking the LangGraph agent.
 */

const { runResearchAgent } = require('../agent/graph');

/**
 * Creates the research route handler.
 * Separated from Express wiring for testability.
 *
 * @returns {Function} Express route handler
 */
function createResearchHandler() {
  return async function handleResearch(req, res) {
    const { companyName, ticker } = req.body;

    if (!companyName || typeof companyName !== 'string' || companyName.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'companyName is required and must be a non-empty string',
      });
    }

    try {
      const result = await runResearchAgent(companyName.trim(), ticker || '');

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: `Research agent failed: ${error.message}`,
      });
    }
  };
}

module.exports = { createResearchHandler };

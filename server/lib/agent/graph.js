/**
 * LangGraph Research Agent — wires all nodes into a directed graph.
 *
 * Graph flow:
 *   START → dataFetchNode → [financialNode, newsNode, competitionNode, managementNode] → synthesisNode → END
 *
 * The 4 signal nodes run conceptually in parallel after data is fetched.
 * The synthesis node waits for all signal nodes before producing the verdict.
 *
 * Per PRD §5 architecture diagram.
 */

const { StateGraph } = require('@langchain/langgraph');
const { AgentState } = require('./state');
const {
  dataFetchNode,
  financialNode,
  newsNode,
  competitionNode,
  managementNode,
} = require('./nodes');
const { synthesisNode } = require('./synthesis');

/**
 * Builds and compiles the InvestSense research graph.
 *
 * @returns {object} Compiled LangGraph instance ready for .invoke()
 */
function buildResearchGraph() {
  const graph = new StateGraph(AgentState)
    .addNode('dataFetch', dataFetchNode)
    .addNode('financial', financialNode)
    .addNode('news', newsNode)
    .addNode('competition', competitionNode)
    .addNode('management', managementNode)
    .addNode('synthesis', synthesisNode)
    .addEdge('__start__', 'dataFetch')
    .addEdge('dataFetch', 'financial')
    .addEdge('dataFetch', 'news')
    .addEdge('dataFetch', 'competition')
    .addEdge('dataFetch', 'management')
    .addEdge('financial', 'synthesis')
    .addEdge('news', 'synthesis')
    .addEdge('competition', 'synthesis')
    .addEdge('management', 'synthesis')
    .addEdge('synthesis', '__end__');

  return graph.compile();
}

/**
 * Runs the research agent for a given company.
 *
 * @param {string} companyName - Company name to research
 * @param {string} [ticker] - Optional stock ticker (if known)
 * @returns {Promise<object>} Final agent state with verdict
 */
async function runResearchAgent(companyName, ticker = '') {
  const app = buildResearchGraph();

  const result = await app.invoke({
    companyName,
    ticker: ticker || companyName,
  });

  return result;
}

module.exports = { buildResearchGraph, runResearchAgent };

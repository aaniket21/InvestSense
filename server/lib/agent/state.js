/**
 * LangGraph Agent State — defines the shared state shape
 * that flows through all nodes in the research graph.
 *
 * Per PRD §5: AgentState with companyName, ticker, 4 signal
 * summaries, finalVerdict, and errors.
 */

const { Annotation } = require('@langchain/langgraph');

/**
 * Defines the shared state for the InvestSense research agent.
 *
 * Each signal node reads companyName/ticker and writes its own
 * summary field. The synthesis node reads all 4 summaries and
 * writes the finalVerdict.
 *
 * The `errors` array accumulates any errors from individual nodes
 * so the synthesis node can account for missing signals.
 */
const AgentState = Annotation.Root({
  companyName: Annotation({
    reducer: (_, next) => next,
    default: () => '',
  }),
  ticker: Annotation({
    reducer: (_, next) => next,
    default: () => '',
  }),
  financialData: Annotation({
    reducer: (_, next) => next,
    default: () => null,
  }),
  newsData: Annotation({
    reducer: (_, next) => next,
    default: () => null,
  }),
  financialSummary: Annotation({
    reducer: (_, next) => next,
    default: () => null,
  }),
  newsSummary: Annotation({
    reducer: (_, next) => next,
    default: () => null,
  }),
  competitionSummary: Annotation({
    reducer: (_, next) => next,
    default: () => null,
  }),
  managementSummary: Annotation({
    reducer: (_, next) => next,
    default: () => null,
  }),
  finalVerdict: Annotation({
    reducer: (_, next) => next,
    default: () => null,
  }),
  errors: Annotation({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
});

module.exports = { AgentState };

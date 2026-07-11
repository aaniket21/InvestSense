/**
 * Synthesis node — combines all 4 signal summaries into
 * a final investment verdict using LLM reasoning.
 *
 * Per PRD §4: LLM-synthesized judgment over 4 structured signals,
 * rather than a numeric weighted average. Mirrors how a real
 * analyst reads inputs then forms a judgment.
 */

const { createLlm, callLlmWithSchema } = require('./llm');
const { FinalVerdictSchema } = require('./schemas');

/**
 * Formats a single signal summary into a prompt section.
 *
 * @param {object|null} signal - SignalResult object or null
 * @param {string} fallbackName - Name to use if signal is null
 * @returns {string} Formatted signal section
 */
function formatSignalSection(signal, fallbackName) {
  if (!signal) {
    return `### ${fallbackName}\nStatus: UNAVAILABLE — this signal could not be gathered.\n`;
  }

  const lines = [
    `### ${signal.signalName}`,
    `Verdict: ${signal.verdict.toUpperCase()}`,
    `Summary: ${signal.summary}`,
    'Evidence:',
  ];

  for (const item of signal.evidence) {
    lines.push(`  - ${item}`);
  }

  return lines.join('\n');
}

/**
 * Builds the synthesis prompt from all available signals and errors.
 *
 * @param {string} companyName - Company being analyzed
 * @param {object} signals - Object with the 4 signal summaries (may be null)
 * @param {string[]} errors - Accumulated errors from data fetching
 * @returns {string} Complete synthesis prompt
 */
function buildSynthesisPrompt(companyName, signals, errors) {
  const signalEntries = [
    { key: 'financialSummary', name: 'Financial Health' },
    { key: 'newsSummary', name: 'Recent News & Sentiment' },
    { key: 'competitionSummary', name: 'Competitive Position' },
    { key: 'managementSummary', name: 'Management & Strategy' },
  ];

  const available = signalEntries.filter((e) => signals[e.key] != null);
  const unavailable = signalEntries.filter((e) => signals[e.key] == null);

  const lines = [
    `You are an investment research analyst. Synthesize the following research signals for ${companyName} into a final investment verdict.`,
    '',
    `${available.length} of 4 signals are available.`,
  ];

  if (unavailable.length > 0) {
    lines.push(`The following signals are unavailable: ${unavailable.map((e) => e.name).join(', ')}.`);
    lines.push('Factor this data gap into your confidence score — lower confidence when signals are missing.');
  }

  lines.push('');
  lines.push('## Research Signals');
  lines.push('');

  for (const entry of signalEntries) {
    lines.push(formatSignalSection(signals[entry.key], entry.name));
    lines.push('');
  }

  if (errors.length > 0) {
    lines.push('## Data Collection Errors');
    for (const error of errors) {
      lines.push(`- ${error}`);
    }
    lines.push('');
  }

  lines.push('## Your Task');
  lines.push('');
  lines.push('Based on ALL available signals above, provide your investment verdict:');
  lines.push('- decision: "Invest" (strong buy signal), "Pass" (avoid), or "Watch" (mixed/insufficient signals)');
  lines.push('- confidence: 0-100 score reflecting how certain you are');
  lines.push('- reasoning: 3-5 bullet points explaining your decision, each tied to specific evidence from the signals');
  lines.push('- risks: 2-4 key risks an investor should be aware of');
  lines.push('');
  lines.push('Be specific and evidence-linked. Do not give generic reasoning.');

  return lines.join('\n');
}

/**
 * Synthesizes all signal summaries into a final verdict.
 *
 * @param {object} state - Agent state with all 4 signal summaries
 * @returns {object} Updated state with finalVerdict
 */
async function synthesisNode(state) {
  const signals = {
    financialSummary: state.financialSummary,
    newsSummary: state.newsSummary,
    competitionSummary: state.competitionSummary,
    managementSummary: state.managementSummary,
  };

  const errors = state.errors || [];
  const prompt = buildSynthesisPrompt(state.companyName, signals, errors);

  const llm = createLlm();
  const verdict = await callLlmWithSchema(llm, FinalVerdictSchema, prompt);

  return { finalVerdict: verdict };
}

module.exports = { synthesisNode, buildSynthesisPrompt, formatSignalSection };

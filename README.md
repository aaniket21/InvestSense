# InvestSense — AI Investment Research Agent

## Overview
An autonomous AI agent that takes a **company name** as input, researches it across four key dimensions (financial health, news sentiment, competitive position, and management commentary), and produces a clear **Invest / Pass / Watch** decision with evidence-backed reasoning — collapsing hours of manual research into a single structured report.

Built for the AI Product Development Engineer assessment at InsideIIM × AltUni AI Labs.

> ⚠️ **Disclaimer:** This is a decision-support tool, not financial advice. Always do your own research before making investment decisions.

---

## How to run it

🔗 **Live demo:** https://investsense.vercel.app

### Prerequisites
- **Node.js** v18+ installed
- API keys (free tier) for:
  - [Google Gemini](https://aistudio.google.com/) — LLM provider
  - [Alpha Vantage](https://www.alphavantage.co/support/#api-key) — financial data
  - [Tavily](https://tavily.com/) — news search

### Setup
```bash
# 1. Clone the repo
git clone https://github.com/your-username/investsense-agent.git
cd investsense-agent

# 2. Set up the server
cd server
npm install
cp .env.example .env
# Edit .env and add your API keys (GEMINI_API_KEY, ALPHA_VANTAGE_API_KEY, TAVILY_API_KEY)

# 3. Set up the client
cd ../client
npm install
```

### Running
```bash
# Terminal 1 — Start the API server
cd server
npm run dev
# Server runs on http://localhost:3001

# Terminal 2 — Start the React frontend
cd client
npm run dev
# Opens on http://localhost:5173
```
Open `http://localhost:5173` in your browser, enter a company name (e.g. "Apple Inc") with its ticker (e.g. "AAPL"), and click **Analyze Company**.

---

## How it works

InvestSense uses a **LangGraph.js** directed graph to orchestrate multi-dimensional research. Rather than a simple sequential chain, the graph structure lets signal nodes run in parallel after data is fetched, then converge for synthesis — mirroring how a real analyst processes inputs before forming a judgment.

### Architecture
```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────────┐
│   React (Vite)   │─────▶│  Express API      │─────▶│   LangGraph Agent     │
│  (company input, │◀─────│  POST /api/       │◀─────│   (server-side,       │
│   results view)  │      │  research)        │      │   uses Gemini)        │
└─────────────────┘      └──────────────────┘      └───────────┬─────────┘
                                                                  │
                    ┌────────────────┬────────────────┬──────────┴─────────┐
                    ▼                ▼                ▼                    ▼
             financial_node   news_node       competition_node   management_node
                    │                │                │                    │
                    └────────────────┴────────────────┴────────────────────┘
                                          │
                                          ▼
                                  synthesis_node
                                          │
                                          ▼
                              { verdict, confidence,
                                reasoning[], risks[] }
```

### The 4 Research Signals
1. **Financial Health**: Analyzes revenue growth, margins, debt levels, and P/E ratio using Alpha Vantage API data.
2. **News & Sentiment**: Reviews the last 30–60 days of news and sentiment via Tavily Search API.
3. **Competitive Position**: Leverages LLM reasoning over the context of main competitors and market share trends.
4. **Management Commentary**: Focuses on CEO statements, guidance, and strategic direction through management-filtered Tavily searches.

The **synthesis node** receives all four structured signals and produces the final verdict by reasoning over the evidence holistically, mimicking a human analyst.

---

## Key decisions & trade-offs

### Why LLM-synthesized judgment instead of a weighted score?
A hardcoded weighted average (e.g., 40% financials + 30% news) ignores context — a 70% financial score means very different things for a mature utility company vs. a high-growth tech startup. Having the LLM synthesize across all signals with full context ensures the reasoning is more nuanced.

### Why these 4 specific signals?
They cover the minimum viable set of dimensions an analyst considers: **trailing performance** (financials), **near-term catalysts** (news), **relative positioning** (competition), and **forward intent** (management). More signals (e.g., technical analysis, ESG scores) would add value but were scoped out for the 7-day timeline.

### Why Gemini over GPT-4 / Claude?
Gemini offers a generous free tier, which is critical for development — the graph fires 5+ LLM calls per run. At paid pricing, testing dozens of companies would cost significantly more with GPT-4. Gemini's structured output support via LangChain is solid enough for this usecase.

### Why LangGraph instead of a simple chain?
Signal analysis is inherently parallel — news sentiment doesn't depend on financial data. LangGraph's directed graph lets the 4 signal nodes fan out after data fetching and fan in before synthesis, which is both faster and architecturally honest about the problem's dependency structure.

### Why a separate Express server instead of Next.js API routes?
Using a separate Express server keeps the concerns clean (the agent can be tested and deployed independently), avoids coupling the AI orchestration to a specific frontend framework, and is more representative of a production architecture.

---

## Example runs

*Note: During testing, Alpha Vantage free-tier financial data was unavailable. The agent gracefully degraded, producing verdicts based on the remaining 3 signals.*

### 1. Apple Inc (AAPL)
- **Decision:** Watch (75% confidence)
- **Signals:** Financials (Neutral/Missing), News (Positive), Competition (Positive), Management (Neutral)
- **Reasoning Snippet:** While recent earnings were strong, these gains are offset by severe supply chain cost pressures. Strategic long-term moves like the Broadcom chip deal demonstrate continued ecosystem strength. A lack of financial data necessitates a cautious 'Watch' stance.

### 2. Infosys (INFY)
- **Decision:** Watch (75% confidence)
- **Signals:** Financials (Neutral/Missing), News (Positive), Competition (Neutral), Management (Positive)
- **Reasoning Snippet:** Qualitative indicators show strong resilience compared to peers. Active investments in generative AI (like Topaz) are strategically sound but present short-term headwinds to operating margins.

### 3. Tesla Inc (TSLA)
- **Decision:** Watch (75% confidence)
- **Signals:** Financials (Neutral/Missing), News (Positive), Competition (Neutral), Management (Positive)
- **Reasoning Snippet:** Operational performance remains strong (25% YoY increase in Q2 vehicle deliveries), but Tesla faces intensifying competition from Chinese rivals like BYD. Its premium valuation is heavily reliant on future execution in AI, FSD, and robotaxi initiatives.

### 4. Zephyr Biotech Solutions (Fictional — failure path test)
- **Decision:** Watch (85% confidence)
- **Signals:** Financials (Neutral/Missing), News (Neutral), Competition (Positive - Hallucinated), Management (Neutral)
- **Observation:** The competition node hallucinated a plausible competitive analysis for this fictional company. This highlights the importance of the disclaimer, as the synthesis node relied on this fabricated signal to boost confidence, while the news node correctly returned neutral with no coverage found.

---

## What you would improve with more time

- **Streaming progress:** Stream individual node completions to the frontend via SSE/WebSocket so users see real-time progress.
- **Caching:** Cache research results per company to avoid hitting API rate limits on repeated queries.
- **Backtesting:** Run the agent against historical company data with known outcomes to validate the quality of its judgments.
- **Side-by-side comparison:** Let users compare two companies' research reports side by side.
- **Richer data sources:** Integrate SEC filings (EDGAR API), analyst estimates, and technical indicators for a comprehensive analysis.
- **Paid API tiers:** Move from free-tier APIs to production-grade plans to eliminate rate limiting.
- **Session memory:** Store previous research results and let the synthesis node factor in how a company's signals have changed over time.

---

## BONUS: LLM chat session transcripts

The full history of interactions between the developer and the AI agent (Gemini/Claude) during the creation of InvestSense can be found here:

- [Development Session Logs](docs/chat-logs/development_session.md)
- [Example Runs Outputs](docs/example-runs.md)

These logs highlight the TDD approach taken, starting from a Vite + Express scaffold, building out LangGraph nodes in parallel, addressing API rate limit gracefully, and handling AI hallucinations during the testing phases.

# InvestSense — AI Investment Research Agent

An autonomous AI agent that takes a **company name** as input, researches it across four key dimensions (financial health, news sentiment, competitive position, and management commentary), and produces a clear **Invest / Pass / Watch** decision with evidence-backed reasoning — collapsing hours of manual research into a single structured report.

Built for the AI Product Development Engineer assessment at InsideIIM × AltUni AI Labs.

> ⚠️ **Disclaimer:** This is a decision-support tool, not financial advice. Always do your own research before making investment decisions.

---

## How to Run It

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
# Edit .env and add your API keys

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

## How It Works

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

| # | Signal | What It Analyzes | Data Source |
|---|--------|------------------|-------------|
| 1 | **Financial Health** | Revenue growth trend, margins, debt levels, P/E ratio | Alpha Vantage API |
| 2 | **News & Sentiment** | Last 30–60 days of news, sentiment analysis | Tavily Search API |
| 3 | **Competitive Position** | Main competitors, market share trends | LLM reasoning over context |
| 4 | **Management Commentary** | CEO statements, guidance, strategic direction | Tavily (management-filtered) |

### How the Verdict Works

Each signal node uses **Gemini 2.0 Flash** with **structured output** (Zod schemas) to produce a `SignalResult`:

```json
{
  "signalName": "Financial Health",
  "summary": "Apple shows strong financial health...",
  "verdict": "positive",
  "evidence": ["Revenue grew 5.3% YoY", "Profit margin at 26%"]
}
```

The **synthesis node** then receives all four structured signals and produces the final verdict — not by averaging scores, but by reasoning over the evidence holistically, like a real analyst would:

```json
{
  "decision": "Invest",
  "confidence": 82,
  "reasoning": ["Strong and improving financial metrics...", "..."],
  "risks": ["High valuation relative to growth...", "..."]
}
```

---

## Key Decisions & Trade-offs

### Why LLM-synthesized judgment instead of a weighted score?

A hardcoded weighted average (e.g., 40% financials + 30% news + ...) would be easy to implement but impossible to defend. It ignores context — a 70% financial score means very different things for a mature utility company vs. a high-growth tech startup. By having the LLM synthesize across all signals with full context, the reasoning is more nuanced and mirrors how a real analyst forms a judgment.

### Why these 4 specific signals?

They cover the minimum viable set of dimensions an analyst considers: **trailing performance** (financials), **near-term catalysts** (news), **relative positioning** (competition), and **forward intent** (management). More signals (e.g., technical analysis, ESG scores) would add value but were scoped out for the 7-day timeline.

### Why Gemini over GPT-4 / Claude?

Gemini offers a generous free tier, which is critical for development — the graph fires 5+ LLM calls per run (4 signal nodes + synthesis), and during testing you'll run dozens of companies. At paid pricing, this would cost significantly more with GPT-4. Gemini's structured output support via LangChain is solid enough for this use case.

### Why LangGraph instead of a simple chain?

A sequential `chain.pipe(chain).pipe(chain)` would work but doesn't model the real problem. Signal analysis is inherently parallel — news sentiment doesn't depend on financial data. LangGraph's directed graph lets the 4 signal nodes fan out after data fetching and fan in before synthesis, which is both faster and architecturally honest about the problem's dependency structure.

### Why a separate Express server instead of Next.js API routes?

The assignment specified React or Next.js for the frontend and Node.js for the backend. Using a separate Express server keeps the concerns clean (the agent can be tested and deployed independently), avoids coupling the AI orchestration to a specific frontend framework, and is more representative of a production architecture.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React (Vite) + Tailwind CSS | Assignment requirement; Vite for fast DX |
| Backend | Node.js + Express | Assignment requirement; clean separation |
| AI Orchestration | LangGraph.js | Directed graph for parallel signal analysis |
| LLM Provider | Google Gemini 2.0 Flash | Free tier, structured output, fast |
| Financial Data | Alpha Vantage (free) | Company fundamentals + income statements |
| News Search | Tavily API (free) | LLM-agent-friendly search results |
| Schema Validation | Zod | Runtime type safety for LLM outputs |

---

## What I'd Improve With More Time

- **Streaming progress** — Stream individual node completions to the frontend via SSE/WebSocket so users see real-time progress instead of a simulated loading animation
- **Caching** — Cache research results per company for the session to avoid hitting API rate limits on repeated queries
- **Backtesting** — Run the agent against historical company data with known outcomes to validate the quality of its judgments
- **Side-by-side comparison** — Let users compare two companies' research reports side by side
- **Richer data sources** — Integrate SEC filings (EDGAR API), analyst estimates, and technical indicators for more comprehensive analysis
- **Paid API tiers** — Move from free-tier APIs to production-grade plans to eliminate rate limiting as a constraint
- **Session memory** — Store previous research results and let the synthesis node factor in how a company's signals have changed over time

---

## Project Structure

```
investsense-agent/
├── client/                    # React frontend (Vite + Tailwind)
│   ├── src/
│   │   ├── components/
│   │   │   ├── SearchInput.jsx     # Company search form
│   │   │   ├── LoadingState.jsx    # Animated research progress
│   │   │   ├── ResultsView.jsx     # Full results display
│   │   │   ├── SignalCard.jsx      # Expandable signal cards
│   │   │   └── VerdictBadge.jsx    # Verdict + confidence ring
│   │   ├── api.js                  # API client
│   │   ├── App.jsx                 # Root component
│   │   └── index.css               # Design system
│   └── ...
├── server/                    # Express API + LangGraph agent
│   ├── lib/
│   │   ├── agent/
│   │   │   ├── graph.js            # LangGraph wiring
│   │   │   ├── llm.js             # Gemini wrapper + retry
│   │   │   ├── nodes.js           # 4 signal nodes + data fetch
│   │   │   ├── schemas.js         # Zod schemas
│   │   │   ├── state.js           # AgentState definition
│   │   │   └── synthesis.js       # Synthesis node
│   │   ├── dataSources/
│   │   │   ├── financials.js      # Alpha Vantage integration
│   │   │   └── news.js            # Tavily integration
│   │   └── routes/
│   │       └── research.js        # POST /api/research handler
│   ├── tests/                     # 81 unit tests
│   └── ...
└── docs/                      # PRD and documentation
```

---

## Ambiguity Resolutions

These are deliberate choices made where the assignment brief was ambiguous:

1. **"Research"** — Scoped to 4 concrete signals (financials + news + competition + management) rather than attempting exhaustive coverage. This is documented in the PRD.
2. **"Invest or Pass"** — Added a third **Watch** state for genuinely mixed signals, because forcing a binary decision when data is insufficient would be misleading. This is a deliberate deviation noted here.
3. **Company coverage** — Targets public listed companies (US primarily via Alpha Vantage). Private/unlisted companies fall back to a lighter, news-only research path with reduced confidence.

---

## Running Tests

```bash
cd server
npm test
```

All 81 tests pass, covering:
- Financial data fetching and normalization (22 tests)
- News data fetching and normalization (14 tests)
- Zod schema validation (11 tests)
- Signal node logic with mocked LLM (9 tests)
- LLM helper with retry logic (10 tests)
- Synthesis node (4 tests)
- API route handler (5 tests)
- End-to-end graph execution (6 tests)

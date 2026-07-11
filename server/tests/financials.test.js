const {
  calculateGrowthRate,
  normalizeFinancialData,
  fetchCompanyOverview,
  fetchIncomeStatement,
  getFinancialData,
} = require('../lib/dataSources/financials');

// --- Unit tests for calculateGrowthRate ---

describe('calculateGrowthRate', () => {
  it('returns positive growth rate when current > previous', () => {
    const result = calculateGrowthRate(120, 100);
    expect(result).toBeCloseTo(0.2);
  });

  it('returns negative growth rate when current < previous', () => {
    const result = calculateGrowthRate(80, 100);
    expect(result).toBeCloseTo(-0.2);
  });

  it('returns 0 when current equals previous', () => {
    const result = calculateGrowthRate(100, 100);
    expect(result).toBeCloseTo(0);
  });

  it('returns null when previous is 0 (division by zero)', () => {
    const result = calculateGrowthRate(100, 0);
    expect(result).toBeNull();
  });

  it('handles negative previous value correctly', () => {
    const result = calculateGrowthRate(50, -100);
    expect(result).toBeCloseTo(1.5);
  });
});

// --- Unit tests for normalizeFinancialData ---

describe('normalizeFinancialData', () => {
  const mockOverview = {
    Symbol: 'AAPL',
    Name: 'Apple Inc',
    Sector: 'Technology',
    Industry: 'Consumer Electronics',
    MarketCapitalization: '3000000000000',
    PERatio: '28.5',
    ProfitMargin: '0.26',
    ReturnOnEquityTTM: '1.47',
    DebtToEquityRatio: '1.76',
    CurrentRatio: '1.07',
    DividendYield: '0.005',
  };

  const mockIncomeStatement = {
    annualReports: [
      {
        fiscalDateEnding: '2024-09-30',
        totalRevenue: '400000000000',
        netIncome: '100000000000',
        grossProfit: '180000000000',
      },
      {
        fiscalDateEnding: '2023-09-30',
        totalRevenue: '380000000000',
        netIncome: '95000000000',
        grossProfit: '170000000000',
      },
      {
        fiscalDateEnding: '2022-09-30',
        totalRevenue: '394000000000',
        netIncome: '99800000000',
        grossProfit: '171000000000',
      },
    ],
  };

  it('extracts ticker and company name from overview', () => {
    const result = normalizeFinancialData(mockOverview, mockIncomeStatement);
    expect(result.ticker).toBe('AAPL');
    expect(result.companyName).toBe('Apple Inc');
  });

  it('extracts sector and industry', () => {
    const result = normalizeFinancialData(mockOverview, mockIncomeStatement);
    expect(result.sector).toBe('Technology');
    expect(result.industry).toBe('Consumer Electronics');
  });

  it('parses numeric fundamentals correctly', () => {
    const result = normalizeFinancialData(mockOverview, mockIncomeStatement);
    expect(result.marketCap).toBe(3000000000000);
    expect(result.peRatio).toBeCloseTo(28.5);
    expect(result.profitMargin).toBeCloseTo(0.26);
    expect(result.debtToEquity).toBeCloseTo(1.76);
  });

  it('builds revenue history from annual reports (max 5)', () => {
    const result = normalizeFinancialData(mockOverview, mockIncomeStatement);
    expect(result.revenueHistory).toHaveLength(3);
    expect(result.revenueHistory[0].year).toBe('2024');
    expect(result.revenueHistory[0].revenue).toBe(400000000000);
  });

  it('calculates revenue growth rates between consecutive years', () => {
    const result = normalizeFinancialData(mockOverview, mockIncomeStatement);
    expect(result.revenueGrowthRates).toHaveLength(2);
    expect(result.revenueGrowthRates[0].period).toBe('2024 vs 2023');
    // (400B - 380B) / 380B ≈ 0.0526
    expect(result.revenueGrowthRates[0].rate).toBeCloseTo(0.0526, 3);
  });

  it('calculates gross margin from latest year', () => {
    const result = normalizeFinancialData(mockOverview, mockIncomeStatement);
    // 180B / 400B = 0.45
    expect(result.grossMargin).toBeCloseTo(0.45);
  });

  it('handles empty annual reports gracefully', () => {
    const result = normalizeFinancialData(mockOverview, { annualReports: [] });
    expect(result.revenueHistory).toHaveLength(0);
    expect(result.revenueGrowthRates).toHaveLength(0);
    expect(result.grossMargin).toBeNull();
  });

  it('handles missing annualReports key', () => {
    const result = normalizeFinancialData(mockOverview, {});
    expect(result.revenueHistory).toHaveLength(0);
  });
});

// --- Unit tests for API fetch functions (with mocked fetch) ---

describe('fetchCompanyOverview', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns parsed data for a valid ticker', async () => {
    const mockData = { Symbol: 'AAPL', Name: 'Apple Inc' };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const result = await fetchCompanyOverview('AAPL', 'test-key');
    expect(result.Symbol).toBe('AAPL');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('function=OVERVIEW&symbol=AAPL')
    );
  });

  it('throws on HTTP error response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchCompanyOverview('AAPL', 'test-key'))
      .rejects.toThrow('Alpha Vantage API error: 500');
  });

  it('throws on Alpha Vantage error message', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ 'Error Message': 'Invalid API call' }),
    });

    await expect(fetchCompanyOverview('INVALID', 'test-key'))
      .rejects.toThrow('Alpha Vantage error: Invalid API call');
  });

  it('throws on rate limit note', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ 'Note': 'Rate limit exceeded' }),
    });

    await expect(fetchCompanyOverview('AAPL', 'test-key'))
      .rejects.toThrow('Alpha Vantage rate limit');
  });

  it('throws when no data found (missing Symbol)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await expect(fetchCompanyOverview('NOSYMBOL', 'test-key'))
      .rejects.toThrow('No data found for ticker: NOSYMBOL');
  });
});

describe('fetchIncomeStatement', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns parsed data with annual reports', async () => {
    const mockData = {
      annualReports: [{ fiscalDateEnding: '2024-09-30', totalRevenue: '100' }],
    };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const result = await fetchIncomeStatement('AAPL', 'test-key');
    expect(result.annualReports).toHaveLength(1);
  });

  it('throws when no annual reports found', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ annualReports: [] }),
    });

    await expect(fetchIncomeStatement('AAPL', 'test-key'))
      .rejects.toThrow('No income statement data found');
  });
});

describe('getFinancialData', () => {
  const originalFetch = global.fetch;
  const originalEnv = process.env.ALPHA_VANTAGE_API_KEY;

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.ALPHA_VANTAGE_API_KEY = originalEnv;
  });

  it('throws when no API key is provided', async () => {
    delete process.env.ALPHA_VANTAGE_API_KEY;
    await expect(getFinancialData('AAPL'))
      .rejects.toThrow('ALPHA_VANTAGE_API_KEY is required');
  });

  it('fetches and normalizes data end-to-end', async () => {
    const mockOverview = { Symbol: 'AAPL', Name: 'Apple Inc', Sector: 'Tech' };
    const mockIncome = {
      annualReports: [
        {
          fiscalDateEnding: '2024-09-30',
          totalRevenue: '400000000000',
          netIncome: '100000000000',
          grossProfit: '180000000000',
        },
      ],
    };

    let callCount = 0;
    global.fetch = jest.fn().mockImplementation(() => {
      callCount++;
      const data = callCount === 1 ? mockOverview : mockIncome;
      return Promise.resolve({ ok: true, json: () => Promise.resolve(data) });
    });

    const result = await getFinancialData('AAPL', 'test-key');
    expect(result.ticker).toBe('AAPL');
    expect(result.companyName).toBe('Apple Inc');
    expect(result.revenueHistory).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});

/**
 * Standalone test script — verifies the financial data fetcher
 * works against the real Alpha Vantage API.
 *
 * Usage: node scripts/test-financials.js [TICKER]
 * Example: node scripts/test-financials.js AAPL
 *
 * Requires ALPHA_VANTAGE_API_KEY in .env
 */

require('dotenv').config();
const { getFinancialData } = require('../lib/dataSources/financials');

const ticker = process.argv[2] || 'AAPL';

async function main() {
  console.log(`\n🔍 Fetching financial data for: ${ticker}\n`);

  try {
    const data = await getFinancialData(ticker);

    console.log(`✅ Company: ${data.companyName} (${data.ticker})`);
    console.log(`   Sector: ${data.sector} | Industry: ${data.industry}`);
    console.log(`   Market Cap: $${(data.marketCap / 1e9).toFixed(1)}B`);
    console.log(`   P/E Ratio: ${data.peRatio}`);
    console.log(`   Profit Margin: ${(data.profitMargin * 100).toFixed(1)}%`);
    console.log(`   Debt-to-Equity: ${data.debtToEquity}`);
    console.log(`   Gross Margin: ${data.grossMargin ? (data.grossMargin * 100).toFixed(1) + '%' : 'N/A'}`);

    console.log(`\n📊 Revenue History:`);
    for (const entry of data.revenueHistory) {
      console.log(`   ${entry.year}: $${(entry.revenue / 1e9).toFixed(1)}B revenue, $${(entry.netIncome / 1e9).toFixed(1)}B net income`);
    }

    console.log(`\n📈 Revenue Growth Rates:`);
    for (const rate of data.revenueGrowthRates) {
      console.log(`   ${rate.period}: ${rate.rate !== null ? (rate.rate * 100).toFixed(1) + '%' : 'N/A'}`);
    }

    console.log('\n✅ Financial data fetcher is working correctly.\n');
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  }
}

main();

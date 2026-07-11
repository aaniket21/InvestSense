/**
 * Standalone test script — verifies the news data fetcher
 * works against the real Tavily API.
 *
 * Usage: node scripts/test-news.js [COMPANY_NAME]
 * Example: node scripts/test-news.js "Apple Inc"
 *
 * Requires TAVILY_API_KEY in .env
 */

require('dotenv').config();
const { getNewsData, getManagementNews } = require('../lib/dataSources/news');

const companyName = process.argv[2] || 'Apple Inc';

async function main() {
  console.log(`\n🔍 Fetching news for: ${companyName}\n`);

  try {
    const newsData = await getNewsData(companyName, { maxResults: 5 });

    console.log(`✅ Query: "${newsData.query}"`);
    console.log(`   Total results: ${newsData.totalResults}`);

    if (newsData.answer) {
      console.log(`\n📝 Summary: ${newsData.answer.substring(0, 200)}...`);
    }

    console.log(`\n📰 Articles:`);
    for (const article of newsData.articles) {
      console.log(`   • ${article.title}`);
      console.log(`     ${article.url}`);
      console.log(`     Score: ${article.score} | Date: ${article.publishedDate || 'N/A'}`);
      console.log();
    }

    console.log('\n--- Management News ---\n');
    const mgmtData = await getManagementNews(companyName, { maxResults: 3 });
    console.log(`✅ Management query: "${mgmtData.query}"`);
    console.log(`   Total results: ${mgmtData.totalResults}`);

    for (const article of mgmtData.articles) {
      console.log(`   • ${article.title}`);
    }

    console.log('\n✅ News data fetcher is working correctly.\n');
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  }
}

main();

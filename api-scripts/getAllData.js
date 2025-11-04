#!/usr/bin/env node

/**
 * Hyperliquid API - Get All Data
 * Fetches all available data for the vault in one go
 */

const { getAccountState } = require('./getAccountState');
const { getOpenOrders } = require('./getOpenOrders');
const { getUserFills } = require('./getUserFills');
const { getFundingHistory } = require('./getFundingHistory');
const { getMarketData } = require('./getMarketData');

async function getAllData() {
  console.log("\n");
  console.log("█".repeat(60));
  console.log("  HYPERLIQUID - COMPLETE DATA FETCH");
  console.log("█".repeat(60));
  console.log("\n");

  const results = {};

  try {
    // 1. Account State
    console.log("📊 Fetching account state...");
    results.accountState = await getAccountState();
    console.log("\n");

    // 2. Open Orders
    console.log("📋 Fetching open orders...");
    results.openOrders = await getOpenOrders();
    console.log("\n");

    // 3. User Fills
    console.log("💰 Fetching recent fills...");
    results.fills = await getUserFills();
    console.log("\n");

    // 4. Funding History
    console.log("💸 Fetching funding history...");
    results.fundingHistory = await getFundingHistory();
    console.log("\n");

    // 5. Market Data
    console.log("📈 Fetching market data...");
    results.marketData = await getMarketData();
    console.log("\n");

    // Summary
    console.log("█".repeat(60));
    console.log("  SUMMARY");
    console.log("█".repeat(60));
    console.log("✅ Account State:     Fetched");
    console.log("✅ Open Orders:       " + (results.openOrders?.length || 0) + " orders");
    console.log("✅ Recent Fills:      " + (results.fills?.length || 0) + " fills");
    console.log("✅ Funding History:   " + (results.fundingHistory?.length || 0) + " payments");
    console.log("✅ Market Data:       Fetched");
    console.log("█".repeat(60));
    console.log("\n");

    return results;
  } catch (error) {
    console.error("\n❌ Error fetching data:", error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  getAllData();
}

module.exports = { getAllData };


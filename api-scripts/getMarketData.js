#!/usr/bin/env node

const { API_URL, NETWORK_NAME, displayNetworkInfo } = require('./config');

/**
 * Hyperliquid API - Get Market Data
 * Fetches market information for all available assets
 * Supports both testnet and mainnet
 */

async function getMarketData() {
  console.log("=".repeat(60));
  console.log(`Hyperliquid Market Data - ${NETWORK_NAME}`);
  console.log("=".repeat(60));
  displayNetworkInfo();
  console.log("");

  try {
    // Get all mids (market prices)
    const midsResponse = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "allMids" }),
    });

    if (!midsResponse.ok) {
      throw new Error(`HTTP ${midsResponse.status}: ${midsResponse.statusText}`);
    }

    const mids = await midsResponse.json();

    console.log("═══ MARKET PRICES ═══\n");
    
    if (mids && Object.keys(mids).length > 0) {
      const entries = Object.entries(mids);
      entries.forEach(([coin, price], idx) => {
        console.log(`${coin.padEnd(10)} $${price}`);
      });
      console.log(`\nTotal Markets: ${entries.length}`);
    } else {
      console.log("No market data available");
    }

    // Get meta info
    console.log("\n═══ META INFORMATION ═══\n");
    const metaResponse = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "meta" }),
    });

    if (metaResponse.ok) {
      const meta = await metaResponse.json();
      
      if (meta.universe) {
        console.log("Available Assets:");
        meta.universe.forEach((asset, idx) => {
          console.log(`  ${idx}. ${asset.name} (ID: ${idx})`);
          if (asset.szDecimals) console.log(`     Size Decimals: ${asset.szDecimals}`);
        });
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Market data fetched successfully");
    
    return { mids };
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  getMarketData();
}

module.exports = { getMarketData };


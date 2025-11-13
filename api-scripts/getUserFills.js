#!/usr/bin/env node

const dotenv = require('dotenv');
dotenv.config();

const { API_URL, NETWORK_NAME, displayNetworkInfo } = require('./config');

/**
 * Hyperliquid API - Get User Fills
 * Fetches recent trade fills for the vault address
 * Supports both testnet and mainnet
 */

const VAULT_ADDRESS = process.env.VAULT_ADDRESS;

async function getUserFills() {
  console.log("=".repeat(60));
  console.log(`Hyperliquid User Fills - ${NETWORK_NAME}`);
  console.log("=".repeat(60));
  console.log("Vault Address:", VAULT_ADDRESS);
  displayNetworkInfo();
  console.log("");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "userFills",
        user: VAULT_ADDRESS,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const fills = await response.json();

    console.log("═══ RECENT FILLS ═══\n");
    
    if (fills && fills.length > 0) {
      fills.forEach((fill, idx) => {
        console.log(`Fill ${idx + 1}:`);
        console.log(`  Asset:       ${fill.coin}`);
        console.log(`  Side:        ${fill.side}`);
        console.log(`  Price:       $${fill.px}`);
        console.log(`  Size:        ${fill.sz} ${fill.coin}`);
        console.log(`  Time:        ${new Date(fill.time).toISOString()}`);
        console.log(`  Order ID:    ${fill.oid}`);
        if (fill.fee) console.log(`  Fee:         $${fill.fee}`);
        if (fill.feeToken) console.log(`  Fee Token:   ${fill.feeToken}`);
        if (fill.tid) console.log(`  Trade ID:    ${fill.tid}`);
        console.log("");
      });
      console.log(`Total Fills: ${fills.length}`);
    } else {
      console.log("No recent fills");
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Fills fetched successfully");
    
    return fills;
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  getUserFills();
}

module.exports = { getUserFills };


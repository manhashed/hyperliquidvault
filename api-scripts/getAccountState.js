#!/usr/bin/env node

const dotenv = require('dotenv');
dotenv.config();

const { API_URL, NETWORK_NAME, displayNetworkInfo } = require('./config');

/**
 * Hyperliquid API - Get Account State
 * Fetches comprehensive account information including positions, margin, and balances
 */

const VAULT_ADDRESS = process.env.VAULT_ADDRESS;

async function getAccountState() {
  console.log("=".repeat(60));
  console.log(`Hyperliquid Account State - ${NETWORK_NAME}`);
  console.log("=".repeat(60));
  console.log("Vault Address:", VAULT_ADDRESS);
  displayNetworkInfo();
  console.log("");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "clearinghouseState",
        user: VAULT_ADDRESS,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Account Value Summary
    console.log("═══ ACCOUNT SUMMARY ═══");
    if (data.marginSummary) {
      console.log("Account Value:       $" + (data.marginSummary.accountValue || "0.0"));
      console.log("Total Position Value: $" + (data.marginSummary.totalNtlPos || "0.0"));
      console.log("Total Margin Used:    $" + (data.marginSummary.totalMarginUsed || "0.0"));
      console.log("Total Raw USD:        $" + (data.marginSummary.totalRawUsd || "0.0"));
    }

    if (data.crossMarginSummary) {
      console.log("\n═══ CROSS MARGIN ═══");
      console.log("Account Value: $" + (data.crossMarginSummary.accountValue || "0.0"));
      console.log("Total Raw USD: $" + (data.crossMarginSummary.totalRawUsd || "0.0"));
      console.log("Withdrawable:  $" + (data.crossMarginSummary.withdrawable || "0.0"));
    }

    // Open Positions
    console.log("\n═══ OPEN POSITIONS ═══");
    if (data.assetPositions && data.assetPositions.length > 0) {
      data.assetPositions.forEach((pos, idx) => {
        const p = pos.position;
        const side = parseFloat(p.szi) > 0 ? "LONG" : "SHORT";
        const sizeMag = Math.abs(parseFloat(p.szi));
        
        console.log(`\nPosition ${idx + 1}: ${p.coin}`);
        console.log(`  Side:           ${side}`);
        console.log(`  Size:           ${sizeMag} ${p.coin}`);
        console.log(`  Entry Price:    $${p.entryPx}`);
        console.log(`  Position Value: $${p.positionValue}`);
        console.log(`  Unrealized PnL: $${p.unrealizedPnl}`);
        console.log(`  ROE:            ${p.returnOnEquity}%`);
        if (p.leverage?.value) {
          console.log(`  Leverage:       ${p.leverage.value}x`);
        }
      });
    } else {
      console.log("No open positions");
    }

    // Save raw data
    console.log("\n" + "=".repeat(60));
    console.log("✅ Data fetched successfully");
    console.log("Timestamp:", new Date(data.time).toISOString());
    
    return data;
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  getAccountState();
}

module.exports = { getAccountState };


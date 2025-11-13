#!/usr/bin/env node

const dotenv = require('dotenv');
dotenv.config();

const { API_URL, NETWORK_NAME, displayNetworkInfo } = require('./config');

/**
 * Hyperliquid API - Get Funding History
 * Fetches funding rate payments for the vault address
 * Supports both testnet and mainnet
 */

const VAULT_ADDRESS = process.env.VAULT_ADDRESS;

async function getFundingHistory() {
  console.log("=".repeat(60));
  console.log(`Hyperliquid Funding History - ${NETWORK_NAME}`);
  console.log("=".repeat(60));
  console.log("Vault Address:", VAULT_ADDRESS);
  displayNetworkInfo();
  console.log("");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "userFunding",
        user: VAULT_ADDRESS,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const funding = await response.json();

    console.log("═══ FUNDING PAYMENTS ═══\n");
    
    if (funding && funding.length > 0) {
      let totalFunding = 0;
      
      funding.forEach((payment, idx) => {
        console.log(`Payment ${idx + 1}:`);
        console.log(`  Asset:    ${payment.coin}`);
        console.log(`  Amount:   $${payment.fundingRate}`);
        console.log(`  Time:     ${new Date(payment.time).toISOString()}`);
        if (payment.usdc) {
          console.log(`  USDC:     $${payment.usdc}`);
          totalFunding += parseFloat(payment.usdc);
        }
        console.log("");
      });
      
      console.log(`Total Payments: ${funding.length}`);
      console.log(`Net Funding:    $${totalFunding.toFixed(4)}`);
    } else {
      console.log("No funding history");
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Funding history fetched successfully");
    
    return funding;
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  getFundingHistory();
}

module.exports = { getFundingHistory };


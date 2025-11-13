#!/usr/bin/env node

const dotenv = require('dotenv');
dotenv.config();

const { API_URL, NETWORK_NAME, displayNetworkInfo } = require('./config');

/**
 * Hyperliquid API - Get Open Orders
 * Fetches all open orders for the vault address
 * Supports both testnet and mainnet
 */

const VAULT_ADDRESS = process.env.VAULT_ADDRESS;

async function getOpenOrders() {
  console.log("=".repeat(60));
  console.log(`Hyperliquid Open Orders - ${NETWORK_NAME}`);
  console.log("=".repeat(60));
  console.log("Vault Address:", VAULT_ADDRESS);
  displayNetworkInfo();
  console.log("");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "openOrders",
        user: VAULT_ADDRESS,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const orders = await response.json();

    console.log("═══ OPEN ORDERS ═══\n");
    
    if (orders && orders.length > 0) {
      orders.forEach((order, idx) => {
        console.log(`Order ${idx + 1}:`);
        console.log(`  Asset:       ${order.coin}`);
        console.log(`  Side:        ${order.side}`);
        console.log(`  Price:       $${order.limitPx}`);
        console.log(`  Size:        ${order.sz} ${order.coin}`);
        console.log(`  Order ID:    ${order.oid}`);
        console.log(`  Timestamp:   ${new Date(order.timestamp).toISOString()}`);
        if (order.cloid) console.log(`  Client OID:  ${order.cloid}`);
        if (order.orderType) console.log(`  Type:        ${order.orderType}`);
        if (order.reduceOnly) console.log(`  Reduce Only: ${order.reduceOnly}`);
        console.log("");
      });
      console.log(`Total Open Orders: ${orders.length}`);
    } else {
      console.log("No open orders");
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Orders fetched successfully");
    
    return orders;
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  getOpenOrders();
}

module.exports = { getOpenOrders };


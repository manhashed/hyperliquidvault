import { ethers } from "hardhat";

/**
 * Close all open positions by fetching from API and placing reduce-only orders
 */

const VAULT_ADDRESS = process.env.VAULT_ADDRESS || "0xB6b9Db33FCdDC4c2FCCfc049D72aF5D0766A26e6";
const API_URL = "https://api.hyperliquid-testnet.xyz/info";

// Asset ID mapping (partial - add more as needed)
const ASSET_MAP: { [key: string]: number } = {
  "BTC": 0,
  "SOL": 0,
  "APT": 1,
  "ATOM": 2,
  "ETH": 4,
  "HYPE": 135,
  // Add more as needed from meta endpoint
};

async function getOpenPositions() {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "clearinghouseState",
      user: VAULT_ADDRESS,
    }),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.assetPositions || [];
}

async function getMarketPrices() {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "allMids" }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get market prices: ${response.status}`);
  }

  return await response.json();
}

async function main() {
  console.log("═".repeat(60));
  console.log("Close All Open Positions");
  console.log("═".repeat(60));
  console.log("Vault Address:", VAULT_ADDRESS);
  console.log("");

  // Get vault contract
  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);
  const vault = await ethers.getContractAt("HyperCoreVault", VAULT_ADDRESS);

  // Fetch open positions
  console.log("Fetching open positions...");
  const positions = await getOpenPositions();

  if (!positions || positions.length === 0) {
    console.log("✅ No open positions to close");
    return;
  }

  // Fetch current market prices
  console.log("Fetching market prices...");
  const prices = await getMarketPrices();

  console.log(`\nFound ${positions.length} open position(s)\n`);

  // Close each position
  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i].position;
    const coin = pos.coin;
    const szi = parseFloat(pos.szi);
    const isLong = szi > 0;
    const sizeMagnitude = Math.abs(szi);

    console.log("─".repeat(60));
    console.log(`Position ${i + 1}/${positions.length}: ${coin}`);
    console.log(`  Current: ${isLong ? "LONG" : "SHORT"} ${sizeMagnitude}`);

    // Get asset ID
    const assetId = ASSET_MAP[coin];
    if (assetId === undefined) {
      console.log(`  ⚠️  Unknown asset ID for ${coin}, skipping...`);
      continue;
    }

    // Get current price
    const currentPrice = parseFloat(prices[coin] || pos.entryPx);
    
    // Calculate close order parameters
    const isBuy = !isLong; // Close LONG with SELL, SHORT with BUY
    const priceAdjustment = isLong ? 0.99 : 1.01; // Aggressive pricing
    const executionPrice = currentPrice * priceAdjustment;

    // Scale to 10^8
    const limitPx = BigInt(Math.floor(executionPrice * 1e8));
    const size = BigInt(Math.floor(sizeMagnitude * 1e8));

    console.log(`  Closing: ${isBuy ? "BUY" : "SELL"} ${sizeMagnitude} at $${executionPrice.toFixed(2)}`);

    try {
      const tx = await vault.placeLimitOrder(
        assetId,
        isBuy,
        limitPx,
        size,
        true, // reduceOnly
        3,    // IOC
        0n    // cloid
      );

      console.log(`  ✅ Order placed: ${tx.hash}`);
      await tx.wait();
      console.log(`  ✅ Confirmed`);

    } catch (error: any) {
      console.error(`  ❌ Failed: ${error.message}`);
    }
  }

  console.log("\n" + "═".repeat(60));
  console.log("✅ Close orders submitted for all positions");
  console.log("═".repeat(60));
  console.log("\n💡 Run 'node api-scripts/getAccountState.js' to verify");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


import { ethers } from "hardhat";

async function main() {
  const VAULT_ADDRESS = process.env.VAULT_ADDRESS || "0xB6b9Db33FCdDC4c2FCCfc049D72aF5D0766A26e6";
  
  // Hyperliquid testnet API endpoint
  const API_URL = "https://api.hyperliquid-testnet.xyz/info";

  console.log("Fetching open positions from Hyperliquid testnet...");
  console.log("Vault address:", VAULT_ADDRESS);
  console.log("API endpoint:", API_URL);
  console.log("");

  try {
    // Fetch user state from Hyperliquid API
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "clearinghouseState",
        user: VAULT_ADDRESS,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    console.log("Response:", await response.text());

    const data = await response.json();
    
    console.log("=== Account Summary ===");
    console.log("Address:", VAULT_ADDRESS);
    
    if (data.assetPositions && data.assetPositions.length > 0) {
      console.log("\n=== Open Positions ===");
      console.log("");
      
      data.assetPositions.forEach((position: any, index: number) => {
        const coin = position.position.coin;
        const szi = position.position.szi; // Size (positive = long, negative = short)
        const entryPx = position.position.entryPx;
        const positionValue = position.position.positionValue;
        const unrealizedPnl = position.position.unrealizedPnl;
        const returnOnEquity = position.position.returnOnEquity;
        const leverage = position.position.leverage?.value || "N/A";
        
        const side = parseFloat(szi) > 0 ? "LONG" : "SHORT";
        const sizeMag = Math.abs(parseFloat(szi));
        
        console.log(`Position ${index + 1}: ${coin}`);
        console.log(`  Side: ${side}`);
        console.log(`  Size: ${sizeMag} ${coin}`);
        console.log(`  Entry Price: $${entryPx}`);
        console.log(`  Position Value: $${positionValue}`);
        console.log(`  Unrealized PnL: $${unrealizedPnl}`);
        console.log(`  ROE: ${returnOnEquity}%`);
        console.log(`  Leverage: ${leverage}x`);
        console.log("");
      });
    } else {
      console.log("\n✅ No open positions");
    }

    // Display margin info
    if (data.marginSummary) {
      console.log("=== Margin Summary ===");
      console.log("Account Value: $" + data.marginSummary.accountValue);
      console.log("Total Margin Used: $" + data.marginSummary.totalMarginUsed);
      console.log("Total Position Value: $" + data.marginSummary.totalNtlPos);
      console.log("");
    }

    // Display cross margin summary
    if (data.crossMarginSummary) {
      console.log("=== Cross Margin ===");
      console.log("Account Value: $" + data.crossMarginSummary.accountValue);
      console.log("Total Raw USD: $" + data.crossMarginSummary.totalRawUsd);
      console.log("Withdrawable: $" + data.crossMarginSummary.withdrawable);
      console.log("");
    }

  } catch (error: any) {
    console.error("\n❌ Error fetching positions:");
    console.error(error.message);
    
    // Try alternative endpoint
    console.log("\nTrying alternative API endpoint...");
    try {
      const altResponse = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "userState",
          user: VAULT_ADDRESS,
        }),
      });

      if (altResponse.ok) {
        const altData = await altResponse.json();
        console.log("\n=== Raw Response ===");
        console.log(JSON.stringify(altData, null, 2));
      }
    } catch (altError: any) {
      console.error("Alternative endpoint also failed:", altError.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


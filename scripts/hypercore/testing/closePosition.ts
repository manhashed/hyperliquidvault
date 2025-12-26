import { ethers } from "hardhat";
import hre from "hardhat";

/**
 * Close a position by placing a reduce-only order in the opposite direction
 */

interface ClosePositionParams {
  assetId: number;
  assetName: string;
  positionSize: number; // Signed: positive = long, negative = short
  currentPrice: number;
}

async function main() {
  const VAULT_ADDRESS = process.env.VAULT_ADDRESS || "0xB6b9Db33FCdDC4c2FCCfc049D72aF5D0766A26e6";

  // Detect network
  const networkName = hre.network.name;
  const isMainnet = networkName === "hyperEvmMainnet";

  // Configure position to close here
  // You can get this info from api-scripts/getAccountState.js
  // Note: Asset IDs differ between testnet and mainnet
  //   Testnet: BTC=3, HYPE=1105 | Mainnet: BTC=0, HYPE=150
  const position: ClosePositionParams = {
    assetId: isMainnet ? 0 : 3,  // BTC asset ID (mainnet: 0, testnet: 3)
    assetName: "BTC",
    positionSize: 0.003,         // Positive = LONG position, Negative = SHORT position
    currentPrice: 107000,        // Current market price (set aggressively for immediate fill)
  };

  console.log("Closing position on HyperCoreVault...");
  console.log(`Network: ${isMainnet ? "MAINNET" : "TESTNET"} (${networkName})`);
  console.log("Vault address:", VAULT_ADDRESS);
  console.log("");

  // Get the signer (owner)
  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);

  // Get vault contract
  const vault = await ethers.getContractAt("HyperCoreVault", VAULT_ADDRESS);

  // Determine order parameters
  const isLongPosition = position.positionSize > 0;
  const isBuy = !isLongPosition; // To close: if LONG, place SELL; if SHORT, place BUY
  const sizeMagnitude = Math.abs(position.positionSize);

  // For immediate execution, set aggressive price
  // If closing LONG: set price slightly below market
  // If closing SHORT: set price slightly above market
  const priceAdjustment = isLongPosition ? 0.99 : 1.01;
  const executionPrice = position.currentPrice * priceAdjustment;

  // Scale to 10^8
  const limitPx = BigInt(Math.floor(executionPrice * 1e8));
  const size = BigInt(Math.floor(sizeMagnitude * 1e8));
  const reduceOnly = true; // CRITICAL: Must be true to close position
  const tif = 3; // IOC (Immediate or Cancel) for quick execution
  const cloid = 0n;

  console.log("═══ CLOSE POSITION PARAMETERS ═══");
  console.log("Asset:", position.assetName, `(ID: ${position.assetId})`);
  console.log("Current Position:", position.positionSize > 0 ? "LONG" : "SHORT", sizeMagnitude);
  console.log("Closing Order Side:", isBuy ? "BUY" : "SELL");
  console.log("Execution Price:", executionPrice);
  console.log("Size:", sizeMagnitude, position.assetName);
  console.log("Reduce Only:", reduceOnly, "✅");
  console.log("Time in Force: IOC");
  console.log("═══════════════════════════════════\n");

  try {
    console.log("Submitting close order...");
    const tx = await vault.placeLimitOrder(
      position.assetId,
      isBuy,
      limitPx,
      size,
      reduceOnly,
      tif,
      cloid
    );
    
    console.log("Transaction hash:", tx.hash);
    console.log("Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("✅ Position close order placed successfully!");
    console.log("Block number:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());
    
    console.log("\nTransaction:", `https://testnet.purrsec.com/tx/${tx.hash}`);
    console.log("\n💡 Run 'node api-scripts/getAccountState.js' to verify position is closed");
  } catch (error: any) {
    console.error("\n❌ Failed to close position:");
    console.error(error.message);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


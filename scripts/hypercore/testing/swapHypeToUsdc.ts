import { ethers } from "hardhat";
import hre from "hardhat";

/**
 * Swap HYPE to USDC on Spot Market
 * Uses placeLimitOrder with aggressive pricing for immediate execution
 */

// Swap configuration
interface SwapConfig {
  name: string;
  assetId: number;        // Spot asset ID for HYPE/USDC pair
  amountHype: number;     // Amount of HYPE to sell
  limitPrice: number;     // Limit price (set low for quick sell)
  tif: number;            // Time in force: 3 = IOC (Immediate or Cancel)
  slippageTolerance: number; // Percentage (e.g., 5 for 5%)
}

// Network-specific configurations
const NETWORK_CONFIGS = {
  testnet: {
    assetId: 114,  // HYPE/USDC spot pair on testnet
    stablecoin: "USDC",
  },
  mainnet: {
    assetId: 268,   // HYPE/USDT spot pair on mainnet
    stablecoin: "USDC",
  },
};

async function main() {
  const VAULT_ADDRESS = process.env.VAULT_ADDRESS;
  
  // Detect network
  const networkName = hre.network.name;
  const isMainnet = networkName === "hyperEvmMainnet";
  const networkConfig = isMainnet ? NETWORK_CONFIGS.mainnet : NETWORK_CONFIGS.testnet;
  
  // ═══════════════════════════════════════════════════════════════════
  // SWAP CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════
  const config: SwapConfig = {
    name: `HYPE → ${networkConfig.stablecoin} Swap`,
    assetId: networkConfig.assetId,
    amountHype: 20,                  // Amount of HYPE to sell
    limitPrice: 0.9,                    // Minimum price per HYPE (set conservatively low)
    tif: 3,                            // GTC - Good Till Cancelled
    slippageTolerance: 5              // 5% slippage tolerance
  };

  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`       SWAP HYPE TO ${networkConfig.stablecoin} ON SPOT MARKET`);
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`Network: ${isMainnet ? "MAINNET" : "TESTNET"} (${networkName})`);
  console.log(`Vault Address: ${VAULT_ADDRESS}`);
  console.log("═══════════════════════════════════════════════════════════════\n");

  // Get signer (owner)
  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);
  console.log("");

  // Get vault contract
  const vault = await ethers.getContractAt("HyperCoreVault", VAULT_ADDRESS);

  // Verify owner
  const owner = await vault.owner();
  if (owner.toLowerCase() !== signer.address.toLowerCase()) {
    console.error("❌ Error: Signer is not the vault owner");
    console.error(`   Vault owner: ${owner}`);
    console.error(`   Your address: ${signer.address}`);
    process.exit(1);
  }

  // Prepare order parameters
  const asset = config.assetId;
  const isBuy = false;                                    // SELL HYPE for stablecoin
  const limitPx = BigInt(Math.floor(config.limitPrice * 1e8)); // Price scaled to 10^8
  const sz = BigInt(Math.floor(config.amountHype * 1e8));      // Size scaled to 10^8
  const reduceOnly = false;                               // Not reduce-only (spot swap)
  
  // Time in force (pass directly as number)
  // 1 = ALO, 2 = GTC, 3 = IOC
  const tif = config.tif;
  
  const cloid = 0n;  // Client order ID (0 for auto-generated)

  // Calculate expected output
  const expectedOutput = config.amountHype * config.limitPrice;
  const minOutput = expectedOutput * (1 - config.slippageTolerance / 100);

  console.log("═══ SWAP PARAMETERS ═══");
  console.log("Swap Type:            HYPE →", networkConfig.stablecoin, "(Spot Market)");
  console.log("Asset ID:             ", asset);
  console.log("Direction:            SELL HYPE");
  console.log("Amount (HYPE):        ", config.amountHype, "HYPE");
  console.log(`Limit Price:          ${config.limitPrice} ${networkConfig.stablecoin} per HYPE`);
  console.log(`Expected Output:      ~${expectedOutput.toFixed(2)} ${networkConfig.stablecoin}`);
  console.log(`Minimum Output:       ~${minOutput.toFixed(2)} ${networkConfig.stablecoin} (with slippage)`);
  console.log("Time in Force:        ", config.tif === 3 ? "IOC (Immediate or Cancel)" : config.tif === 1 ? "ALO" : "GTC");
  console.log("Reduce Only:          ", reduceOnly);
  console.log("");
  console.log("Scaled Values:");
  console.log("  Limit Price (10^8): ", limitPx.toString());
  console.log("  Size (10^8):        ", sz.toString());
  console.log("  TIF:                ", tif);
  console.log("═══════════════════════\n");

  // Confirmation
  console.log("⚠️  You are about to swap:");
  console.log(`   ${config.amountHype} HYPE → ~${expectedOutput.toFixed(2)} ${networkConfig.stablecoin}`);
  console.log(`   Minimum: ${minOutput.toFixed(2)} ${networkConfig.stablecoin} (${config.slippageTolerance}% slippage)\n`);

  try {
    console.log("📤 Submitting swap order to vault...");
    
    // Call placeLimitOrder on the vault
    const tx = await vault.placeLimitOrder(
      asset,
      isBuy,
      limitPx,
      sz,
      reduceOnly,
      tif,
      cloid
    );

    console.log("✅ Transaction submitted!");
    console.log("Transaction hash:", tx.hash);
    console.log("Waiting for confirmation...\n");

    const receipt = await tx.wait();
    
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("                     SWAP ORDER PLACED");
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("Status:               ✅ Confirmed");
    console.log("Block number:         ", receipt.blockNumber);
    console.log("Gas used:             ", receipt.gasUsed.toString());
    console.log("Transaction:          ", `https://testnet.purrsec.com/tx/${tx.hash}`);
    console.log("═══════════════════════════════════════════════════════════════\n");

    console.log("📊 NEXT STEPS:");
    console.log("1. Check if order filled:");
    console.log("   node api-scripts/getVaultData.js");
    console.log("");
    console.log("2. View order status:");
    console.log("   Check 'Recent Fills' section for execution");
    console.log("");
    console.log("3. Check spot balances:");
    console.log(`   Your ${networkConfig.stablecoin} balance should increase`);
    console.log("   Your HYPE balance should decrease");
    console.log("═══════════════════════════════════════════════════════════════\n");

    console.log("💡 NOTES:");
    console.log("- IOC orders execute immediately or cancel");
    console.log("- Check fills to see actual execution price");
    console.log("- Spot swaps may have better/worse prices than limit");
    console.log(`- Use getVaultData.js to verify ${networkConfig.stablecoin} received\n`);

  } catch (error: any) {
    console.error("\n❌ Swap order failed:");
    console.error(error.message);
    
    if (error.message.includes("insufficient")) {
      console.error("\n💡 Possible issues:");
      console.error("   - Insufficient HYPE balance in spot");
      console.error("   - Check balance: node api-scripts/getVaultData.js");
      console.error(`   - Network: ${isMainnet ? "MAINNET" : "TESTNET"}`);
    }
    
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


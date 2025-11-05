import { ethers } from "hardhat";

/**
 * Swap USDC to HYPE on Spot Market
 * Uses placeLimitOrder with aggressive pricing for immediate execution
 */

// Swap configuration
interface SwapConfig {
  name: string;
  assetId: number;        // Spot asset ID for HYPE/USDC pair
  amountUsdc: number;     // Amount of USDC to spend
  limitPrice: number;     // Maximum USDC per HYPE (set high for quick buy)
  tif: number;            // Time in force: 3 = IOC (Immediate or Cancel)
  slippageTolerance: number; // Percentage (e.g., 5 for 5%)
}

async function main() {
  const VAULT_ADDRESS = process.env.VAULT_ADDRESS || "0xC181c7186C75F885A8f5d12D49ce9612e9091Ae0";
  
  // ═══════════════════════════════════════════════════════════════════
  // SWAP CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════
  const config: SwapConfig = {
    name: "USDC → HYPE Swap",
    assetId: 1105,                    // HYPE spot asset ID
    amountUsdc: 10,                   // Amount of USDC to spend
    limitPrice: 30,                   // Maximum USDC per HYPE (set conservatively high)
    tif: 3,                           // IOC - Immediate or Cancel
    slippageTolerance: 5              // 5% slippage tolerance
  };

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("              SWAP USDC TO HYPE ON SPOT MARKET");
  console.log("═══════════════════════════════════════════════════════════════");
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

  // Calculate HYPE amount to buy
  const hypeAmount = config.amountUsdc / config.limitPrice;
  
  // Prepare order parameters
  const asset = config.assetId;
  const isBuy = true;                                     // BUY HYPE with USDC
  const limitPx = BigInt(Math.floor(config.limitPrice * 1e8)); // Price scaled to 10^8
  const sz = BigInt(Math.floor(hypeAmount * 1e8));             // Size scaled to 10^8
  const reduceOnly = false;                               // Not reduce-only (spot swap)
  
  // Time in force encoding
  // 1 = Alo (Add Liquidity Only)
  // 2 = Ioc (Immediate or Cancel) - default
  // 3 = Gtc (Good til Cancel)
  let tifValue: number;
  switch (config.tif) {
    case 1: tifValue = 0; break;  // ALO
    case 2: tifValue = 1; break;  // IOC
    case 3: tifValue = 2; break;  // GTC
    default: tifValue = 1;        // IOC default
  }
  // Convert to hex string for bytes1 encoding
  const encodedTif = ethers.hexlify(new Uint8Array([tifValue]));
  
  const cloid = 0n;  // Client order ID (0 for auto-generated)

  // Calculate expected HYPE output
  const expectedHype = hypeAmount;
  const minHype = expectedHype * (1 - config.slippageTolerance / 100);

  console.log("═══ SWAP PARAMETERS ═══");
  console.log("Swap Type:            USDC → HYPE (Spot Market)");
  console.log("Asset ID:             ", asset);
  console.log("Direction:            BUY HYPE");
  console.log("Amount (USDC):        ", config.amountUsdc, "USDC");
  console.log("Limit Price:          ", config.limitPrice, "USDC per HYPE");
  console.log("Expected Output:      ~", expectedHype.toFixed(4), "HYPE");
  console.log("Minimum Output:       ~", minHype.toFixed(4), "HYPE (with slippage)");
  console.log("Time in Force:        ", config.tif === 3 ? "IOC (Immediate or Cancel)" : config.tif === 1 ? "ALO" : "GTC");
  console.log("Reduce Only:          ", reduceOnly);
  console.log("");
  console.log("Scaled Values:");
  console.log("  Limit Price (10^8): ", limitPx.toString());
  console.log("  Size (10^8):        ", sz.toString());
  console.log("  TIF Encoded:        ", tifValue);
  console.log("═══════════════════════\n");

  // Confirmation
  console.log("⚠️  You are about to swap:");
  console.log(`   ${config.amountUsdc} USDC → ~${expectedHype.toFixed(4)} HYPE`);
  console.log(`   Minimum: ${minHype.toFixed(4)} HYPE (${config.slippageTolerance}% slippage)\n`);

  try {
    console.log("📤 Submitting swap order to vault...");
    
    // Call placeLimitOrder on the vault
    const tx = await vault.placeLimitOrder(
      asset,
      isBuy,
      limitPx,
      sz,
      reduceOnly,
      encodedTif,
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
    console.log("   Your HYPE balance should increase");
    console.log("   Your USDC balance should decrease");
    console.log("═══════════════════════════════════════════════════════════════\n");

    console.log("💡 NOTES:");
    console.log("- IOC orders execute immediately or cancel");
    console.log("- Check fills to see actual execution price");
    console.log("- Spot swaps may have better/worse prices than limit");
    console.log("- Use getVaultData.js to verify HYPE received\n");

  } catch (error: any) {
    console.error("\n❌ Swap order failed:");
    console.error(error.message);
    
    if (error.message.includes("insufficient")) {
      console.error("\n💡 Possible issues:");
      console.error("   - Insufficient USDC balance in spot");
      console.error("   - Check balance: node api-scripts/getVaultData.js");
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


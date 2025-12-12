import { ethers } from "hardhat";
import hre from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();


async function main() {
  // Detect network
  const networkName = hre.network.name;
  const isMainnet = networkName === "hyperEvmMainnet";

  const USDC_HYPER_SCALE = isMainnet ? 1e6 : 1e8; 

  // Transfer parameters
  const AMOUNT = 1; // Amount in stablecoin units (USDC/USDT)
  const TO_PERP = false; // true = Spot → Perp, false = Perp → Spot

  console.log("=".repeat(80));
  console.log(`USD Class Transfer (Spot ↔ Perp) on HyperEVM ${isMainnet ? "Mainnet" : "Testnet"}`);
  console.log("=".repeat(80));

  // Get vault address from environment or deployment-info.json
  const fs = require('fs');
  let VAULT_ADDRESS = process.env.VAULT_ADDRESS;
  
  if (!VAULT_ADDRESS && fs.existsSync('deployment-info.json')) {
    const deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
    VAULT_ADDRESS = deploymentInfo.proxy;
    console.log("📁 Loaded vault address from deployment-info.json");
  }
  
  if (!VAULT_ADDRESS) {
    console.error("❌ VAULT_ADDRESS not found!");
    console.log("Please set VAULT_ADDRESS environment variable or ensure deployment-info.json exists");
    process.exit(1);
  }

  console.log("\n📋 Configuration:");
  console.log("   Network:", isMainnet ? "MAINNET" : "TESTNET", `(${networkName})`);
  console.log("   Stablecoin:", "USDC");
  console.log("   Vault Address:", VAULT_ADDRESS);
  console.log("   Amount:", AMOUNT, "USDC");
  console.log("   Direction:", TO_PERP ? "Spot → Perp" : "Perp → Spot");

  // Get the signer (owner)
  const [signer] = await ethers.getSigners();
  console.log("   Signer Address:", signer.address);

  // Check signer balance
  const balance = await ethers.provider.getBalance(signer.address);
  console.log("   Signer Balance:", ethers.formatEther(balance), "HYPE");

  if (balance === 0n) {
    console.error("❌ Insufficient HYPE balance for gas!");
    process.exit(1);
  }

  // Connect to vault contract
  console.log("\n🔗 Connecting to HyperCoreVault...");
  const vault = await ethers.getContractAt("HyperCoreVault", VAULT_ADDRESS);

  // Verify owner
  const owner = await vault.owner();
  console.log("   Vault Owner:", owner);
  
  if (owner.toLowerCase() !== signer.address.toLowerCase()) {
    console.error("❌ You are not the owner of this vault!");
    console.log("   Your address:", signer.address);
    console.log("   Owner address:", owner);
    process.exit(1);
  }

  // Scale amount to native decimals (10^6 for both USDC and USDT)
  const scaledAmount = BigInt(Math.floor(AMOUNT * USDC_HYPER_SCALE));

  console.log("\n📊 Transfer Details:");
  console.log("   Amount:", AMOUNT, "USDC");
  console.log("   Scaled Amount:", scaledAmount.toString(), `(${USDC_HYPER_SCALE} scale)`);
  console.log("   Direction:", TO_PERP ? "Spot → Perp" : "Perp → Spot");
  console.log("   Action:", "usdClassTransfer");

  try {
    console.log("\n🚀 Submitting USD class transfer...");
    const tx = await vault.usdClassTransfer(scaledAmount, TO_PERP);
    
    console.log("   Transaction Hash:", tx.hash);
    console.log("   Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed!");
    
    if (receipt) {
      console.log("   Block Number:", receipt.blockNumber);
      console.log("   Gas Used:", receipt.gasUsed.toString());
    }

    console.log("\n" + "=".repeat(80));
    console.log("✅ TRANSFER COMPLETED SUCCESSFULLY");
    console.log("=".repeat(80));
    console.log("Amount Transferred:", AMOUNT, "USDC");
    console.log("Direction:", TO_PERP ? "Spot → Perp" : "Perp → Spot");
    console.log("Vault Address:", VAULT_ADDRESS);
    console.log("=".repeat(80));
    
    console.log("\n🔗 Explorer Links:");
    console.log(`   Transaction: https://hyperevmscan.io/tx/${tx.hash}`);
    console.log(`   Vault: https://hyperevmscan.io/address/${VAULT_ADDRESS}`);
    
    console.log("\n💡 Next Steps:");
    if (TO_PERP) {
      console.log(`   Your ${AMOUNT} USDC is now available on the perp side for trading!`);
      console.log("   You can now place limit orders or other perp actions.");
    } else {
      console.log(`   Your ${AMOUNT} USDC is now available on the spot side!`);
      console.log("   You can now use spotSend or withdraw to EVM.");
    }
    console.log("   Check balances: node api-scripts/getVaultData.js");
  } catch (error: any) {
    console.error("\n❌ Transfer failed:");
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


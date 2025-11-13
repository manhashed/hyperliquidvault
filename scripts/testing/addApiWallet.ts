import { ethers } from "hardhat";
import hre from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

// Network-specific configurations
const NETWORK_CONFIG = {
  testnet: {
    chainId: 998,
    explorerUrl: "https://testnet.purrsec.com",
  },
  mainnet: {
    chainId: 999,
    explorerUrl: "https://hyperevmscan.io",
  },
};

async function main() {
  // Detect network
  const networkName = hre.network.name;
  const isMainnet = networkName === "hyperEvmMainnet";
  const config = isMainnet ? NETWORK_CONFIG.mainnet : NETWORK_CONFIG.testnet;

  console.log("=".repeat(80));
  console.log(`Adding API Wallet on HyperEVM ${isMainnet ? "Mainnet" : "Testnet"}`);
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

//   // Testnet agent
//   const agentAddress = "0x22eA2f4Db17f665FD2083Cc4499CB3d16C52fbF2";
//   const agentName = "HyperCore Agent";

//   // Mainnet agent
  const agentAddress = "0xa2d1e61dA0926577c11C29D621dA4Cff8c58ABd5";
  const agentName = "turnkey";

  
  console.log("\n📋 Configuration:");
  console.log("   Network:", isMainnet ? "MAINNET" : "TESTNET", `(${networkName})`);
  console.log("   Vault Address:", VAULT_ADDRESS);
  console.log("   Agent Address:", agentAddress);
  console.log("   API Wallet Name:", agentName);

  // Get the signer
  const [signer] = await ethers.getSigners();

  // Check signer balance
  const balance = await ethers.provider.getBalance(signer.address);
  console.log("   Signer Balance:", ethers.formatEther(balance), "HYPE");

  if (balance === 0n) {
    console.error("❌ Insufficient HYPE balance for gas! Please send some HYPE to the signer address.");
    process.exit(1);
  }

  // Connect to the vault
  console.log("\n🔗 Connecting to HyperCoreVault...");
  const vault = await ethers.getContractAt("HyperCoreVault", VAULT_ADDRESS);

  // Add API wallet
  console.log("\n🚀 Adding API Wallet...");
  console.log("   Wallet Address:", agentAddress);
  console.log("   Wallet Name:", agentName);

  const tx = await vault.addApiWallet(agentAddress, agentName);
  console.log("   Transaction Hash:", tx.hash);
  console.log("   Waiting for confirmation...");

  const receipt = await tx.wait();
  console.log("✅ Transaction confirmed!");
  
  if (receipt) {
    console.log("   Block Number:", receipt.blockNumber);
    console.log("   Gas Used:", receipt.gasUsed.toString());
  }

  console.log("\n" + "=".repeat(80));
  console.log("✅ API WALLET ADDED SUCCESSFULLY");
  console.log("=".repeat(80));
  console.log("API Wallet Address:", agentAddress);
  console.log("API Wallet Name:", agentName);
  console.log("Vault Address:", VAULT_ADDRESS);
  console.log("=".repeat(80));

  console.log("\n🔗 Explorer Links:");
  console.log(`   Transaction: ${config.explorerUrl}/tx/${tx.hash}`);
  console.log(`   Vault: ${config.explorerUrl}/address/${VAULT_ADDRESS}`);
  console.log(`   API Wallet: ${config.explorerUrl}/address/${agentAddress}`);

  console.log("\n💡 Next Steps:");
  console.log("1. Verify the API wallet was added successfully");
  console.log("2. You can now use this wallet for trading actions via the vault");
  console.log("3. Check the vault's API wallets using Hyperliquid API:");
  console.log(`   node api-scripts/getVaultData.js`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  });


import { ethers } from "hardhat";
import hre from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

// Network-specific USDC configurations
const USDC_CONFIG = {
  testnet: {
    name: "USDC",
    address: "0x2B3370eE501B4a559b57D449569354196457D8Ab",
    decimals: 6,
    explorerUrl: "https://testnet.purrsec.com",
  },
  mainnet: {
    name: "USDC",
    address: "0xb88339CB7199b77E23DB6E890353E22632Ba630f",
    decimals: 6,
    explorerUrl: "https://hyperevmscan.io",
  },
};

async function main() {
  // Detect network
  const networkName = hre.network.name;
  const isMainnet = networkName === "hyperEvmMainnet";
  const config = isMainnet ? USDC_CONFIG.mainnet : USDC_CONFIG.testnet;

  console.log("=".repeat(80));
  console.log(`FelixVault Information on ${isMainnet ? "Mainnet" : "Testnet"}`);
  console.log("=".repeat(80));

  // Get vault address from environment or deployment-info.json
  const fs = require('fs');
  let VAULT_ADDRESS = process.env.FELIX_VAULT || process.env.VAULT_ADDRESS;
  
  if (!VAULT_ADDRESS && fs.existsSync('deployment-info.json')) {
    const deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
    VAULT_ADDRESS = deploymentInfo.proxy;
    console.log("📁 Loaded vault address from deployment-info.json");
  }
  
  if (!VAULT_ADDRESS) {
    console.error("❌ VAULT_ADDRESS not found!");
    console.log("Please set FELIX_VAULT or VAULT_ADDRESS environment variable or ensure deployment-info.json exists");
    process.exit(1);
  }

  console.log("\n📋 Configuration:");
  console.log("   Network:", isMainnet ? "MAINNET" : "TESTNET", `(${networkName})`);
  console.log("   Vault Address:", VAULT_ADDRESS);
  console.log("   USDC Address:", config.address);

  // Get the signer
  const [signer] = await ethers.getSigners();
  console.log("   Signer Address:", signer.address);

  // Connect to vault contract
  console.log("\n🔗 Connecting to FelixVault...");
  const vault = await ethers.getContractAt("FelixVault", VAULT_ADDRESS);

  // Get vault owner
  const owner = await vault.owner();
  console.log("   Vault Owner:", owner);

  // Get USDC contract
  const usdc = await ethers.getContractAt("IERC20", config.address);

  // Get vault balances
  const vaultUsdcBalance = await usdc.balanceOf(VAULT_ADDRESS);
  const vaultHypeBalance = await ethers.provider.getBalance(VAULT_ADDRESS);

  console.log("\n" + "=".repeat(80));
  console.log("📊 VAULT OVERVIEW");
  console.log("=".repeat(80));

  console.log("\n💰 Vault Balances:");
  console.log(`   HYPE: ${ethers.formatEther(vaultHypeBalance)} HYPE`);
  console.log(`   ${config.name}: ${ethers.formatUnits(vaultUsdcBalance, config.decimals)} ${config.name}`);

  // Get vault statistics
  const totalAssets = await vault.totalAssets();
  const totalShares = await vault.totalShares();
  const totalDeposits = await vault.getTotalDeposits();
  const totalYield = await vault.getTotalYield();
  const pricePerShare = await vault.getPricePerShare();
  const vaultShares = await vault.getVaultShares();

  console.log("\n📈 Vault Statistics:");
  console.log(`   Total Assets: ${ethers.formatUnits(totalAssets, config.decimals)} ${config.name}`);
  console.log(`   Total Shares: ${totalShares.toString()}`);
  console.log(`   Total Deposits: ${ethers.formatUnits(totalDeposits, config.decimals)} ${config.name}`);
  console.log(`   Total Yield: ${ethers.formatUnits(totalYield, config.decimals)} ${config.name}`);
  console.log(`   Price Per Share: ${ethers.formatUnits(pricePerShare, 18)} (scaled by 1e18)`);
  console.log(`   Vault Shares in Felix: ${vaultShares.toString()}`);

  // Verify state
  const [isSynced, internalShares, actualVaultShares] = await vault.verifyState();
  console.log("\n🔍 State Verification:");
  console.log(`   State Synced: ${isSynced ? "✅ Yes" : "❌ No"}`);
  console.log(`   Internal Shares: ${internalShares.toString()}`);
  console.log(`   Actual Vault Shares: ${actualVaultShares.toString()}`);

  // Get user position if signer has shares
  const userShares = await vault.getUserShares(signer.address);
  if (userShares > 0n) {
    console.log("\n" + "=".repeat(80));
    console.log("👤 YOUR POSITION");
    console.log("=".repeat(80));

    const userAssets = await vault.getUserAssets(signer.address);
    const userDeposit = await vault.getUserDeposit(signer.address);
    const userYield = await vault.getUserYield(signer.address);
    const userYieldPercent = await vault.getUserYieldPercent(signer.address);

    console.log("\n📊 Position Details:");
    console.log(`   Shares: ${userShares.toString()}`);
    console.log(`   Assets: ${ethers.formatUnits(userAssets, config.decimals)} ${config.name}`);
    console.log(`   Original Deposit: ${ethers.formatUnits(userDeposit, config.decimals)} ${config.name}`);
    console.log(`   Yield Earned: ${ethers.formatUnits(userYield, config.decimals)} ${config.name}`);
    console.log(`   Yield %: ${ethers.formatUnits(userYieldPercent, 18)}%`);
    
    if (userDeposit > 0n) {
      const yieldPercentFormatted = (Number(ethers.formatUnits(userYieldPercent, 18)) * 100).toFixed(4);
      console.log(`   Yield % (formatted): ${yieldPercentFormatted}%`);
    }
  } else {
    console.log("\n👤 Your Position:");
    console.log("   No shares in vault");
  }

  // Get Felix vault info
  console.log("\n" + "=".repeat(80));
  console.log("🏦 FELIX VAULT INFO");
  console.log("=".repeat(80));
  
  const FELIX_VAULT = "0x8A862fD6c12f9ad34C9c2ff45AB2b6712e8CEa27";
  console.log("   Felix Vault Address:", FELIX_VAULT);
  console.log("   Vault Shares in Felix:", vaultShares.toString());

  try {
    const felixVault = await ethers.getContractAt("IERC4626", FELIX_VAULT);
    const felixTotalAssets = await felixVault.totalAssets();
    console.log(`   Felix Total Assets: ${ethers.formatUnits(felixTotalAssets, config.decimals)} ${config.name}`);
  } catch (error) {
    console.log("   Could not fetch Felix vault info");
  }

  console.log("\n" + "=".repeat(80));
  console.log("🔗 EXPLORER LINKS");
  console.log("=".repeat(80));
  console.log(`   Vault: ${config.explorerUrl}/address/${VAULT_ADDRESS}`);
  console.log(`   USDC: ${config.explorerUrl}/address/${config.address}`);
  console.log(`   Felix Vault: ${config.explorerUrl}/address/${FELIX_VAULT}`);
  console.log(`   Your Account: ${config.explorerUrl}/address/${signer.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


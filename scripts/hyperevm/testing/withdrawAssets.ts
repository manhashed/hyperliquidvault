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
    chainId: 998,
    explorerUrl: "https://testnet.purrsec.com",
  },
  mainnet: {
    name: "USDC",
    address: "0xb88339CB7199b77E23DB6E890353E22632Ba630f",
    decimals: 6,
    chainId: 999,
    explorerUrl: "https://hyperevmscan.io",
  },
};

async function main() {
  // Detect network
  const networkName = hre.network.name;
  const isMainnet = networkName === "hyperEvmMainnet";
  const config = isMainnet ? USDC_CONFIG.mainnet : USDC_CONFIG.testnet;

  console.log("=".repeat(80));
  console.log(`Withdraw Assets (by percentage) from HyperEVMVault on ${isMainnet ? "Mainnet" : "Testnet"}`);
  console.log("=".repeat(80));

  // Get vault address from environment or deployment-info.json
  const fs = require('fs');
  let VAULT_ADDRESS = process.env.HYPEREVM_VAULT || process.env.VAULT_ADDRESS;
  
  if (!VAULT_ADDRESS && fs.existsSync('deployment-info.json')) {
    const deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
    VAULT_ADDRESS = deploymentInfo.proxy;
    console.log("📁 Loaded vault address from deployment-info.json");
  }
  
  if (!VAULT_ADDRESS) {
    console.error("❌ VAULT_ADDRESS not found!");
    console.log("Please set HYPEREVM_VAULT or VAULT_ADDRESS environment variable or ensure deployment-info.json exists");
    process.exit(1);
  }

  // Withdrawal percentage (0-100)
  const WITHDRAW_PERCENTAGE = 100

  if (WITHDRAW_PERCENTAGE <= 0 || WITHDRAW_PERCENTAGE > 100) {
    console.error("❌ Invalid withdrawal percentage! Must be between 0 and 100");
    process.exit(1);
  }

  console.log("\n📋 Configuration:");
  console.log("   Network:", isMainnet ? "MAINNET" : "TESTNET", `(${networkName})`);
  console.log("   USDC:", config.name);
  console.log("   Vault Address:", VAULT_ADDRESS);
  console.log("   Withdraw Percentage:", WITHDRAW_PERCENTAGE, "% of your assets");

  // Get the signer
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
  console.log("\n🔗 Connecting to HyperEVMVault...");
  const vault = await ethers.getContractAt("HyperEVMVault", VAULT_ADDRESS);

  // Get user position
  const userShares = await vault.getUserShares(signer.address);
  const userAssets = await vault.getUserAssets(signer.address);
  const userDeposit = await vault.getUserDeposit(signer.address);

  console.log("\n📊 Your Current Position:");
  console.log(`   Shares: ${userShares.toString()}`);
  console.log(`   Assets: ${ethers.formatUnits(userAssets, config.decimals)} ${config.name}`);
  console.log(`   Original Deposit: ${ethers.formatUnits(userDeposit, config.decimals)} ${config.name}`);

  if (userShares === 0n || userAssets === 0n) {
    console.error("❌ You have no assets to withdraw!");
    process.exit(1);
  }

  // Calculate assets to withdraw based on percentage
  const assetsToWithdraw = (userAssets * BigInt(Math.floor(WITHDRAW_PERCENTAGE * 100))) / 10000n; // Percentage scaled by 10000 (100.00%)
  
  if (assetsToWithdraw === 0n) {
    console.error("❌ Calculated withdrawal amount is 0! Percentage might be too small.");
    process.exit(1);
  }

  if (assetsToWithdraw > userAssets) {
    console.error(`❌ Calculated assets (${ethers.formatUnits(assetsToWithdraw, config.decimals)} ${config.name}) exceed your assets (${ethers.formatUnits(userAssets, config.decimals)} ${config.name})!`);
    process.exit(1);
  }

  // Get USDC contract
  const usdc = await ethers.getContractAt("IERC20", config.address);

  // Check balances before withdrawal
  const vaultBalanceBefore = await usdc.balanceOf(VAULT_ADDRESS);
  const userBalanceBefore = await usdc.balanceOf(signer.address);

  console.log("\n📊 Balances Before Withdrawal:");
  console.log(`   Vault ${config.name} Balance:`, ethers.formatUnits(vaultBalanceBefore, config.decimals), config.name);
  console.log(`   Your ${config.name} Balance:`, ethers.formatUnits(userBalanceBefore, config.decimals), config.name);

  // Preview shares that will be redeemed
  const sharesToRedeem = await vault.previewWithdraw(assetsToWithdraw);

  console.log("\n📊 Withdrawal Details:");
  console.log(`   Percentage: ${WITHDRAW_PERCENTAGE}%`);
  console.log(`   Assets to Withdraw: ${ethers.formatUnits(assetsToWithdraw, config.decimals)} ${config.name}`);
  console.log(`   Estimated Shares to Redeem: ${sharesToRedeem.toString()}`);

  if (sharesToRedeem > userShares) {
    console.error(`❌ Insufficient shares! You have ${userShares.toString()}, but need ${sharesToRedeem.toString()}`);
    process.exit(1);
  }

  try {
    console.log("\n🚀 Submitting withdrawal...");
    const withdrawTx = await vault.withdrawAssets(assetsToWithdraw);
    
    console.log("   Transaction Hash:", withdrawTx.hash);
    console.log("   Waiting for confirmation...");
    
    const receipt = await withdrawTx.wait();
    console.log("✅ Transaction confirmed!");
    
    if (receipt) {
      console.log("   Block Number:", receipt.blockNumber);
      console.log("   Gas Used:", receipt.gasUsed.toString());
    }
    
    // Get updated position
    const userSharesAfter = await vault.getUserShares(signer.address);
    const userAssetsAfter = await vault.getUserAssets(signer.address);

    // Check balances after withdrawal
    const vaultBalanceAfter = await usdc.balanceOf(VAULT_ADDRESS);
    const userBalanceAfter = await usdc.balanceOf(signer.address);

    console.log("\n" + "=".repeat(80));
    console.log("✅ WITHDRAWAL COMPLETED SUCCESSFULLY");
    console.log("=".repeat(80));
    console.log(`Percentage Withdrawn: ${WITHDRAW_PERCENTAGE}% of assets`);
    console.log(`Assets Withdrawn: ${ethers.formatUnits(assetsToWithdraw, config.decimals)} ${config.name}`);
    console.log(`Shares Redeemed: ${sharesToRedeem.toString()}`);
    console.log("=".repeat(80));

    console.log("\n📊 Your Updated Position:");
    const remainingPercentage = userAssets > 0n ? (Number(userAssetsAfter) / Number(userAssets)) * 100 : 0;
    console.log(`   Shares: ${userSharesAfter.toString()}`);
    console.log(`   Assets: ${ethers.formatUnits(userAssetsAfter, config.decimals)} ${config.name} (${remainingPercentage.toFixed(2)}% of original remaining)`);

    console.log("\n📊 Balances After Withdrawal:");
    console.log(`   Your ${config.name} Balance:`, ethers.formatUnits(userBalanceAfter, config.decimals), config.name);
    console.log(`   Vault ${config.name} Balance:`, ethers.formatUnits(vaultBalanceAfter, config.decimals), config.name);
    
    console.log("\n🔗 Explorer Links:");
    console.log(`   Transaction: ${config.explorerUrl}/tx/${withdrawTx.hash}`);
    console.log(`   Vault: ${config.explorerUrl}/address/${VAULT_ADDRESS}`);
    
  } catch (error: any) {
    console.error("\n❌ Withdrawal failed:");
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


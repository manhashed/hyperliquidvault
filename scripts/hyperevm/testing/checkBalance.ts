import { ethers } from "hardhat";
import hre from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  // Detect network
  const networkName = hre.network.name;
  const isMainnet = networkName === "hyperEvmMainnet";
  
  // Network-specific USDC addresses
  const USDC_CONFIG = {
    testnet: {
      name: "USDC",
      address: "0x2B3370eE501B4a559b57D449569354196457D8Ab",
      decimals: 6,
    },
    mainnet: {
      name: "USDC",
      address: "0xb88339CB7199b77E23DB6E890353E22632Ba630f",
      decimals: 6,
    },
  };
  
  const usdc = isMainnet ? USDC_CONFIG.mainnet : USDC_CONFIG.testnet;
  
  // Get vault address from environment or deployment-info.json
  const fs = require('fs');
  let VAULT_ADDRESS = process.env.HYPEREVM_VAULT || process.env.VAULT_ADDRESS;
  
  if (!VAULT_ADDRESS && fs.existsSync('deployment-info.json')) {
    const deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
    VAULT_ADDRESS = deploymentInfo.proxy;
  }

  console.log("=".repeat(80));
  console.log(`Balance Checker for HyperEVMVault on ${isMainnet ? "Mainnet" : "Testnet"}`);
  console.log("=".repeat(80));
  console.log(`Network: ${networkName}\n`);

  // Get deployer account (signer)
  const [signer] = await ethers.getSigners();
  const deployerAddress = signer.address;

  // Get USDC contract
  const token = await ethers.getContractAt("IERC20", usdc.address);

  // ----------- Deployer Balances -----------
  console.log("===== Deployer Account =====");
  console.log("Deployer Address:", deployerAddress);
  // Native balance (HYPE)
  const deployerHype = await ethers.provider.getBalance(deployerAddress);
  console.log("HYPE Balance:", ethers.formatEther(deployerHype), "HYPE");

  // USDC balance
  const deployerUsdc = await token.balanceOf(deployerAddress);
  console.log(`${usdc.name} Balance:`, ethers.formatUnits(deployerUsdc, usdc.decimals), usdc.name);

  // ----------- Vault Balances -----------
  console.log("\n===== Vault =====");
  if (VAULT_ADDRESS) {
    console.log("Vault Address:", VAULT_ADDRESS);
    // Native balance (HYPE)
    const vaultHype = await ethers.provider.getBalance(VAULT_ADDRESS);
    console.log("Vault HYPE Balance:", ethers.formatEther(vaultHype), "HYPE");
    // USDC balance
    const vaultUsdc = await token.balanceOf(VAULT_ADDRESS);
    console.log(`Vault ${usdc.name} Balance:`, ethers.formatUnits(vaultUsdc, usdc.decimals), usdc.name);

    // Check USDC allowance
    const allowance = await token.allowance(deployerAddress, VAULT_ADDRESS);
    console.log(`${usdc.name} Allowance to Vault:`, ethers.formatUnits(allowance, usdc.decimals), usdc.name);

    // Get vault contract and check user position
    try {
      const vault = await ethers.getContractAt("HyperEVMVault", VAULT_ADDRESS);
      const userShares = await vault.getUserShares(deployerAddress);
      const userAssets = await vault.getUserAssets(deployerAddress);
      const userDeposit = await vault.getUserDeposit(deployerAddress);

      console.log("\n===== Your Vault Position =====");
      console.log("Shares:", userShares.toString());
      console.log("Assets:", ethers.formatUnits(userAssets, usdc.decimals), usdc.name);
      console.log("Original Deposit:", ethers.formatUnits(userDeposit, usdc.decimals), usdc.name);

      if (userShares > 0n) {
        const userYield = await vault.getUserYield(deployerAddress);
        const userYieldPercent = await vault.getUserYieldPercent(deployerAddress);
        console.log("Yield Earned:", ethers.formatUnits(userYield, usdc.decimals), usdc.name);
        console.log("Yield %:", ethers.formatUnits(userYieldPercent, 18), "%");
      }
    } catch (error) {
      console.log("Could not fetch vault position (contract may not be deployed)");
    }
  } else {
    console.log("Vault address not set. To check vault balances set HYPEREVM_VAULT or VAULT_ADDRESS in your .env file.");
  }

  // ----------- Summary Status -----------
  console.log("\n===== Status =====");

  if (deployerHype === 0n) {
    console.log("⚠️  Deployer has NO HYPE (native token) for gas!");
  } else if (deployerHype < ethers.parseEther("0.001")) {
    console.log("⚠️  Deployer has LOW HYPE for gas (< 0.001)");
  } else {
    console.log("✅ Deployer has sufficient HYPE for gas");
  }

  if (deployerUsdc === 0n) {
    console.log(`❌ Deployer has NO ${usdc.name}`);
    if (!isMainnet) {
      console.log(`💡 To get HyperEVM testnet ${usdc.name}:`);
      console.log("   1. Look for testnet faucets");
      console.log("   2. Ask in Hyperliquid Discord/community");
      console.log("   3. Bridge from another testnet");
    }
  } else if (deployerUsdc < ethers.parseUnits("10", usdc.decimals)) {
    console.log(`⚠️  Deployer ${usdc.name} balance < 10 ${usdc.name} (`, ethers.formatUnits(deployerUsdc, usdc.decimals), ")");
  } else {
    console.log(`✅ Deployer has sufficient ${usdc.name}`);
  }

  if (VAULT_ADDRESS) {
    try {
      const vaultHype = await ethers.provider.getBalance(VAULT_ADDRESS);
      const vaultUsdc = await token.balanceOf(VAULT_ADDRESS);

      if (vaultHype === 0n) {
        console.log("⚠️  Vault has NO HYPE (native token)");
      } else {
        console.log("Vault HYPE balance:", ethers.formatEther(vaultHype), "HYPE");
      }

      if (vaultUsdc === 0n) {
        console.log(`⚠️  Vault has NO ${usdc.name}`);
      } else {
        console.log(`Vault ${usdc.name} balance:`, ethers.formatUnits(vaultUsdc, usdc.decimals), usdc.name);
      }
    } catch (error) {
      // Ignore errors
    }
  }

  // ----------- Explorer Links -----------
  console.log("\n===== Explorer Links =====");
  const explorerBase = isMainnet ? "https://hyperevmscan.io" : "https://testnet.purrsec.com";
  console.log(`Deployer: ${explorerBase}/address/${deployerAddress}`);
  console.log(`${usdc.name} Token: ${explorerBase}/address/${usdc.address}`);
  if (VAULT_ADDRESS) {
    console.log(`Vault: ${explorerBase}/address/${VAULT_ADDRESS}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


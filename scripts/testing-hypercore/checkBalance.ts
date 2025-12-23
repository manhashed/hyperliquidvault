import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  // Detect network
  const networkName = hre.network.name;
  const isMainnet = networkName === "hyperEvmMainnet";
  
  // Network-specific stablecoin addresses
  const STABLECOIN_CONFIG = {
    testnet: {
      name: "USDC",
      address: "0x2B3370eE501B4a559b57D449569354196457D8Ab",
      decimals: 6,
    },
    mainnet: {
      name: "USDT",
      address: "0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb",
      decimals: 6,
    },
  };
  
  const stablecoin = isMainnet ? STABLECOIN_CONFIG.mainnet : STABLECOIN_CONFIG.testnet;
  const VAULT_ADDRESS = process.env.VAULT_ADDRESS || "";

  console.log(`=== Balance Checker for HyperEVM ${isMainnet ? "Mainnet" : "Testnet"} ===`);
  console.log(`Network: ${networkName}\n`);

  // Get deployer account (signer)
  const [signer] = await ethers.getSigners();
  const deployerAddress = signer.address;

  // Get stablecoin contract
  const token = await ethers.getContractAt("IERC20", stablecoin.address);

  // ----------- Deployer Balances -----------
  console.log("===== Deployer Account =====");
  console.log("Deployer Address:", deployerAddress);
  // Native balance (HYPE)
  const deployerHype = await ethers.provider.getBalance(deployerAddress);
  console.log("HYPE Balance:", ethers.formatEther(deployerHype), "HYPE");

  // Stablecoin balance
  const deployerStablecoin = await token.balanceOf(deployerAddress);
  console.log(`${stablecoin.name} Balance:`, ethers.formatUnits(deployerStablecoin, stablecoin.decimals), stablecoin.name);

  // ----------- Vault Balances -----------
  console.log("\n===== Vault =====");
  if (VAULT_ADDRESS) {
    console.log("Vault Address:", VAULT_ADDRESS);
    // Native balance (HYPE)
    const vaultHype = await ethers.provider.getBalance(VAULT_ADDRESS);
    console.log("Vault HYPE Balance:", ethers.formatEther(vaultHype), "HYPE");
    // Stablecoin balance
    const vaultStablecoin = await token.balanceOf(VAULT_ADDRESS);
    console.log(`Vault ${stablecoin.name} Balance:`, ethers.formatUnits(vaultStablecoin, stablecoin.decimals), stablecoin.name);

    // Check stablecoin allowance
    const allowance = await token.allowance(deployerAddress, VAULT_ADDRESS);
    console.log(`${stablecoin.name} Allowance to Vault:`, ethers.formatUnits(allowance, stablecoin.decimals), stablecoin.name);
  } else {
    console.log("Vault address not set. To check vault balances set VAULT_ADDRESS in your .env file.");
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

  if (deployerStablecoin === 0n) {
    console.log(`❌ Deployer has NO ${stablecoin.name}`);
    if (!isMainnet) {
      console.log(`💡 To get HyperEVM testnet ${stablecoin.name}:`);
      console.log("   1. Look for testnet faucets");
      console.log("   2. Ask in Hyperliquid Discord/community");
      console.log("   3. Bridge from another testnet");
    }
  } else if (deployerStablecoin < ethers.parseUnits("10", stablecoin.decimals)) {
    console.log(`⚠️  Deployer ${stablecoin.name} balance < 10 ${stablecoin.name} (`, ethers.formatUnits(deployerStablecoin, stablecoin.decimals), ")");
  } else {
    console.log(`✅ Deployer has sufficient ${stablecoin.name}`);
  }

  if (VAULT_ADDRESS) {
    const vaultHype = await ethers.provider.getBalance(VAULT_ADDRESS);
    const vaultStablecoin = await token.balanceOf(VAULT_ADDRESS);

    if (vaultHype === 0n) {
      console.log("⚠️  Vault has NO HYPE (native token)");
    } else {
      console.log("Vault HYPE balance:", ethers.formatEther(vaultHype), "HYPE");
    }

    if (vaultStablecoin === 0n) {
      console.log(`⚠️  Vault has NO ${stablecoin.name}`);
    } else {
      console.log(`Vault ${stablecoin.name} balance:`, ethers.formatUnits(vaultStablecoin, stablecoin.decimals), stablecoin.name);
    }
  }

  // ----------- Explorer Links -----------
  console.log("\n===== Explorer Links =====");
  const explorerBase = isMainnet ? "https://hyperevmscan.io" : "https://testnet.purrsec.com";
  console.log(`Deployer: ${explorerBase}/address/${deployerAddress}`);
  console.log(`${stablecoin.name} Token: ${explorerBase}/address/${stablecoin.address}`);
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


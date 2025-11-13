import { ethers } from "hardhat";
import hre from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

// Network-specific stablecoin configurations
const STABLECOIN_CONFIG = {
  testnet: {
    name: "USDC",
    address: "0x2B3370eE501B4a559b57D449569354196457D8Ab",
    decimals: 6,
    chainId: 998,
    explorerUrl: "https://testnet.purrsec.com",
  },
  mainnet: {
    name: "USDT",
    address: "0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb",
    decimals: 6,
    chainId: 999,
    explorerUrl: "https://hyperevmscan.io",
  },
};

async function main() {
  // Detect network
  const networkName = hre.network.name;
  const isMainnet = networkName === "hyperEvmMainnet";
  const config = isMainnet ? STABLECOIN_CONFIG.mainnet : STABLECOIN_CONFIG.testnet;

  console.log("=".repeat(80));
  console.log(`Withdraw ${config.name} from Vault on HyperEVM ${isMainnet ? "Mainnet" : "Testnet"}`);
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

  // Withdrawal amount
  const WITHDRAW_AMOUNT = 26.96; // Amount in stablecoin units (adjust based on vault balance)

  console.log("\n📋 Configuration:");
  console.log("   Network:", isMainnet ? "MAINNET" : "TESTNET", `(${networkName})`);
  console.log("   Stablecoin:", config.name);
  console.log("   Vault Address:", VAULT_ADDRESS);
  console.log("   Withdraw Amount:", WITHDRAW_AMOUNT, config.name);

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

  // Get stablecoin contract
  const stablecoin = await ethers.getContractAt("IERC20", config.address);

  // Check balances before withdrawal
  const vaultBalanceBefore = await stablecoin.balanceOf(VAULT_ADDRESS);
  const userBalanceBefore = await stablecoin.balanceOf(signer.address);

  console.log("\n📊 Balances Before Withdrawal:");
  console.log(`   Vault ${config.name} Balance:`, ethers.formatUnits(vaultBalanceBefore, config.decimals), config.name);
  console.log(`   Your ${config.name} Balance:`, ethers.formatUnits(userBalanceBefore, config.decimals), config.name);

  // Scale amount to native decimals
  const withdrawAmountWei = ethers.parseUnits(WITHDRAW_AMOUNT.toString(), config.decimals);

  console.log("\n📊 Withdrawal Details:");
  console.log("   Amount:", WITHDRAW_AMOUNT, config.name);
  console.log("   Scaled Amount:", withdrawAmountWei.toString(), `(${config.decimals} decimals)`);
  console.log("   Action:", "withdrawUSDC");

  try {
    console.log("\n🚀 Submitting withdrawal...");
    const tx = await vault.withdrawUSDC(withdrawAmountWei);
    
    console.log("   Transaction Hash:", tx.hash);
    console.log("   Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed!");
    
    if (receipt) {
      console.log("   Block Number:", receipt.blockNumber);
      console.log("   Gas Used:", receipt.gasUsed.toString());
    }
    
    // Check balances after withdrawal
    const vaultBalanceAfter = await stablecoin.balanceOf(VAULT_ADDRESS);
    const userBalanceAfter = await stablecoin.balanceOf(signer.address);

    console.log("\n" + "=".repeat(80));
    console.log("✅ WITHDRAWAL COMPLETED SUCCESSFULLY");
    console.log("=".repeat(80));
    console.log(`Amount Withdrawn: ${WITHDRAW_AMOUNT} ${config.name}`);
    console.log("=".repeat(80));

    console.log("\n📊 Balances After Withdrawal:");
    console.log(`   Your ${config.name} Balance:`, ethers.formatUnits(userBalanceAfter, config.decimals), config.name);
    console.log(`   Vault ${config.name} Balance:`, ethers.formatUnits(vaultBalanceAfter, config.decimals), config.name);
    
    console.log("\n🔗 Explorer Links:");
    console.log(`   Transaction: ${config.explorerUrl}/tx/${tx.hash}`);
    console.log(`   Vault: ${config.explorerUrl}/address/${VAULT_ADDRESS}`);
    
    console.log("\n💡 Next Steps:");
    console.log(`   Your ${WITHDRAW_AMOUNT} ${config.name} has been withdrawn from HyperCore to the vault!`);
    console.log("   Check balances: node api-scripts/getVaultData.js");
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


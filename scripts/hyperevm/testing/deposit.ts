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
  
  // Configuration
  const VAULT_ADDRESS = process.env.HYPEREVM_VAULT || process.env.VAULT_ADDRESS || "";
  const APPROVAL_AMOUNT = "1000000"; // 1M USDC
  const DEPOSIT_AMOUNT = "5"; // 1 USDC

  if (!VAULT_ADDRESS) {
    console.error("❌ Error: HYPEREVM_VAULT or VAULT_ADDRESS not set in environment variables");
    console.log("Please set HYPEREVM_VAULT in your .env file or run:");
    console.log("HYPEREVM_VAULT=0x... npx hardhat run scripts/hyperevm/testing/deposit.ts --network hyperEvmTestnet");
    process.exit(1);
  }

  console.log("=".repeat(80));
  console.log(`Deposit ${usdc.name} to HyperEVMVault on ${isMainnet ? "Mainnet" : "Testnet"}`);
  console.log("=".repeat(80));
  console.log(`Network: ${isMainnet ? "MAINNET" : "TESTNET"} (${networkName})`);
  console.log(`Vault Address: ${VAULT_ADDRESS}`);
  console.log(`USDC Address: ${usdc.address}`);

  // Get the signer
  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);

  // Check HYPE balance
  const hypeBalance = await ethers.provider.getBalance(signer.address);
  console.log("HYPE balance:", ethers.formatEther(hypeBalance), "HYPE");

  if (hypeBalance === 0n) {
    console.error("❌ Insufficient HYPE balance for gas!");
    process.exit(1);
  }

  // Get USDC contract (ERC20)
  const token = await ethers.getContractAt(
    "IERC20",
    usdc.address
  );

  // Check USDC balance
  const tokenBalance = await token.balanceOf(signer.address);
  console.log(`${usdc.name} balance:`, ethers.formatUnits(tokenBalance, usdc.decimals), usdc.name);

  const depositAmountWei = ethers.parseUnits(DEPOSIT_AMOUNT, usdc.decimals);

  if (tokenBalance < depositAmountWei) {
    console.error(`❌ Insufficient ${usdc.name} balance!`);
    console.error(`   Required: ${DEPOSIT_AMOUNT} ${usdc.name}`);
    console.error(`   Available: ${ethers.formatUnits(tokenBalance, usdc.decimals)} ${usdc.name}`);
    process.exit(1);
  }

  console.log("\n" + "=".repeat(80));
  console.log("Proceeding with approval and deposit...");
  console.log("=".repeat(80));

  // Get HyperEVMVault contract
  const vault = await ethers.getContractAt(
    "HyperEVMVault",
    VAULT_ADDRESS
  );

  // Step 1: Approve USDC only if allowance < deposit amount
  const approvalAmountWei = ethers.parseUnits(APPROVAL_AMOUNT, usdc.decimals);
  const currentAllowance = await token.allowance(signer.address, VAULT_ADDRESS);

  if (currentAllowance < depositAmountWei) {
    console.log(`\n📝 Approving ${APPROVAL_AMOUNT} ${usdc.name} for vault...`);
    const approveTx = await token.approve(VAULT_ADDRESS, approvalAmountWei);
    console.log("   Transaction Hash:", approveTx.hash);
    console.log("   Waiting for confirmation...");
    await approveTx.wait();
    console.log(`✅ ${usdc.name} approved successfully!`);
  } else {
    console.log(`\n✅ No approval needed (current allowance: ${ethers.formatUnits(currentAllowance, usdc.decimals)} ${usdc.name})`);
  }

  // Check allowance
  const allowance = await token.allowance(signer.address, VAULT_ADDRESS);
  console.log(`   Allowance: ${ethers.formatUnits(allowance, usdc.decimals)} ${usdc.name}`);

  // Step 2: Deposit USDC
  console.log(`\n💰 Depositing ${DEPOSIT_AMOUNT} ${usdc.name} to vault...`);
  const depositTx = await vault.deposit(depositAmountWei);
  console.log("   Transaction Hash:", depositTx.hash);
  console.log("   Waiting for confirmation...");
  const receipt = await depositTx.wait();
  console.log("✅ Deposit transaction confirmed!");

  if (receipt) {
    console.log("   Block Number:", receipt.blockNumber);
    console.log("   Gas Used:", receipt.gasUsed.toString());
  }

  // Get user info after deposit
  const userShares = await vault.getUserShares(signer.address);
  const userAssets = await vault.getUserAssets(signer.address);
  const userDeposit = await vault.getUserDeposit(signer.address);

  // Check balances after deposit
  const tokenBalanceAfter = await token.balanceOf(signer.address);
  const vaultBalance = await token.balanceOf(VAULT_ADDRESS);

  console.log("\n" + "=".repeat(80));
  console.log("✅ DEPOSIT COMPLETED SUCCESSFULLY");
  console.log("=".repeat(80));

  console.log("\n📊 Your Vault Position:");
  console.log(`   Shares: ${userShares.toString()}`);
  console.log(`   Assets: ${ethers.formatUnits(userAssets, usdc.decimals)} ${usdc.name}`);
  console.log(`   Original Deposit: ${ethers.formatUnits(userDeposit, usdc.decimals)} ${usdc.name}`);

  console.log("\n📊 Balances:");
  console.log(`   Your ${usdc.name} balance:`, ethers.formatUnits(tokenBalanceAfter, usdc.decimals), usdc.name);
  console.log(`   Vault ${usdc.name} balance:`, ethers.formatUnits(vaultBalance, usdc.decimals), usdc.name);

  const explorerBase = isMainnet ? "https://hyperevmscan.io" : "https://testnet.purrsec.com";
  console.log("\n🔗 Explorer Links:");
  console.log(`   Transaction: ${explorerBase}/tx/${depositTx.hash}`);
  console.log(`   Vault: ${explorerBase}/address/${VAULT_ADDRESS}`);
  console.log(`   Your Account: ${explorerBase}/address/${signer.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


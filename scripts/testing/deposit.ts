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
  
  // Configuration
  const VAULT_ADDRESS = process.env.VAULT_ADDRESS || "";
  const APPROVAL_AMOUNT = "1000000"; // 1M tokens
  const DEPOSIT_AMOUNT = "21"; // 10 tokens

  if (!VAULT_ADDRESS) {
    console.error("Error: VAULT_ADDRESS not set in environment variables");
    console.log("Please set VAULT_ADDRESS in your .env file or run:");
    console.log("VAULT_ADDRESS=0x... npx hardhat run scripts/deposit.ts --network hyperEvmTestnet");
    process.exit(1);
  }

  console.log(`Starting ${stablecoin.name} approval and deposit...`);
  console.log(`Network: ${isMainnet ? "MAINNET" : "TESTNET"} (${networkName})`);

  // Get the signer
  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);

  // Check HYPE balance
  const hypeBalance = await ethers.provider.getBalance(signer.address);
  console.log("HYPE balance:", ethers.formatEther(hypeBalance));

  // Get stablecoin contract (ERC20)
  const token = await ethers.getContractAt(
    "IERC20",
    stablecoin.address
  );

  // Check stablecoin balance
  const tokenBalance = await token.balanceOf(signer.address);
  console.log(`${stablecoin.name} balance:`, ethers.formatUnits(tokenBalance, stablecoin.decimals), stablecoin.name);

  const depositAmountWei = ethers.parseUnits(DEPOSIT_AMOUNT, stablecoin.decimals);

  console.log("\nProceeding with approval and deposit...");

  // Get HyperCoreVault contract
  const vault = await ethers.getContractAt(
    "HyperCoreVault",
    VAULT_ADDRESS
  );

  // Step 1: Approve stablecoin only if allowance < deposit amount
  const approvalAmountWei = ethers.parseUnits(APPROVAL_AMOUNT, stablecoin.decimals);
  const currentAllowance = await token.allowance(signer.address, VAULT_ADDRESS);

  if (currentAllowance < depositAmountWei) {
    console.log(`\nApproving ${APPROVAL_AMOUNT} ${stablecoin.name} for vault...`);
    const approveTx = await token.approve(VAULT_ADDRESS, approvalAmountWei);
    console.log("Approval transaction hash:", approveTx.hash);
    await approveTx.wait();
    console.log(`${stablecoin.name} approved successfully!`);
  } else {
    console.log(`\nNo approval needed (current allowance: ${ethers.formatUnits(currentAllowance, stablecoin.decimals)} ${stablecoin.name})`);
  }

  // Check allowance
  const allowance = await token.allowance(signer.address, VAULT_ADDRESS);
  console.log("Allowance:", ethers.formatUnits(allowance, stablecoin.decimals), stablecoin.name);

  // Step 2: Deposit stablecoin
  console.log(`\nDepositing ${DEPOSIT_AMOUNT} ${stablecoin.name} to vault...`);
  const depositTx = await vault.depositUSDC(depositAmountWei);
  console.log("Deposit transaction hash:", depositTx.hash);
  await depositTx.wait();
  console.log(`${stablecoin.name} deposited successfully!`);

  // Check balances after deposit
  const tokenBalanceAfter = await token.balanceOf(signer.address);
  const vaultBalance = await token.balanceOf(VAULT_ADDRESS);

  console.log("\n=== Final Balances ===");
  console.log(`Your ${stablecoin.name} balance:`, ethers.formatUnits(tokenBalanceAfter, stablecoin.decimals), stablecoin.name);
  console.log(`Vault ${stablecoin.name} balance:`, ethers.formatUnits(vaultBalance, stablecoin.decimals), stablecoin.name);
  console.log("\n✅ Deposit completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


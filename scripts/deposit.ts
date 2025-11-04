import { ethers } from "hardhat";

async function main() {
  // Configuration
  const USDC_ADDRESS = "0x2B3370eE501B4a559b57D449569354196457D8Ab";
  const VAULT_ADDRESS = process.env.VAULT_ADDRESS || "";
  const APPROVAL_AMOUNT = "1000000"; // 1M USDC
  const DEPOSIT_AMOUNT = "10"; // 10 USDC

  if (!VAULT_ADDRESS) {
    console.error("Error: VAULT_ADDRESS not set in environment variables");
    console.log("Please set VAULT_ADDRESS in your .env file or run:");
    console.log("VAULT_ADDRESS=0x... npx hardhat run scripts/deposit.ts --network hyperEvmTestnet");
    process.exit(1);
  }

  console.log("Starting USDC approval and deposit...");

  // Get the signer
  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);

  // Check ETH balance
  const ethBalance = await ethers.provider.getBalance(signer.address);
  console.log("ETH balance:", ethers.formatEther(ethBalance));

  // Get USDC contract (ERC20)
  const USDC = await ethers.getContractAt(
    "IERC20",
    USDC_ADDRESS
  );

  // Check USDC balance
  const usdcBalance = await USDC.balanceOf(signer.address);
  console.log("USDC balance:", ethers.formatUnits(usdcBalance, 6), "USDC");

  const depositAmountWei = ethers.parseUnits(DEPOSIT_AMOUNT, 6); // USDC has 6 decimals

  console.log("\nProceeding with approval and deposit...");

  // Get HyperCoreVault contract
  const vault = await ethers.getContractAt(
    "HyperCoreVault",
    VAULT_ADDRESS
  );

  // Step 1: Approve USDC only if allowance < deposit amount
  const approvalAmountWei = ethers.parseUnits(APPROVAL_AMOUNT, 6);
  const currentAllowance = await USDC.allowance(signer.address, VAULT_ADDRESS);

  if (currentAllowance < depositAmountWei) {
    console.log(`\nApproving ${APPROVAL_AMOUNT} USDC for vault...`);
    const approveTx = await USDC.approve(VAULT_ADDRESS, approvalAmountWei);
    console.log("Approval transaction hash:", approveTx.hash);
    await approveTx.wait();
    console.log("USDC approved successfully!");
  } else {
    console.log(`\nNo approval needed (current allowance: ${ethers.formatUnits(currentAllowance, 6)} USDC)`);
  }

  // Check allowance
  const allowance = await USDC.allowance(signer.address, VAULT_ADDRESS);
  console.log("Allowance:", ethers.formatUnits(allowance, 6), "USDC");

  // Step 2: Deposit USDC
  console.log(`\nDepositing ${DEPOSIT_AMOUNT} USDC to vault...`);
  const depositTx = await vault.depositUSDC(depositAmountWei);
  console.log("Deposit transaction hash:", depositTx.hash);
  await depositTx.wait();
  console.log("USDC deposited successfully!");

  // Check balances after deposit
  const usdcBalanceAfter = await USDC.balanceOf(signer.address);
  const vaultBalance = await USDC.balanceOf(VAULT_ADDRESS);

  console.log("\n=== Final Balances ===");
  console.log("Your USDC balance:", ethers.formatUnits(usdcBalanceAfter, 6), "USDC");
  console.log("Vault USDC balance:", ethers.formatUnits(vaultBalance, 6), "USDC");
  console.log("\n✅ Deposit completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


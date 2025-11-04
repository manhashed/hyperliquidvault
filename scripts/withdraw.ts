import { ethers } from "hardhat";

async function main() {
  const VAULT_ADDRESS = process.env.VAULT_ADDRESS || "0xB6b9Db33FCdDC4c2FCCfc049D72aF5D0766A26e6";
  const WITHDRAW_AMOUNT = 1; // 20 USDC (adjust based on vault balance)

  console.log("Withdrawing USDC from vault...");
  console.log("Vault address:", VAULT_ADDRESS);

  // Get the signer (owner)
  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);

  // Get vault contract
  const vault = await ethers.getContractAt("HyperCoreVault", VAULT_ADDRESS);

  // Get USDC contract
  const USDC_ADDRESS = "0x2B3370eE501B4a559b57D449569354196457D8Ab";
  const USDC = await ethers.getContractAt("IERC20", USDC_ADDRESS);

  const withdrawAmountWei = ethers.parseUnits(WITHDRAW_AMOUNT.toString(), 6);

  console.log("\n=== Withdrawal Parameters ===");
  console.log("Amount:", WITHDRAW_AMOUNT, "USDC");
  console.log("Scaled Amount:", withdrawAmountWei.toString());
  console.log("============================\n");

  try {
    console.log("Submitting withdrawal...");
    const tx = await vault.withdrawUSDC(withdrawAmountWei);
    
    console.log("Transaction hash:", tx.hash);
    console.log("Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("✅ Withdrawal completed successfully!");
    console.log("Block number:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());
    
    // Check balances after withdrawal
    const vaultBalanceAfter = await USDC.balanceOf(VAULT_ADDRESS);
    const userBalance = await USDC.balanceOf(signer.address);

    console.log("\n=== Final Balances ===");
    console.log("Your USDC balance:", ethers.formatUnits(userBalance, 6), "USDC");
    console.log("Vault USDC balance:", ethers.formatUnits(vaultBalanceAfter, 6), "USDC");
    
    console.log("\nTransaction:", `https://testnet.purrsec.com/tx/${tx.hash}`);
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


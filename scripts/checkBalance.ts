import { ethers } from "hardhat";

async function main() {
  const USDC_ADDRESS = "0x2B3370eE501B4a559b57D449569354196457D8Ab";
  const VAULT_ADDRESS = process.env.VAULT_ADDRESS || "";

  console.log("=== Balance Checker for HyperEVM Testnet ===\n");

  // Get the signer
  const [signer] = await ethers.getSigners();
  const userAddress = signer.address;

  console.log("Account Address:", userAddress);
  console.log("Vault Address:", VAULT_ADDRESS || "(not set in .env)");
  console.log("\n--- Native Token (HYPE) ---");

  // Check ETH/HYPE balance
  const ethBalance = await ethers.provider.getBalance(userAddress);
  console.log("Your HYPE balance:", ethers.formatEther(ethBalance), "HYPE");

  // Get USDC contract
  const USDC = await ethers.getContractAt("IERC20", USDC_ADDRESS);

  console.log("\n--- USDC Token ---");
  
  // Check USDC balance
  const usdcBalance = await USDC.balanceOf(userAddress);
  console.log("Your USDC balance:", ethers.formatUnits(usdcBalance, 6), "USDC");

  if (VAULT_ADDRESS) {
    // Check vault's USDC balance
    const vaultBalance = await USDC.balanceOf(VAULT_ADDRESS);
    console.log("Vault USDC balance:", ethers.formatUnits(vaultBalance, 6), "USDC");

    // Check allowance
    const allowance = await USDC.allowance(userAddress, VAULT_ADDRESS);
    console.log("USDC Allowance to Vault:", ethers.formatUnits(allowance, 6), "USDC");
  }

  console.log("\n--- Status ---");
  
  if (ethBalance === 0n) {
    console.log("⚠️  You have no HYPE tokens for gas fees");
  } else if (ethBalance < ethers.parseEther("0.001")) {
    console.log("⚠️  Low HYPE balance for gas fees");
  } else {
    console.log("✅ Sufficient HYPE for gas fees");
  }

  if (usdcBalance === 0n) {
    console.log("❌ You have no USDC - cannot deposit");
    console.log("\n💡 To get testnet USDC:");
    console.log("   1. Check for HyperEVM testnet faucets");
    console.log("   2. Ask in Hyperliquid Discord/community");
    console.log("   3. Bridge from another testnet");
  } else if (usdcBalance < ethers.parseUnits("10", 6)) {
    console.log("⚠️  USDC balance less than 10 USDC");
    console.log(`   You can deposit up to ${ethers.formatUnits(usdcBalance, 6)} USDC`);
  } else {
    console.log("✅ Sufficient USDC for deposit");
  }

  console.log("\n--- Next Steps ---");
  if (usdcBalance > 0n && VAULT_ADDRESS) {
    console.log("You're ready to deposit! Run:");
    console.log("npx hardhat run scripts/deposit.ts --network hyperEvmTestnet");
  } else if (usdcBalance > 0n && !VAULT_ADDRESS) {
    console.log("Add VAULT_ADDRESS to your .env file, then run:");
    console.log("npx hardhat run scripts/deposit.ts --network hyperEvmTestnet");
  } else {
    console.log("Acquire testnet USDC first, then run:");
    console.log("npx hardhat run scripts/deposit.ts --network hyperEvmTestnet");
  }

  console.log("\n--- Explorer Links ---");
  console.log(`Your account: https://testnet.purrsec.com/address/${userAddress}`);
  console.log(`USDC token: https://testnet.purrsec.com/address/${USDC_ADDRESS}`);
  if (VAULT_ADDRESS) {
    console.log(`Your vault: https://testnet.purrsec.com/address/${VAULT_ADDRESS}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


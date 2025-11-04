import { ethers } from "hardhat";

async function main() {
  const VAULT_ADDRESS = process.env.VAULT_ADDRESS || "0xB6b9Db33FCdDC4c2FCCfc049D72aF5D0766A26e6";
  const AMOUNT_USDC = 28; // 29.59 USDC to transfer to perp

  console.log("Transferring USDC from spot to perp...");
  console.log("Vault address:", VAULT_ADDRESS);

  // Get the signer (owner)
  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);

  // Get vault contract
  const vault = await ethers.getContractAt("HyperCoreVault", VAULT_ADDRESS);

  // Scale to 10^8 for HyperCore USD
  const scaledAmount = BigInt(Math.floor(AMOUNT_USDC * 1e6));
  const toPerp = false; // true = transfer TO perp, false = transfer FROM perp

  console.log("\n=== Transfer Parameters ===");
  console.log("Amount:", AMOUNT_USDC, "USDC");
  console.log("Direction: Spot → Perp");
  console.log("Scaled Amount:", scaledAmount.toString());
  console.log("===========================\n");

  try {
    console.log("Submitting USD class transfer...");
    const tx = await vault.usdClassTransfer(scaledAmount, toPerp);
    
    console.log("Transaction hash:", tx.hash);
    console.log("Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("✅ Transfer completed successfully!");
    console.log("Block number:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());
    
    console.log("\nTransaction:", `https://testnet.purrsec.com/tx/${tx.hash}`);
    console.log("\n💡 Your 30 USDC is now available on the perp side for trading!");
  } catch (error: any) {
    console.error("\n❌ Transfer failed:");
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


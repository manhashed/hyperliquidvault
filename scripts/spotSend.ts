import { ethers } from "hardhat";

/**
 * Spot Send - Send tokens from vault's spot balance to a SELECTED_TOKEN.contractAddress address
 * Uses spotSend function (Action ID 6)
 */

// Token configuration structure
interface TokenConfig {
  name: string;
  tokenId: bigint;
  decimals: number;
  contractAddress: string;
}

// Available token configurations
const TOKENS: { [key: string]: TokenConfig } = {
  USDC: {
    name: "USDC",
    tokenId: 0n,
    decimals: 8,
    contractAddress: "0x2B3370eE501B4a559b57D449569354196457D8Ab",
  },
  HYPE: {
    name: "HYPE",
    tokenId: 135n,
    decimals: 18,
    contractAddress: "0x2222222222222222222222222222222222222222",
  },
};

async function main() {
  const VAULT_ADDRESS = process.env.VAULT_ADDRESS || "0xB6b9Db33FCdDC4c2FCCfc049D72aF5D0766A26e6";
  const DESTINATION_ADDRESS = "0x2bbb22be8deab3487b378c95e276768a772c2738";
  
  // SELECT TOKEN HERE - Change this to switch between tokens
  const SELECTED_TOKEN = "USDC"; // Options: "USDC", "HYPE"
  
  // Configuration
  const AMOUNT = 1; // Amount in human-readable format

  console.log("Spot Send - Sending tokens from vault...");
  console.log("Vault address:", VAULT_ADDRESS);
  console.log("");

  // Get the signer (owner)
  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);

  // Get vault contract
  const vault = await ethers.getContractAt("HyperCoreVault", VAULT_ADDRESS);

  // Get selected token configuration
  const token = TOKENS[SELECTED_TOKEN];
  if (!token) {
    throw new Error(`Unknown token: ${SELECTED_TOKEN}. Available: ${Object.keys(TOKENS).join(", ")}`);
  }

  // Scale amount based on token decimals
  // For USDC (6 decimals): 10 * 10^6 = 10000000
  // For HYPE (18 decimals): 10 * 10^18 = 10000000000000000000
  // Then multiply by 10^8 for Hyperliquid's scaling
  const scaledAmount = BigInt(Math.floor(AMOUNT * Math.pow(10, token.decimals)));

  console.log("═══ SPOT SEND PARAMETERS ═══");
  console.log("Token:", token.name);
  console.log("Token ID:", token.tokenId.toString());
  console.log("Token Decimals:", token.decimals);
  console.log("Token Address:", token.contractAddress);
  console.log("SELECTED_TOKEN.contractAddress:", token.contractAddress);
  console.log("Amount:", AMOUNT, token.name);
  console.log("Scaled Amount:", scaledAmount.toString());
  console.log("═══════════════════════════════\n");

  try {
    console.log("Submitting spot send transaction...");
    const tx = await vault.spotSend(
      token.contractAddress,
      token.tokenId,
      scaledAmount
    );
    
    console.log("Transaction hash:", tx.hash);
    console.log("Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("✅ Spot send completed successfully!");
    console.log("Block number:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());
    
    console.log("\nTransaction:", `https://testnet.purrsec.com/tx/${tx.hash}`);
    console.log(`\n✅ Successfully sent ${AMOUNT} ${token.name} to ${token.contractAddress}`);
    console.log("\n💡 Note: This sends from vault's SPOT balance, not perp balance");
    console.log(`💡 Token contract: ${token.contractAddress}`);
    console.log("💡 Run 'node api-scripts/getAccountState.js' to check balances");
  } catch (error: any) {
    console.error("\n❌ Spot send failed:");
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


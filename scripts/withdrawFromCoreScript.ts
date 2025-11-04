import { ethers } from "hardhat";

/**
 * Withdraw tokens from HyperCore
 * Uses withdrawFromCore function (spotSend action ID 6)
 */

// Token configuration structure
interface TokenConfig {
  name: string;
  address: string;
  decimals: number;
  tokenId: number;
}

// Available token configurations
const TOKENS: { [key: string]: TokenConfig } = {
  USDC: {
    name: "USDC",
    address: "0x2B3370eE501B4a559b57D449569354196457D8Ab",
    decimals: 6,
    tokenId: 0,
  },
  HYPE: {
    name: "HYPE",
    address: "0x2222222222222222222222222222222222222222",
    decimals: 18,
    tokenId: 135,
  },
};

async function main() {
  const VAULT_ADDRESS = process.env.VAULT_ADDRESS || "0xB6b9Db33FCdDC4c2FCCfc049D72aF5D0766A26e6";
  
  // SELECT TOKEN HERE - Change this to switch between tokens
  const SELECTED_TOKEN = "USDC"; // Options: "USDC", "HYPE"
  
  // Configuration
  const AMOUNT = 5; // Amount in human-readable format

  console.log("Withdrawing tokens from HyperCore...");
  console.log("Vault address:", VAULT_ADDRESS);
  console.log("");

  // Get the signer (owner)
  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);

  // Get selected token configuration
  const token = TOKENS[SELECTED_TOKEN];
  if (!token) {
    throw new Error(`Unknown token: ${SELECTED_TOKEN}. Available: ${Object.keys(TOKENS).join(", ")}`);
  }

  // Get vault contract
  const vault = await ethers.getContractAt("HyperCoreVault", VAULT_ADDRESS);

  // Scale amount based on token decimals
  const scaledAmount = ethers.parseUnits(AMOUNT.toString(), token.decimals);

  console.log("═══ WITHDRAW FROM CORE PARAMETERS ═══");
  console.log("Token:", token.name);
  console.log("Token Type:", token.name === "HYPE" ? "NATIVE" : "ERC20");
  console.log("Token Address:", token.address);
  console.log("Token Decimals:", token.decimals);
  console.log("Token ID:", token.tokenId);
  console.log("Amount:", AMOUNT, token.name);
  console.log("Scaled Amount:", scaledAmount.toString());
  console.log("═══════════════════════════════════\n");

  try {
    console.log("📥 Submitting withdraw from core transaction...");
    
    const tx = await vault.withdrawFromCore(
      token.address,
      token.tokenId,
      scaledAmount
    );
    
    console.log("Transaction hash:", tx.hash);
    console.log("Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("✅ Withdraw from core completed successfully!");
    console.log("Block number:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());
    
    console.log("\nTransaction:", `https://testnet.purrsec.com/tx/${tx.hash}`);
    console.log(`\n✅ Successfully withdrew ${AMOUNT} ${token.name} from HyperCore`);
    
    if (token.name === "HYPE") {
      console.log("💡 HYPE is native token - withdrawal sends to destination as native HYPE");
    } else {
      console.log("💡 This withdraws from HyperCore spot balance to the destination");
    }
    console.log("💡 Run 'node api-scripts/getAccountState.js' to check balances");
  } catch (error: any) {
    console.error("\n❌ Withdraw from core failed:");
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


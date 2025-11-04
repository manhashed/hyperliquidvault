import { ethers } from "hardhat";

/**
 * Deposit tokens from vault's own balance to HyperCore
 * This function uses the vault's existing token balance instead of transferring from user
 * 
 * Use case: When vault has already received tokens and needs to deposit them to core
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
  
  // ═══════════════════════════════════════════════════════════════════
  // SELECT TOKEN HERE - Change this to switch between tokens
  // ═══════════════════════════════════════════════════════════════════
  const SELECTED_TOKEN = "HYPE"; // Options: "USDC", "HYPE"
  
  // Configuration
  const AMOUNT = 0.05; // Amount in human-readable format

  console.log("Depositing vault's balance to HyperCore...");
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

  // Calculate system address
  let systemAddress: string;
  if (token.tokenId === 135) {
    // HYPE special case
    systemAddress = "0x2222222222222222222222222222222222222222";
  } else {
    // Standard system address: 0x20 + tokenId in big-endian
    systemAddress = "0x" + (0x2000000000000000000000000000000000000000n | BigInt(token.tokenId)).toString(16).padStart(40, '0');
  }

  console.log("═══ DEPOSIT VAULT BALANCE TO CORE ═══");
  console.log("Token:", token.name);
  console.log("Token Type:", token.name === "HYPE" ? "NATIVE" : "ERC20");
  console.log("Token Contract:", token.address);
  console.log("System Address:", systemAddress);
  console.log("Token Decimals:", token.decimals);
  console.log("Token ID:", token.tokenId);
  console.log("Amount:", AMOUNT, token.name);
  console.log("Scaled Amount:", scaledAmount.toString());
  console.log("═══════════════════════════════════════\n");

  // Check vault's balance
  if (token.name === "HYPE") {
    const vaultBalance = await ethers.provider.getBalance(VAULT_ADDRESS);
    console.log("Vault HYPE balance:", ethers.formatEther(vaultBalance), "HYPE");

    if (vaultBalance < scaledAmount) {
      console.error(`\n❌ Insufficient vault HYPE balance. Need ${AMOUNT} HYPE but have ${ethers.formatEther(vaultBalance)} HYPE`);
      process.exit(1);
    }

    console.log("✅ Sufficient vault HYPE balance");
  } else {
    // For ERC20 tokens (USDC, etc.)
    const tokenContract = await ethers.getContractAt("IERC20", token.address);
    const vaultBalance = await tokenContract.balanceOf(VAULT_ADDRESS);
    console.log("Vault balance:", ethers.formatUnits(vaultBalance, token.decimals), token.name);

    if (vaultBalance < scaledAmount) {
      console.error(`\n❌ Insufficient vault balance. Need ${AMOUNT} ${token.name} but have ${ethers.formatUnits(vaultBalance, token.decimals)} ${token.name}`);
      process.exit(1);
    }

    console.log("✅ Sufficient vault balance");
  }

  try {
    console.log("\n📤 Submitting deposit vault balance to core transaction...");
    
    // For HYPE (native token), send value with transaction
    // For ERC20 tokens, no value needed (vault uses its own balance)
    const txOptions = token.name === "HYPE" ? { value: scaledAmount } : {};
    
    // Call depositVaultBalanceToCore
    const tx = await vault.depositVaultBalanceToCore(token.address, token.tokenId, scaledAmount, txOptions);
    
    console.log("Transaction hash:", tx.hash);
    console.log("Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("✅ Deposit to core completed successfully!");
    console.log("Block number:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());
    
    console.log("\nTransaction:", `https://testnet.purrsec.com/tx/${tx.hash}`);
    console.log(`\n✅ Successfully deposited ${AMOUNT} ${token.name} from vault's balance to HyperCore`);
    
    if (token.name === "HYPE") {
      console.log("💡 Sent as native HYPE from vault's balance");
    } else {
      console.log("💡 Used vault's own ERC20 balance (no user approval needed)");
    }
    console.log("💡 Run 'node api-scripts/getAccountState.js' to check balances");
  } catch (error: any) {
    console.error("\n❌ Deposit to core failed:");
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


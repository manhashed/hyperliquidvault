import { ethers } from "hardhat";
import hre from "hardhat";

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

// Network-specific token configurations
const NETWORK_TOKENS = {
  testnet: {
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
      tokenId: 1105,
    },
  },
  mainnet: {
    USDT: {
      name: "USDT",
      address: "0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb",
      decimals: 6,
      tokenId: 268,
    },
    HYPE: {
      name: "HYPE",
      address: "0x2222222222222222222222222222222222222222",
      decimals: 18,
      tokenId: 150,
    },
  },
};

async function main() {
  const VAULT_ADDRESS = process.env.VAULT_ADDRESS || "0xB6b9Db33FCdDC4c2FCCfc049D72aF5D0766A26e6";
  
  // Detect network
  const networkName = hre.network.name;
  const isMainnet = networkName === "hyperEvmMainnet";
  const TOKENS = isMainnet ? NETWORK_TOKENS.mainnet : NETWORK_TOKENS.testnet;
  
  // ═══════════════════════════════════════════════════════════════════
  // SELECT TOKEN HERE - Change this to switch between tokens
  // ═══════════════════════════════════════════════════════════════════
  // Testnet: "USDC", "HYPE" | Mainnet: "USDT", "HYPE"
  const SELECTED_TOKEN = "USDT";
  
  // Configuration
  const AMOUNT = 26.96; // Amount in human-readable format

  console.log("Depositing vault's balance to HyperCore...");
  console.log(`Network: ${isMainnet ? "MAINNET" : "TESTNET"} (${networkName})`);
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
  if (token.tokenId === 1105 || token.tokenId === 150) {
    // HYPE special case (testnet: 1105, mainnet: 150)
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
    
    // Call depositVaultBalanceToCore
    const tx = await vault.depositVaultBalanceToCore(token.address, token.tokenId, scaledAmount);
    
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


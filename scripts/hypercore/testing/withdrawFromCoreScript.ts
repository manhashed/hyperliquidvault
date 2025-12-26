import { ethers } from "hardhat";
import hre from "hardhat";

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

// Network-specific token configurations
const NETWORK_TOKENS = {
  testnet: {
    USDC: {
      name: "USDC",
      address: "0x2B3370eE501B4a559b57D449569354196457D8Ab",
      decimals: 8,
      tokenId: 0,
    },
    HYPE: {
      name: "HYPE",
      address: "0x2222222222222222222222222222222222222222",
      decimals: 8,
      tokenId: 1105,
    },
  },
  mainnet: {
    USDT: {
      name: "USDT",
      address: "0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb",
      decimals: 8,
      tokenId: 268,
    },
    USDC: {
      name: "USDC",
      address: "",
      decimals: 6,
      tokenId: 0,
    },
    HYPE: {
      name: "HYPE",
      address: "0x2222222222222222222222222222222222222222",
      decimals: 8,
      tokenId: 150,
    },
  },
};

async function main() {
  const VAULT_ADDRESS = process.env.VAULT_ADDRESS;
  
  // Detect network
  const networkName = hre.network.name;
  const isMainnet = networkName === "hyperEvmMainnet";
  const TOKENS = isMainnet ? NETWORK_TOKENS.mainnet : NETWORK_TOKENS.testnet;
  
  // SELECT TOKEN HERE - Change this to switch between tokens
  // Testnet: "USDC", "HYPE" | Mainnet: "USDT", "HYPE"
  const SELECTED_TOKEN = "USDT";
  
  // Configuration
  const AMOUNT = 25.96; // Amount in human-readable format

  console.log("Withdrawing tokens from HyperCore...");
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


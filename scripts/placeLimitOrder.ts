import { ethers } from "hardhat";

// Asset configuration structure
interface AssetConfig {
  name: string;
  assetId: number;
  price: number;      // Human-readable price
  size: number;       // Human-readable size
  isBuy: boolean;
  reduceOnly: boolean;
  tif: number;        // 1=ALO, 2=GTC, 3=IOC
  cloid: bigint;
}

// Available asset configurations
const ASSETS: { [key: string]: AssetConfig } = {
  BTC: {
    name: "BTC",
    assetId: 3,
    price: 107616,
    size: 0.001,
    isBuy: true,
    reduceOnly: false,
    tif: 3, // IOC
    cloid: 0n,
  },
  HYPE: {
    name: "HYPE",
    assetId: 135,
    price: 112.5,
    size: 0.5,
    isBuy: true,
    reduceOnly: false,
    tif: 3, // IOC
    cloid: 0n,
  },
};

async function main() {
  const VAULT_ADDRESS = process.env.VAULT_ADDRESS || "0xB6b9Db33FCdDC4c2FCCfc049D72aF5D0766A26e6";
  
  // SELECT ASSET HERE - Change this to switch between assets
  const SELECTED_ASSET = "HYPE"; // Options: "BTC", "HYPE"

  console.log("Placing limit order on HyperCoreVault...");
  console.log("Vault address:", VAULT_ADDRESS);

  // Get the signer (owner)
  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);

  // Get vault contract
  const vault = await ethers.getContractAt("HyperCoreVault", VAULT_ADDRESS);

  // Get selected asset configuration
  const config = ASSETS[SELECTED_ASSET];
  if (!config) {
    throw new Error(`Unknown asset: ${SELECTED_ASSET}`);
  }

  // Scale values to 10^8 for HyperCore
  const asset = config.assetId;
  const isBuy = config.isBuy;
  const limitPx = BigInt(Math.floor(config.price * 1e8));
  const size = BigInt(Math.floor(config.size * 1e8));
  const reduceOnly = config.reduceOnly;
  const tif = config.tif;
  const cloid = config.cloid;

  // Display order parameters
  let tifLabel = "";
  switch (tif) {
    case 1:
      tifLabel = "ALO";
      break;
    case 2:
      tifLabel = "GTC";
      break;
    case 3:
      tifLabel = "IOC";
      break;
    default:
      tifLabel = `Unknown (${tif})`;
  }

  console.log("\n=== Order Parameters ===");
  console.log("Asset:", config.name, `(ID: ${asset})`);
  console.log("Side:", isBuy ? "BUY" : "SELL");
  console.log("Price:", config.price, "USD");
  console.log("Size:", config.size, config.name);
  console.log("Reduce Only:", reduceOnly);
  console.log("Time in Force:", tifLabel);
  console.log("Client Order ID:", cloid.toString());
  console.log("Scaled Price:", limitPx.toString());
  console.log("Scaled Size:", size.toString());
  console.log("========================\n");

  try {
    console.log("Submitting order...");
    const tx = await vault.placeLimitOrder(
      asset,
      isBuy,
      limitPx,
      size,
      reduceOnly,
      tif,
      cloid
    );
    
    console.log("Transaction hash:", tx.hash);
    console.log("Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("✅ Order placed successfully!");
    console.log("Block number:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());
    
    console.log("\nTransaction:", `https://testnet.purrsec.com/tx/${tx.hash}`);
  } catch (error: any) {
    console.error("\n❌ Order placement failed:");
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


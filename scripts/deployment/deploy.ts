import { ethers, run } from "hardhat";
import hre from "hardhat";

async function main() {
  // Detect network
  const networkName = hre.network.name;
  const isMainnet = networkName === "hyperEvmMainnet";
  
  // Network-specific stablecoin addresses
  const STABLECOIN_CONFIG = {
    testnet: {
      name: "USDC",
      address: "0x2B3370eE501B4a559b57D449569354196457D8Ab",
      tokenId: 0,
      hypeId: 1105,
      chainId: 998,
      explorerUrl: "https://testnet.purrsec.com",
    },
    mainnet: {
      name: "USDT",
      address: "0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb",
      tokenId: 268,
      hypeId: 150,
      chainId: 999,
      explorerUrl: "https://hyperevmscan.io",
    },
  };
  
  const config = isMainnet ? STABLECOIN_CONFIG.mainnet : STABLECOIN_CONFIG.testnet;
  const STABLECOIN_ADDRESS = config.address;

  console.log(`Starting HyperCoreVault deployment on HyperEVM ${isMainnet ? "Mainnet" : "Testnet"}...`);
  console.log(`Network: ${networkName} (Chain ID: ${config.chainId})`);
  console.log(`Stablecoin: ${config.name} at ${STABLECOIN_ADDRESS}`);

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "HYPE");

  // Deploy HyperCoreVault
  console.log("\nDeploying HyperCoreVault...");
  const HyperCoreVault = await ethers.getContractFactory("HyperCoreVault");
  const vault = await HyperCoreVault.deploy();
  
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  
  console.log("HyperCoreVault deployed to:", vaultAddress);

  // Initialize the vault
  console.log("\nInitializing HyperCoreVault...");
  const initTx = await vault.initialize(STABLECOIN_ADDRESS, deployer.address, config.tokenId, config.hypeId);
  await initTx.wait();
  console.log("HyperCoreVault initialized successfully!");

  console.log("\n=== Deployment Summary ===");
  console.log("Network:", isMainnet ? "MAINNET" : "TESTNET", `(${networkName})`);
  console.log("Contract Address:", vaultAddress);
  console.log(`${config.name} Address:`, STABLECOIN_ADDRESS);
  console.log("Owner Address:", deployer.address);
  console.log("Explorer:", `${config.explorerUrl}/address/${vaultAddress}`);

  // Wait for a few block confirmations before verifying
  console.log("\nWaiting for block confirmations...");
  await vault.deploymentTransaction()?.wait(5);

  // Verify the contract on the explorer
  console.log("\nVerifying contract on explorer...");
  try {
    await run("verify:verify", {
      address: vaultAddress,
      constructorArguments: [],
    });
    console.log("Contract verified successfully!");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("Contract is already verified!");
    } else {
      console.error("Error verifying contract:", error.message);
    }
  }

  console.log("\n=== Next Steps ===");
  console.log("1. Save the contract address:", vaultAddress);
  console.log(`2. Run the deposit script to approve and deposit ${config.name}`);
  console.log(`   npx hardhat run scripts/testing/deposit.ts --network ${networkName}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


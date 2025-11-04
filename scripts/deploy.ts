import { ethers, run } from "hardhat";

async function main() {
  // USDC address on HyperEVM testnet
  const USDC_ADDRESS = "0x2B3370eE501B4a559b57D449569354196457D8Ab";

  console.log("Starting HyperCoreVault deployment on HyperEVM testnet...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy HyperCoreVault
  console.log("\nDeploying HyperCoreVault...");
  const HyperCoreVault = await ethers.getContractFactory("HyperCoreVault");
  const vault = await HyperCoreVault.deploy();
  
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  
  console.log("HyperCoreVault deployed to:", vaultAddress);

  // Initialize the vault
  console.log("\nInitializing HyperCoreVault...");
  const initTx = await vault.initialize(USDC_ADDRESS, deployer.address);
  await initTx.wait();
  console.log("HyperCoreVault initialized successfully!");

  console.log("\n=== Deployment Summary ===");
  console.log("Contract Address:", vaultAddress);
  console.log("USDC Address:", USDC_ADDRESS);
  console.log("Owner Address:", deployer.address);

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
  console.log("2. Run the deposit script to approve and deposit USDC");
  console.log("   npx hardhat run scripts/deposit.ts --network hyperEvmTestnet");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


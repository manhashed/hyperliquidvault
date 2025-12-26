import { ethers, run } from "hardhat";
import hre from "hardhat";

async function main() {
  // Detect network
  const networkName = hre.network.name;
  const isMainnet = networkName === "hyperEvmMainnet";
  
  // Network-specific USDC addresses
  const USDC_CONFIG = {
    testnet: {
      name: "USDC",
      address: "0x2B3370eE501B4a559b57D449569354196457D8Ab",
      explorerUrl: "https://testnet.purrsec.com",
    },
    mainnet: {
      name: "USDC",
      address: "0xb88339CB7199b77E23DB6E890353E22632Ba630f",
      explorerUrl: "https://hyperevmscan.io",
    },
  };
  
  const config = isMainnet ? USDC_CONFIG.mainnet : USDC_CONFIG.testnet;
  const USDC_ADDRESS = config.address;

  console.log(`Starting HyperEVMVault deployment on HyperEVM ${isMainnet ? "Mainnet" : "Testnet"}...`);
  console.log(`Network: ${networkName}`);
  console.log(`USDC: ${config.name} at ${USDC_ADDRESS}`);

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "HYPE");

  // Deploy HyperEVMVault
  console.log("\nDeploying HyperEVMVault...");
  const HyperEVMVault = await ethers.getContractFactory("HyperEVMVault");
  const vault = await HyperEVMVault.deploy();
  
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  
  console.log("HyperEVMVault deployed to:", vaultAddress);

  // Initialize the vault
  console.log("\nInitializing HyperEVMVault...");
  const initTx = await vault.initialize(USDC_ADDRESS, deployer.address);
  await initTx.wait();
  console.log("HyperEVMVault initialized successfully!");

  console.log("\n=== Deployment Summary ===");
  console.log("Network:", isMainnet ? "MAINNET" : "TESTNET", `(${networkName})`);
  console.log("Contract Address:", vaultAddress);
  console.log(`${config.name} Address:`, USDC_ADDRESS);
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
  console.log(`   npx hardhat run scripts/hyperevm/testing/deposit.ts --network ${networkName}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


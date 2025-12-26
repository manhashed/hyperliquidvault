import { ethers, upgrades } from "hardhat";
import hre from "hardhat";

async function main() {
  // Detect network
  const networkName = hre.network.name;
  const isMainnet = networkName === "hyperEvmMainnet";
  
  // Network-specific configurations
  const NETWORK_CONFIG = {
    testnet: {
      chainId: 998,
      explorerUrl: "https://testnet.purrsec.com",
    },
    mainnet: {
      chainId: 999,
      explorerUrl: "https://hyperevmscan.io",
    },
  };
  
  const config = isMainnet ? NETWORK_CONFIG.mainnet : NETWORK_CONFIG.testnet;
  
  // Read from deployment-info.json or use environment variables
  const fs = require('fs');
  let PROXY_ADDRESS = process.env.PROXY_ADDRESS;
  let PROXY_ADMIN_ADDRESS = process.env.PROXY_ADMIN_ADDRESS;
  
  if (!PROXY_ADDRESS && fs.existsSync('deployment-info.json')) {
    const deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
    PROXY_ADDRESS = deploymentInfo.proxy;
    PROXY_ADMIN_ADDRESS = deploymentInfo.proxyAdmin;
    console.log("📁 Loaded addresses from deployment-info.json");
  }
  
  if (!PROXY_ADDRESS) {
    console.error("❌ PROXY_ADDRESS not found!");
    console.log("Please set PROXY_ADDRESS environment variable or ensure deployment-info.json exists");
    process.exit(1);
  }

  console.log(`Upgrading FelixVault implementation on ${isMainnet ? "Mainnet" : "Testnet"}...`);
  console.log("=".repeat(80));

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("\n📋 Upgrade Configuration:");
  console.log("   Network:", isMainnet ? "MAINNET" : "TESTNET", `(${networkName})`);
  console.log("   Chain ID:", config.chainId);
  console.log("   Deployer:", deployer.address);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("   Balance:", ethers.formatEther(balance), "HYPE");
  console.log("   Proxy Address:", PROXY_ADDRESS);
  if (PROXY_ADMIN_ADDRESS) {
  console.log("   ProxyAdmin Address:", PROXY_ADMIN_ADDRESS);
  }

  // Deploy new implementation
  console.log("\n🚀 Deploying new implementation...");
  const FelixVaultV2 = await ethers.getContractFactory("FelixVault");
  
  // Upgrade the proxy to the new implementation
  const upgraded = await upgrades.upgradeProxy(PROXY_ADDRESS, FelixVaultV2);
  await upgraded.waitForDeployment();

  console.log("✅ Proxy upgraded successfully!");

  // Get new implementation address
  const newImplementationAddress = await upgrades.erc1967.getImplementationAddress(PROXY_ADDRESS);
  console.log("✅ New Implementation deployed at:", newImplementationAddress);

  console.log("\n" + "=".repeat(80));
  console.log("📊 UPGRADE SUMMARY");
  console.log("=".repeat(80));
  console.log("Network:                    ", isMainnet ? "MAINNET" : "TESTNET", `(${networkName})`);
  console.log("Proxy Address:              ", PROXY_ADDRESS);
  console.log("New Implementation Address: ", newImplementationAddress);
  if (PROXY_ADMIN_ADDRESS) {
  console.log("ProxyAdmin Address:         ", PROXY_ADMIN_ADDRESS);
  }
  console.log("=".repeat(80));

  // Verify the upgrade worked
  console.log("\n🔍 Verifying upgrade...");
  const vault = await ethers.getContractAt("FelixVault", PROXY_ADDRESS);
  const owner = await vault.owner();
  console.log("Vault owner:", owner);
  console.log("✅ Upgrade verified - proxy is still functional!");

  console.log("\n" + "=".repeat(80));
  console.log("📋 NEXT STEPS");
  console.log("=".repeat(80));
  console.log("1. Verify the new implementation:");
  console.log(`   npx hardhat verify --network ${networkName} ${newImplementationAddress}`);
  console.log("\n2. Test the upgraded functions");
  console.log("\n3. The proxy address remains the same:", PROXY_ADDRESS);
  console.log("=".repeat(80));

  console.log("\n🔗 Explorer Links:");
  console.log(`   Proxy: ${config.explorerUrl}/address/${PROXY_ADDRESS}`);
  console.log(`   New Implementation: ${config.explorerUrl}/address/${newImplementationAddress}`);
  if (PROXY_ADMIN_ADDRESS) {
    console.log(`   ProxyAdmin: ${config.explorerUrl}/address/${PROXY_ADMIN_ADDRESS}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


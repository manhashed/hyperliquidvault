import { ethers, upgrades } from "hardhat";
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
      chainId: 998,
      explorerUrl: "https://testnet.purrsec.com",
    },
    mainnet: {
      name: "USDC",
      address: "0xb88339CB7199b77E23DB6E890353E22632Ba630f",
      chainId: 999,
      explorerUrl: "https://hyperevmscan.io",
    },
  };
  
  const config = isMainnet ? USDC_CONFIG.mainnet : USDC_CONFIG.testnet;
  const USDC_ADDRESS = config.address;

  console.log(`Starting HyperEVMVault deployment as Transparent Proxy on HyperEVM ${isMainnet ? "Mainnet" : "Testnet"}...`);
  console.log("=".repeat(80));

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("\n📋 Deployment Configuration:");
  console.log("   Network:", isMainnet ? "MAINNET" : "TESTNET", `(${networkName})`);
  console.log("   Chain ID:", config.chainId);
  console.log("   Deployer:", deployer.address);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("   Balance:", ethers.formatEther(balance), "HYPE");
  console.log(`   ${config.name} Address:`, USDC_ADDRESS);

  // Deploy HyperEVMVault as Transparent Proxy
  console.log("\n🚀 Deploying HyperEVMVault as Transparent Proxy...");
  const HyperEVMVault = await ethers.getContractFactory("HyperEVMVault");
  
  // Deploy with transparent proxy pattern
  // The initialize function will be called automatically with these args
  const vault = await upgrades.deployProxy(
    HyperEVMVault,
    [USDC_ADDRESS, deployer.address],
    { 
      kind: 'transparent',
      initializer: 'initialize'
    }
  );
  
  await vault.waitForDeployment();
  const proxyAddress = await vault.getAddress();
  
  console.log("✅ HyperEVMVault Proxy deployed to:", proxyAddress);

  // Get implementation address
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log("✅ Implementation contract at:", implementationAddress);

  // Get admin address
  const adminAddress = await upgrades.erc1967.getAdminAddress(proxyAddress);
  console.log("✅ ProxyAdmin contract at:", adminAddress);

  console.log("\n" + "=".repeat(80));
  console.log("📊 DEPLOYMENT SUMMARY");
  console.log("=".repeat(80));
  console.log("Network:                ", isMainnet ? "MAINNET" : "TESTNET", `(${networkName})`);
  console.log("Proxy Address:          ", proxyAddress);
  console.log("Implementation Address: ", implementationAddress);
  console.log("ProxyAdmin Address:     ", adminAddress);
  console.log("Owner Address:          ", deployer.address);
  console.log(`${config.name} Address:`, USDC_ADDRESS);
  console.log("=".repeat(80));

  // Save deployment info to file
  const fs = require('fs');
  const deploymentInfo = {
    network: networkName,
    networkType: isMainnet ? "mainnet" : "testnet",
    chainId: config.chainId,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    proxy: proxyAddress,
    implementation: implementationAddress,
    proxyAdmin: adminAddress,
    usdc: {
      name: config.name,
      address: USDC_ADDRESS,
    },
  };
  
  fs.writeFileSync(
    'deployment-info.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n💾 Deployment info saved to: deployment-info.json");

  // Wait for block confirmations
  console.log("\n⏳ Waiting for 5 block confirmations before verification...");
  await vault.deploymentTransaction()?.wait(5);
  console.log("✅ Confirmations received!");

  console.log("\n" + "=".repeat(80));
  console.log("📋 NEXT STEPS");
  console.log("=".repeat(80));
  console.log("1. Verify the implementation contract:");
  console.log(`   npx hardhat verify --network ${networkName} ${implementationAddress}`);
  console.log("\n2. Verify the proxy contract:");
  console.log(`   npx hardhat verify --network ${networkName} ${proxyAddress}`);
  console.log("\n3. Run the verification script:");
  console.log(`   npx hardhat run scripts/hyperevm/deployment/verify.ts --network ${networkName}`);
  console.log("\n4. Check balances:");
  console.log(`   VAULT_ADDRESS=${proxyAddress} npx hardhat run scripts/hyperevm/testing/checkBalance.ts --network ${networkName}`);
  console.log(`\n5. Deposit ${config.name} (when you have ${config.name}):`);
  console.log(`   VAULT_ADDRESS=${proxyAddress} npx hardhat run scripts/hyperevm/testing/deposit.ts --network ${networkName}`);
  console.log("=".repeat(80));

  console.log("\n🔗 Explorer Links:");
  console.log(`   Proxy: ${config.explorerUrl}/address/${proxyAddress}`);
  console.log(`   Implementation: ${config.explorerUrl}/address/${implementationAddress}`);
  console.log(`   ProxyAdmin: ${config.explorerUrl}/address/${adminAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


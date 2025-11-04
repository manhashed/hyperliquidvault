import { ethers, upgrades } from "hardhat";

async function main() {
  // USDC address on HyperEVM testnet
  const USDC_ADDRESS = "0x2B3370eE501B4a559b57D449569354196457D8Ab";

  console.log("Starting HyperCoreVault deployment as Transparent Proxy on HyperEVM testnet...");
  console.log("=".repeat(80));

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("\n📋 Deployment Configuration:");
  console.log("   Deployer:", deployer.address);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("   Balance:", ethers.formatEther(balance), "HYPE");
  console.log("   USDC Address:", USDC_ADDRESS);

  // Deploy HyperCoreVault as Transparent Proxy
  console.log("\n🚀 Deploying HyperCoreVault as Transparent Proxy...");
  const HyperCoreVault = await ethers.getContractFactory("HyperCoreVault");
  
  // Deploy with transparent proxy pattern
  // The initialize function will be called automatically with these args
  const vault = await upgrades.deployProxy(
    HyperCoreVault,
    [USDC_ADDRESS, deployer.address],
    { 
      kind: 'transparent',
      initializer: 'initialize'
    }
  );
  
  await vault.waitForDeployment();
  const proxyAddress = await vault.getAddress();
  
  console.log("✅ HyperCoreVault Proxy deployed to:", proxyAddress);

  // Get implementation address
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log("✅ Implementation contract at:", implementationAddress);

  // Get admin address
  const adminAddress = await upgrades.erc1967.getAdminAddress(proxyAddress);
  console.log("✅ ProxyAdmin contract at:", adminAddress);

  console.log("\n" + "=".repeat(80));
  console.log("📊 DEPLOYMENT SUMMARY");
  console.log("=".repeat(80));
  console.log("Proxy Address:          ", proxyAddress);
  console.log("Implementation Address: ", implementationAddress);
  console.log("ProxyAdmin Address:     ", adminAddress);
  console.log("Owner Address:          ", deployer.address);
  console.log("USDC Address:           ", USDC_ADDRESS);
  console.log("=".repeat(80));

  // Save deployment info to file
  const fs = require('fs');
  const deploymentInfo = {
    network: "hyperEvmTestnet",
    chainId: 998,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    proxy: proxyAddress,
    implementation: implementationAddress,
    proxyAdmin: adminAddress,
    usdc: USDC_ADDRESS,
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
  console.log(`   npx hardhat verify --network hyperEvmTestnet ${implementationAddress}`);
  console.log("\n2. Verify the proxy contract:");
  console.log(`   npx hardhat verify --network hyperEvmTestnet ${proxyAddress}`);
  console.log("\n3. Run the verification script:");
  console.log("   npx hardhat run scripts/verify.ts --network hyperEvmTestnet");
  console.log("\n4. Check balances:");
  console.log(`   VAULT_ADDRESS=${proxyAddress} npx hardhat run scripts/checkBalance.ts --network hyperEvmTestnet`);
  console.log("\n5. Deposit USDC (when you have USDC):");
  console.log(`   VAULT_ADDRESS=${proxyAddress} npx hardhat run scripts/deposit.ts --network hyperEvmTestnet`);
  console.log("=".repeat(80));

  console.log("\n🔗 Explorer Links:");
  console.log(`   Proxy: https://testnet.purrsec.com/address/${proxyAddress}`);
  console.log(`   Implementation: https://testnet.purrsec.com/address/${implementationAddress}`);
  console.log(`   ProxyAdmin: https://testnet.purrsec.com/address/${adminAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


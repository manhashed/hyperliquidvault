import { ethers, upgrades } from "hardhat";

async function main() {
  const PROXY_ADDRESS = "0xB6b9Db33FCdDC4c2FCCfc049D72aF5D0766A26e6";
  const PROXY_ADMIN_ADDRESS = "0x9263E34A9919c5fEe06674F9fE12538ff5A87F39";

  console.log("Upgrading HyperCoreVault implementation...");
  console.log("=".repeat(80));

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("\n📋 Upgrade Configuration:");
  console.log("   Deployer:", deployer.address);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("   Balance:", ethers.formatEther(balance), "HYPE");
  console.log("   Proxy Address:", PROXY_ADDRESS);
  console.log("   ProxyAdmin Address:", PROXY_ADMIN_ADDRESS);

  // Deploy new implementation
  console.log("\n🚀 Deploying new implementation...");
  const HyperCoreVaultV2 = await ethers.getContractFactory("HyperCoreVault");
  
  // Upgrade the proxy to the new implementation
  const upgraded = await upgrades.upgradeProxy(PROXY_ADDRESS, HyperCoreVaultV2);
  await upgraded.waitForDeployment();

  console.log("✅ Proxy upgraded successfully!");

  // Get new implementation address
  const newImplementationAddress = await upgrades.erc1967.getImplementationAddress(PROXY_ADDRESS);
  console.log("✅ New Implementation deployed at:", newImplementationAddress);

  console.log("\n" + "=".repeat(80));
  console.log("📊 UPGRADE SUMMARY");
  console.log("=".repeat(80));
  console.log("Proxy Address:              ", PROXY_ADDRESS);
  console.log("New Implementation Address: ", newImplementationAddress);
  console.log("ProxyAdmin Address:         ", PROXY_ADMIN_ADDRESS);
  console.log("=".repeat(80));

  // Verify the upgrade worked
  console.log("\n🔍 Verifying upgrade...");
  const vault = await ethers.getContractAt("HyperCoreVault", PROXY_ADDRESS);
  const owner = await vault.owner();
  console.log("Vault owner:", owner);
  console.log("✅ Upgrade verified - proxy is still functional!");

  console.log("\n" + "=".repeat(80));
  console.log("📋 NEXT STEPS");
  console.log("=".repeat(80));
  console.log("1. Verify the new implementation:");
  console.log(`   npx hardhat verify --network hyperEvmTestnet ${newImplementationAddress}`);
  console.log("\n2. Test the upgraded functions");
  console.log("\n3. The proxy address remains the same:", PROXY_ADDRESS);
  console.log("=".repeat(80));

  console.log("\n🔗 Explorer Links:");
  console.log(`   Proxy: https://testnet.purrsec.com/address/${PROXY_ADDRESS}`);
  console.log(`   New Implementation: https://testnet.purrsec.com/address/${newImplementationAddress}`);
  console.log(`   ProxyAdmin: https://testnet.purrsec.com/address/${PROXY_ADMIN_ADDRESS}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


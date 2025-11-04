import { run } from "hardhat";
import * as fs from "fs";

async function main() {
  console.log("Starting contract verification on HyperEVM testnet...");
  console.log("=".repeat(80));

  // Read deployment info
  if (!fs.existsSync('deployment-info.json')) {
    console.error("❌ deployment-info.json not found!");
    console.log("Please deploy the contract first using:");
    console.log("npx hardhat run scripts/deployProxy.ts --network hyperEvmTestnet");
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
  
  console.log("\n📋 Deployment Information:");
  console.log("   Network:", deploymentInfo.network);
  console.log("   Chain ID:", deploymentInfo.chainId);
  console.log("   Proxy:", deploymentInfo.proxy);
  console.log("   Implementation:", deploymentInfo.implementation);
  console.log("   ProxyAdmin:", deploymentInfo.proxyAdmin);

  // Verify Implementation Contract
  console.log("\n🔍 Verifying Implementation Contract...");
  console.log("Address:", deploymentInfo.implementation);
  
  try {
    await run("verify:verify", {
      address: deploymentInfo.implementation,
      constructorArguments: [],
    });
    console.log("✅ Implementation contract verified successfully!");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ Implementation contract is already verified!");
    } else if (error.message.includes("does not have bytecode")) {
      console.log("⏳ Contract not yet indexed. Please wait a moment and try again.");
    } else {
      console.error("❌ Error verifying implementation:", error.message);
    }
  }

  // Verify Proxy Contract
  console.log("\n🔍 Verifying Proxy Contract...");
  console.log("Address:", deploymentInfo.proxy);
  
  try {
    await run("verify:verify", {
      address: deploymentInfo.proxy,
      constructorArguments: [],
    });
    console.log("✅ Proxy contract verified successfully!");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ Proxy contract is already verified!");
    } else if (error.message.includes("does not have bytecode")) {
      console.log("⏳ Contract not yet indexed. Please wait a moment and try again.");
    } else {
      console.error("❌ Error verifying proxy:", error.message);
    }
  }

  // Verify ProxyAdmin Contract (optional, may not be necessary)
  console.log("\n🔍 Verifying ProxyAdmin Contract...");
  console.log("Address:", deploymentInfo.proxyAdmin);
  
  try {
    await run("verify:verify", {
      address: deploymentInfo.proxyAdmin,
      constructorArguments: [],
    });
    console.log("✅ ProxyAdmin contract verified successfully!");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ ProxyAdmin contract is already verified!");
    } else if (error.message.includes("does not have bytecode")) {
      console.log("⏳ Contract not yet indexed. Please wait a moment and try again.");
    } else {
      console.log("ℹ️  ProxyAdmin verification not critical:", error.message);
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("📊 VERIFICATION SUMMARY");
  console.log("=".repeat(80));
  console.log("Check your contracts on the explorer:");
  console.log(`   Proxy: https://testnet.purrsec.com/address/${deploymentInfo.proxy}`);
  console.log(`   Implementation: https://testnet.purrsec.com/address/${deploymentInfo.implementation}`);
  console.log(`   ProxyAdmin: https://testnet.purrsec.com/address/${deploymentInfo.proxyAdmin}`);
  console.log("=".repeat(80));

  console.log("\n💡 Manual Verification (if automatic fails):");
  console.log("\nFor Implementation:");
  console.log(`npx hardhat verify --network hyperEvmTestnet ${deploymentInfo.implementation}`);
  console.log("\nFor Proxy:");
  console.log(`npx hardhat verify --network hyperEvmTestnet ${deploymentInfo.proxy}`);
  
  console.log("\n🔗 Or verify via web interface:");
  console.log(`https://testnet.purrsec.com/address/${deploymentInfo.implementation}#code`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


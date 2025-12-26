import { execSync } from 'child_process';
import * as fs from 'fs';
import hre from 'hardhat';

async function main() {
  // Detect network
  const networkName = hre.network.name;
  const isMainnet = networkName === "hyperEvmMainnet";
  
  // Network-specific configurations
  const NETWORK_CONFIG = {
    testnet: {
      chainId: 998,
      explorerUrl: "https://testnet.purrsec.com",
      verifierUrl: "https://sourcify.parsec.finance/verify",
    },
    mainnet: {
      chainId: 999,
      explorerUrl: "https://hyperevmscan.io",
      verifierUrl: "https://hyperevmscan.io/verify",
    },
  };
  
  const config = isMainnet ? NETWORK_CONFIG.mainnet : NETWORK_CONFIG.testnet;

  console.log(`Preparing contracts for manual verification on ${isMainnet ? "Mainnet" : "Testnet"}...`);
  console.log("=".repeat(80));

  // Read deployment info
  if (!fs.existsSync('deployment-info.json')) {
    console.error("❌ deployment-info.json not found!");
    console.log("Please deploy the contract first using:");
    console.log(`npx hardhat run scripts/deployment/deployProxy.ts --network ${networkName}`);
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
  
  console.log("\n📋 Deployment Information:");
  console.log("   Network:", deploymentInfo.network || networkName);
  console.log("   Network Type:", isMainnet ? "MAINNET" : "TESTNET");
  console.log("   Proxy:", deploymentInfo.proxy);
  console.log("   Implementation:", deploymentInfo.implementation);
  console.log("   ProxyAdmin:", deploymentInfo.proxyAdmin);

  // Create flattened directory
  if (!fs.existsSync('flattened')) {
    fs.mkdirSync('flattened');
  }

  // Flatten HyperCoreVault
  console.log("\n📝 Flattening HyperCoreVault.sol...");
  try {
    const flattened = execSync(
      'npx hardhat flatten contracts/HyperCoreVault.sol',
      { encoding: 'utf8' }
    );
    
    // Remove duplicate SPDX licenses
    const lines = flattened.split('\n');
    const uniqueLines: string[] = [];
    let seenLicense = false;
    
    for (const line of lines) {
      if (line.includes('SPDX-License-Identifier')) {
        if (!seenLicense) {
          uniqueLines.push(line);
          seenLicense = true;
        }
      } else {
        uniqueLines.push(line);
      }
    }
    
    const cleanedFlattened = uniqueLines.join('\n');
    fs.writeFileSync('flattened/HyperCoreVault.sol', cleanedFlattened);
    console.log("✅ Flattened contract saved to: flattened/HyperCoreVault.sol");
  } catch (error) {
    console.error("❌ Error flattening contract:", error);
  }

  // Create verification instructions
  const instructions = `
# Manual Verification Instructions for HyperEVM ${isMainnet ? "Mainnet" : "Testnet"}

## Deployment Addresses

- **Network:** ${deploymentInfo.network || networkName} (${isMainnet ? "MAINNET" : "TESTNET"})
- **Chain ID:** ${config.chainId}
- **Proxy Contract:** ${deploymentInfo.proxy}
- **Implementation Contract:** ${deploymentInfo.implementation}
- **ProxyAdmin Contract:** ${deploymentInfo.proxyAdmin}

## Step 1: Verify Implementation Contract

1. Go to: ${config.explorerUrl}/address/${deploymentInfo.implementation}
2. Click on the "Contract" tab
3. Click "Verify & Publish" button
4. Select "Via flattened source code" or "Via standard JSON input"

### Using Flattened Source Code:

- **Contract Address:** ${deploymentInfo.implementation}
- **Compiler Version:** v0.8.28
- **Optimization:** Enabled (200 runs)
- **Source Code:** Copy content from \`flattened/HyperCoreVault.sol\`
- **Constructor Arguments:** None (empty)

### Compiler Settings:

\`\`\`json
{
  "optimizer": {
    "enabled": true,
    "runs": 200
  }
}
\`\`\`

## Step 2: Verify Proxy Contract

The proxy contract is a standard OpenZeppelin TransparentUpgradeableProxy.

1. Go to: ${config.explorerUrl}/address/${deploymentInfo.proxy}
2. Click on the "Contract" tab
3. Click "Verify & Publish" button
4. Select "Verify as Proxy"
5. Link it to the implementation at: ${deploymentInfo.implementation}

## Alternative: Use Foundry

If you have Foundry installed, you can try:

\`\`\`bash
forge verify-contract ${deploymentInfo.implementation} \\
  contracts/HyperCoreVault.sol:HyperCoreVault \\
  --chain-id ${config.chainId} \\
  --verifier sourcify \\
  --verifier-url ${config.verifierUrl} \\
  --compiler-version v0.8.28
\`\`\`

## Explorer Links

- **Proxy:** ${config.explorerUrl}/address/${deploymentInfo.proxy}
- **Implementation:** ${config.explorerUrl}/address/${deploymentInfo.implementation}
- **ProxyAdmin:** ${config.explorerUrl}/address/${deploymentInfo.proxyAdmin}

## Contract Details

- **Network:** HyperEVM ${isMainnet ? "Mainnet" : "Testnet"}
- **Chain ID:** ${config.chainId}
- **Compiler:** Solidity 0.8.28
- **Optimization:** Enabled with 200 runs
- **EVM Version:** paris

## Files for Verification

- Flattened Source: \`flattened/HyperCoreVault.sol\`
- Original Source: \`contracts/HyperCoreVault.sol\`

## Need Help?

Visit the Parsec documentation or Hyperliquid Discord for assistance.
`;

  fs.writeFileSync('VERIFICATION_INSTRUCTIONS.md', instructions);
  console.log("✅ Verification instructions saved to: VERIFICATION_INSTRUCTIONS.md");

  console.log("\n" + "=".repeat(80));
  console.log("📊 SUMMARY");
  console.log("=".repeat(80));
  console.log(`Network: ${isMainnet ? "MAINNET" : "TESTNET"} (${networkName})`);
  console.log("Files created:");
  console.log("  ✅ flattened/HyperCoreVault.sol");
  console.log("  ✅ VERIFICATION_INSTRUCTIONS.md");
  console.log("\n" + "=".repeat(80));
  console.log("🔗 Quick Links:");
  console.log(`   Implementation: ${config.explorerUrl}/address/${deploymentInfo.implementation}#code`);
  console.log(`   Proxy: ${config.explorerUrl}/address/${deploymentInfo.proxy}#code`);
  console.log("=".repeat(80));
  console.log("\n💡 Next Steps:");
  console.log("   1. Read VERIFICATION_INSTRUCTIONS.md");
  console.log("   2. Go to the explorer links above");
  console.log("   3. Upload the flattened source code");
  console.log("   4. Or try Foundry verification if available");
  console.log("=".repeat(80));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


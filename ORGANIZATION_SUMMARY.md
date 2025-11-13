# Project Organization Summary

## Overview

Successfully reorganized the HyperLiquid Vault project with improved structure and multi-network support for both **scripts** and **api-scripts**. All scripts now support both **testnet** and **mainnet** with automatic network detection.

---

## 📁 Scripts Folder Reorganization

The `scripts/` folder has been reorganized into two clear categories:

### 1. **scripts/testing/** (14 files)
Contract function testing scripts:

**Balance & Deposits:**
- `checkBalance.ts` - Check HYPE and stablecoin balances for deployer and vault
- `deposit.ts` - Approve and deposit stablecoins (USDC/USDT) to vault
- `withdraw.ts` - Withdraw stablecoins from vault to signer

**Trading:**
- `placeLimitOrder.ts` - Place perpetual limit orders
- `closePosition.ts` - Close a single perpetual position
- `closeAllPositions.ts` - Close all open perpetual positions
- `swapHypeToUsdc.ts` - Swap HYPE → USDC/USDT on spot market
- `swapUsdcToHype.ts` - Swap USDC/USDT → HYPE on spot market

**HyperCore Integration:**
- `depositToCoreScript.ts` - Deposit tokens from signer to HyperCore
- `withdrawFromCoreScript.ts` - Withdraw tokens from HyperCore to vault
- `depositVaultBalanceToCore.ts` - Deposit vault's own balance to HyperCore
- `transferToPerp.ts` - Transfer USD between spot and perpetual accounts
- `spotSend.ts` - Send tokens via spotSend action

**Management:**
- `addApiWallet.ts` - Add API wallet to vault for automated trading

### 2. **scripts/deployment/** (5 files)
Deployment and contract management scripts:

- `deploy.ts` - Deploy non-upgradeable contract
- `deployProxy.ts` - Deploy upgradeable proxy contract (RECOMMENDED)
- `upgradeProxy.ts` - Upgrade existing proxy to new implementation
- `verify.ts` - Verify contracts on block explorer
- `flattenForVerification.ts` - Flatten contracts for manual verification

---

## 🌐 Multi-Network Support

### Scripts (Hardhat-based)

All scripts automatically detect the network via `hre.network.name`:

```bash
# Run on testnet
npx hardhat run scripts/testing/deposit.ts --network hyperEvmTestnet

# Run on mainnet
npx hardhat run scripts/testing/deposit.ts --network hyperEvmMainnet
```

**Network Configurations:**

| Asset/Token | Testnet | Mainnet |
|------------|---------|---------|
| **HYPE** | Token ID: 1105 | Token ID: 150 |
| **Stablecoin** | USDC (ID: 0) | USDT (ID: 268) |
| **Stablecoin Address** | `0x2B3370eE501B4a559b57D449569354196457D8Ab` | `0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb` |
| **BTC (Perp)** | Asset ID: 3 | Asset ID: 0 |
| **HYPE/USDC Spot** | Asset ID: 114 | Asset ID: 92 |
| **Chain ID** | 998 | 999 |
| **Explorer** | https://testnet.purrsec.com | https://hyperevmscan.io |

**Key Changes:**
- Imported `hre from "hardhat"` in all scripts
- Detect network: `const isMainnet = hre.network.name === "hyperEvmMainnet"`
- Use `NETWORK_CONFIGS`, `NETWORK_TOKENS`, `NETWORK_ASSETS`, or `STABLECOIN_CONFIG` objects
- Display network info in console output
- Correct token IDs, addresses, and asset IDs per network
- Scripts load vault address from `deployment-info.json` or `VAULT_ADDRESS` env var

### API Scripts (Node.js-based)

All API scripts now support network selection via **`config.js`** module:

```bash
# Set network (default: testnet)
export HYPERLIQUID_NETWORK=testnet  # or mainnet

# Or inline
HYPERLIQUID_NETWORK=mainnet node api-scripts/getVaultData.js
```

**Network Configurations:**

| Network | API URL | Explorer | Chain ID | RPC URL |
|---------|---------|----------|----------|---------|
| **Testnet** | `https://api.hyperliquid-testnet.xyz/info` | `https://testnet.purrsec.com` | 998 | `https://rpc.hyperliquid-testnet.xyz/evm` |
| **Mainnet** | `https://api.hyperliquid.xyz/info` | `https://hyperevmscan.io` | 999 | `https://rpc.hyperliquid.xyz/evm` |

**Updated API Scripts (12 files):**
1. `config.js` ⭐ - Centralized network configuration (reads from `HYPERLIQUID_NETWORK` env var)
2. `getAccountState.js` - Account state with network awareness
3. `getVaultData.js` - Comprehensive vault data (positions, spot balances, orders, fills, funding)
4. `getOpenOrders.js` - Open orders
5. `getUserFills.js` - Recent fills
6. `getFundingHistory.js` - Funding history
7. `getMarketData.js` - Market data
8. `getLinkedAssets.js` - Linked assets (Hip-1 and EVM)
9. `getAllData.js` - All data fetcher
10. `findSpotPair.js` - Find spot pairs by symbols
11. `listSpotPairs.js` - List all spot pairs
12. `exportLinkedAssets.js` - Export assets to JSON files

---

## 📋 Updated Files Summary

### Hardhat Scripts (14 scripts updated)
- ✅ `swapHypeToUsdc.ts` - Multi-network swap configs (HYPE → USDC/USDT)
- ✅ `swapUsdcToHype.ts` - Multi-network swap configs (USDC/USDT → HYPE)
- ✅ `spotSend.ts` - Multi-network token configs
- ✅ `depositToCoreScript.ts` - Multi-network token configs
- ✅ `withdrawFromCoreScript.ts` - Multi-network token configs
- ✅ `depositVaultBalanceToCore.ts` - Multi-network token configs
- ✅ `placeLimitOrder.ts` - Multi-network asset configs
- ✅ `deposit.ts` - Multi-network stablecoin configs
- ✅ `withdraw.ts` - Multi-network stablecoin configs
- ✅ `checkBalance.ts` - Multi-network token & explorer configs
- ✅ `closePosition.ts` - Multi-network asset ID configs
- ✅ `transferToPerp.ts` - Multi-network stablecoin configs
- ✅ `addApiWallet.ts` - Multi-network explorer configs
- ✅ `closeAllPositions.ts` - Network-aware

### Deployment Scripts (5 scripts updated)
- ✅ `deploy.ts` - Multi-network stablecoin and token ID configs
- ✅ `deployProxy.ts` - Multi-network configs, saves to `deployment-info.json`
- ✅ `upgradeProxy.ts` - Multi-network configs, loads from `deployment-info.json`
- ✅ `verify.ts` - Multi-network explorer configs
- ✅ `flattenForVerification.ts` - Multi-network verifier URLs

### API Scripts (12 scripts updated)
- ✅ `config.js` - **UPDATED** - Now reads from `HYPERLIQUID_NETWORK` env var (defaults to testnet)
- ✅ `getAccountState.js` - Uses config
- ✅ `getVaultData.js` - Uses config, fetches both perp and spot balances
- ✅ `getOpenOrders.js` - Uses config
- ✅ `getUserFills.js` - Uses config
- ✅ `getFundingHistory.js` - Uses config
- ✅ `getMarketData.js` - Uses config
- ✅ `getLinkedAssets.js` - Uses config, displays EVM contract addresses correctly
- ✅ `getAllData.js` - Uses config
- ✅ `findSpotPair.js` - Uses config
- ✅ `listSpotPairs.js` - Uses config
- ✅ `exportLinkedAssets.js` - Exports both networks

### Documentation
- ✅ `README.md` - Updated with latest script structure and network support
- ✅ `api-scripts/README.md` - Complete network configuration documentation
- ✅ `data/README.md` - Asset data structure documentation
- ✅ `ORGANIZATION_SUMMARY.md` - This file

---

## 🚀 Usage Examples

### Hardhat Scripts

```bash
# Testing on testnet
npx hardhat run scripts/testing/swapHypeToUsdc.ts --network hyperEvmTestnet
npx hardhat run scripts/testing/deposit.ts --network hyperEvmTestnet
npx hardhat run scripts/testing/addApiWallet.ts --network hyperEvmTestnet

# Testing on mainnet
npx hardhat run scripts/testing/swapHypeToUsdc.ts --network hyperEvmMainnet
npx hardhat run scripts/testing/checkBalance.ts --network hyperEvmMainnet

# Deployment
npx hardhat run scripts/deployment/deployProxy.ts --network hyperEvmTestnet
npx hardhat run scripts/deployment/upgradeProxy.ts --network hyperEvmTestnet
npx hardhat run scripts/deployment/verify.ts --network hyperEvmTestnet
```

### API Scripts

```bash
# Testnet (default)
node api-scripts/getVaultData.js

# Mainnet
HYPERLIQUID_NETWORK=mainnet node api-scripts/getVaultData.js

# Set for session
export HYPERLIQUID_NETWORK=mainnet
node api-scripts/getVaultData.js
node api-scripts/getAccountState.js
node api-scripts/getLinkedAssets.js

# Export all assets
node api-scripts/exportLinkedAssets.js
```

---

## 📊 Benefits

### Organization
- ✅ Clear separation between testing and deployment scripts
- ✅ Easy to find the right script for the task
- ✅ Better maintainability
- ✅ Consistent naming conventions

### Multi-Network Support
- ✅ Seamless switching between testnet and mainnet
- ✅ Automatic network detection via Hardhat network name
- ✅ Environment variable support for API scripts
- ✅ Correct addresses, token IDs, and asset IDs per network
- ✅ Network info displayed in all outputs
- ✅ Deployment info saved to `deployment-info.json` for easy reference

### Consistency
- ✅ All Hardhat scripts use `hre.network.name`
- ✅ All API scripts use centralized `config.js`
- ✅ Unified network detection pattern
- ✅ Consistent console output format
- ✅ Scripts load vault address from `deployment-info.json` or env var

---

## 🔧 Technical Details

### Hardhat Scripts Pattern

```typescript
import { ethers } from "hardhat";
import hre from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

// Detect network
const networkName = hre.network.name;
const isMainnet = networkName === "hyperEvmMainnet";

// Network-specific configs
const NETWORK_CONFIGS = {
  testnet: { /* ... */ },
  mainnet: { /* ... */ },
};

const config = isMainnet ? NETWORK_CONFIGS.mainnet : NETWORK_CONFIGS.testnet;

// Load vault address
let VAULT_ADDRESS = process.env.VAULT_ADDRESS;
if (!VAULT_ADDRESS && fs.existsSync('deployment-info.json')) {
  const deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
  VAULT_ADDRESS = deploymentInfo.proxy;
}
```

### API Scripts Pattern

```javascript
const dotenv = require('dotenv');
dotenv.config();

const { API_URL, NETWORK_NAME, displayNetworkInfo } = require('./config');

// Network is automatically selected from:
// 1. HYPERLIQUID_NETWORK environment variable
// 2. Defaults to 'testnet'

displayNetworkInfo(); // Shows current network

const response = await fetch(API_URL, { /* ... */ });
```

### Contract Initialization

The `HyperCoreVault` contract now initializes with:
```solidity
function initialize(
    address usdcAddress,  // USDC/USDT address
    address owner,         // Contract owner
    uint64 usdcId,        // Token ID (0 for testnet USDC, 268 for mainnet USDT)
    uint64 hypeId         // HYPE token ID (1105 for testnet, 150 for mainnet)
) public initializer
```

---

## 📝 Migration Notes

### For Developers

1. **Scripts location changed:**
   - Old: `scripts/deposit.ts`
   - New: `scripts/testing/deposit.ts`
   - Old: `scripts/deployProxy.ts`
   - New: `scripts/deployment/deployProxy.ts`

2. **API scripts now use environment variables:**
   - Set `HYPERLIQUID_NETWORK=testnet` or `HYPERLIQUID_NETWORK=mainnet`
   - Defaults to `testnet` if not set
   - Import `config.js` for network-aware behavior

3. **All scripts are network-aware:**
   - Automatically use correct addresses and IDs
   - Display network information in output
   - Load vault address from `deployment-info.json` if available

4. **Deployment info:**
   - `deployProxy.ts` saves deployment info to `deployment-info.json`
   - Other scripts can load vault address from this file
   - Format includes network, addresses, and token configs

---

## ✅ Checklist

- [x] Organized scripts into `testing/` and `deployment/` folders
- [x] Added multi-network support to all Hardhat scripts
- [x] Created centralized `config.js` for API scripts
- [x] Updated `config.js` to read from `HYPERLIQUID_NETWORK` env var
- [x] Updated all API scripts to use config
- [x] Updated all deployment scripts for multi-network support
- [x] Added `addApiWallet.ts` script
- [x] Updated `withdraw.ts` for multi-network support
- [x] Updated all documentation with latest structure
- [x] Tested directory structure
- [x] All linter errors fixed
- [x] Created comprehensive organization summary

---

## 🎯 Result

The HyperLiquid Vault project is now:
- **Well-organized** with clear script categories (testing vs deployment)
- **Multi-network ready** for both testnet and mainnet
- **Maintainable** with centralized configurations
- **Documented** with updated READMEs and examples
- **Production-ready** for mainnet deployment
- **Consistent** with unified patterns across all scripts

All scripts automatically adapt to the selected network with correct addresses, token IDs, asset IDs, and explorer links! 🚀

---

## 📚 Related Documentation

- [`README.md`](./README.md) - Main project documentation
- [`api-scripts/README.md`](./api-scripts/README.md) - API scripts documentation
- [`data/README.md`](./data/README.md) - Asset data documentation
- [`contracts/HyperCoreVault.sol`](./contracts/HyperCoreVault.sol) - Smart contract source

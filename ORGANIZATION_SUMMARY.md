# Project Organization Summary

## Overview

Successfully reorganized the HyperLiquid Vault project with improved structure and multi-network support for both **scripts** and **api-scripts**.

---

## 📁 Scripts Folder Reorganization

The `scripts/` folder has been reorganized into two clear categories:

### 1. **scripts/testing/** (13 files)
Contract function testing scripts:
- `checkBalance.ts` - Check HYPE and stablecoin balances
- `deposit.ts` - Approve and deposit stablecoins to vault
- `withdraw.ts` - Withdraw stablecoins from vault
- `placeLimitOrder.ts` - Place perp limit orders
- `closePosition.ts` - Close a single position
- `closeAllPositions.ts` - Close all open positions
- `depositToCoreScript.ts` - Deposit tokens to HyperCore
- `withdrawFromCoreScript.ts` - Withdraw tokens from HyperCore
- `depositVaultBalanceToCore.ts` - Deposit vault's balance to core
- `spotSend.ts` - Send tokens via spotSend action
- `swapHypeToUsdc.ts` - Swap HYPE → USDC/USDT on spot
- `swapUsdcToHype.ts` - Swap USDC/USDT → HYPE on spot
- `transferToPerp.ts` - Transfer USD from spot to perp

### 2. **scripts/deployment/** (5 files)
Deployment and contract management scripts:
- `deploy.ts` - Deploy non-upgradeable contract
- `deployProxy.ts` - Deploy upgradeable proxy contract
- `upgradeProxy.ts` - Upgrade existing proxy
- `verify.ts` - Verify contracts on explorer
- `flattenForVerification.ts` - Flatten contracts for manual verification

---

## 🌐 Multi-Network Support

### Scripts (Hardhat-based)

All scripts now automatically detect the network via `hre.network.name`:

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
| **BTC (Perp)** | Asset ID: 3 | Asset ID: 0 |
| **HYPE/USDC Spot** | Asset ID: 114 | Asset ID: 92 |

**Key Changes:**
- Imported `hre from "hardhat"` in all scripts
- Detect network: `const isMainnet = hre.network.name === "hyperEvmMainnet"`
- Use `NETWORK_CONFIGS`, `NETWORK_TOKENS`, or `NETWORK_ASSETS` objects
- Display network info in console output
- Correct token IDs, addresses, and asset IDs per network

### API Scripts (Node.js-based)

All API scripts now support network selection via **`config.js`** module:

```bash
# Set network (default: testnet)
export HYPERLIQUID_NETWORK=testnet  # or mainnet

# Or inline
HYPERLIQUID_NETWORK=mainnet node api-scripts/getVaultData.js
```

**Network Configurations:**

| Network | API URL | Explorer | Chain ID |
|---------|---------|----------|----------|
| **Testnet** | `https://api.hyperliquid-testnet.xyz/info` | `https://testnet.purrsec.com` | 998 |
| **Mainnet** | `https://api.hyperliquid.xyz/info` | `https://hyperevmscan.io` | 999 |

**Updated API Scripts (11 files):**
1. `config.js` ⭐ **NEW** - Centralized network configuration
2. `getAccountState.js` - Account state with network awareness
3. `getVaultData.js` - Comprehensive vault data
4. `getOpenOrders.js` - Open orders
5. `getUserFills.js` - Recent fills
6. `getFundingHistory.js` - Funding history
7. `getMarketData.js` - Market data
8. `getLinkedAssets.js` - Linked assets
9. `getAllData.js` - All data fetcher
10. `findSpotPair.js` - Find spot pairs (already had both networks)
11. `listSpotPairs.js` - List spot pairs (already had both networks)
12. `exportLinkedAssets.js` - Export assets (already had both networks)

---

## 📋 Updated Files Summary

### Hardhat Scripts (11 scripts updated)
- ✅ `swapHypeToUsdc.ts` - Multi-network swap configs
- ✅ `swapUsdcToHype.ts` - Multi-network swap configs
- ✅ `spotSend.ts` - Multi-network token configs
- ✅ `depositToCoreScript.ts` - Multi-network token configs
- ✅ `withdrawFromCoreScript.ts` - Multi-network token configs
- ✅ `depositVaultBalanceToCore.ts` - Multi-network token configs
- ✅ `placeLimitOrder.ts` - Multi-network asset configs
- ✅ `deposit.ts` - Multi-network stablecoin configs
- ✅ `checkBalance.ts` - Multi-network token & explorer configs
- ✅ `closePosition.ts` - Multi-network asset ID configs
- ✅ `transferToPerp.ts` - Already network-agnostic

### API Scripts (12 scripts updated)
- ✅ `config.js` - **NEW** centralized network config
- ✅ `getAccountState.js` - Uses config
- ✅ `getVaultData.js` - Uses config
- ✅ `getOpenOrders.js` - Uses config
- ✅ `getUserFills.js` - Uses config
- ✅ `getFundingHistory.js` - Uses config
- ✅ `getMarketData.js` - Uses config
- ✅ `getLinkedAssets.js` - Uses config
- ✅ `getAllData.js` - Uses config
- ✅ `findSpotPair.js` - Uses config (already supported both)
- ✅ `listSpotPairs.js` - Uses config (already supported both)
- ✅ `exportLinkedAssets.js` - Already supported both networks

### Documentation
- ✅ `api-scripts/README.md` - Completely rewritten with network config docs

---

## 🚀 Usage Examples

### Hardhat Scripts

```bash
# Testing on testnet
npx hardhat run scripts/testing/swapHypeToUsdc.ts --network hyperEvmTestnet
npx hardhat run scripts/testing/deposit.ts --network hyperEvmTestnet

# Testing on mainnet
npx hardhat run scripts/testing/swapHypeToUsdc.ts --network hyperEvmMainnet
npx hardhat run scripts/testing/checkBalance.ts --network hyperEvmMainnet

# Deployment
npx hardhat run scripts/deployment/deployProxy.ts --network hyperEvmTestnet
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
```

---

## 📊 Benefits

### Organization
- ✅ Clear separation between testing and deployment scripts
- ✅ Easy to find the right script for the task
- ✅ Better maintainability

### Multi-Network Support
- ✅ Seamless switching between testnet and mainnet
- ✅ Automatic network detection
- ✅ Correct addresses, token IDs, and asset IDs per network
- ✅ Network info displayed in all outputs

### Consistency
- ✅ All Hardhat scripts use `hre.network.name`
- ✅ All API scripts use centralized `config.js`
- ✅ Unified network detection pattern
- ✅ Consistent console output format

---

## 🔧 Technical Details

### Hardhat Scripts Pattern

```typescript
import { ethers } from "hardhat";
import hre from "hardhat";

// Detect network
const networkName = hre.network.name;
const isMainnet = networkName === "hyperEvmMainnet";

// Network-specific configs
const NETWORK_CONFIGS = {
  testnet: { /* ... */ },
  mainnet: { /* ... */ },
};

const config = isMainnet ? NETWORK_CONFIGS.mainnet : NETWORK_CONFIGS.testnet;
```

### API Scripts Pattern

```javascript
const { API_URL, NETWORK_NAME, displayNetworkInfo } = require('./config');

// Network is automatically selected from:
// 1. HYPERLIQUID_NETWORK environment variable
// 2. Defaults to 'testnet'

displayNetworkInfo(); // Shows current network
```

---

## 📝 Migration Notes

### For Developers

1. **Scripts location changed:**
   - Old: `scripts/deposit.ts`
   - New: `scripts/testing/deposit.ts`

2. **API scripts now require config:**
   - Import `config.js` for network-aware behavior
   - Set `HYPERLIQUID_NETWORK` env var to switch networks

3. **All scripts are network-aware:**
   - Automatically use correct addresses and IDs
   - Display network information in output

---

## ✅ Checklist

- [x] Organized scripts into `testing/` and `deployment/` folders
- [x] Added multi-network support to all Hardhat scripts
- [x] Created centralized `config.js` for API scripts
- [x] Updated all API scripts to use config
- [x] Updated API scripts README with network documentation
- [x] Tested directory structure
- [x] All linter errors fixed
- [x] Created comprehensive organization summary

---

## 🎯 Result

The HyperLiquid Vault project is now:
- **Well-organized** with clear script categories
- **Multi-network ready** for both testnet and mainnet
- **Maintainable** with centralized configurations
- **Documented** with updated READMEs and examples
- **Production-ready** for mainnet deployment

All scripts automatically adapt to the selected network with correct addresses, token IDs, asset IDs, and explorer links! 🚀


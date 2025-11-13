# HyperCoreVault

A modular smart contract vault on HyperEVM for interacting with HyperCore via CoreWriter. Supports both **testnet** and **mainnet** deployments.

## 🎯 Project Overview

HyperCoreVault is a sophisticated smart contract vault that allows users to:
- Deposit and withdraw stablecoins (USDC on testnet, USDT on mainnet)
- Execute trading operations on Hyperliquid perpetuals and spot markets
- Manage staking and delegation
- Interact with the HyperCore protocol
- Transfer funds between spot and perpetual accounts
- Add API wallets for automated trading

## 📦 Quick Start

### Install Dependencies
```bash
pnpm install
```

### Compile Contracts
```bash
npx hardhat compile
```

### Check Your Balance
```bash
# Testnet
npx hardhat run scripts/testing/checkBalance.ts --network hyperEvmTestnet

# Mainnet
npx hardhat run scripts/testing/checkBalance.ts --network hyperEvmMainnet
```

## 🚀 Deployed Contracts

### Testnet
- **Proxy Address:** `0xB6b9Db33FCdDC4c2FCCfc049D72aF5D0766A26e6`
- **Implementation:** `0xFCdBb2373f844a3C87473BF3F888cf2BBdB195c6` (✅ Verified)
- **Network:** HyperEVM Testnet (Chain ID: 998)
- **Explorer:** https://testnet.purrsec.com/address/0xB6b9Db33FCdDC4c2FCCfc049D72aF5D0766A26e6

### Mainnet
- Deploy using `scripts/deployment/deployProxy.ts` when ready

## 📝 Available Scripts

Scripts are organized into two categories:

### 🧪 Testing Scripts (`scripts/testing/`)

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

### 🚀 Deployment Scripts (`scripts/deployment/`)

- `deploy.ts` - Deploy non-upgradeable contract
- `deployProxy.ts` - Deploy upgradeable proxy contract (RECOMMENDED)
- `upgradeProxy.ts` - Upgrade existing proxy to new implementation
- `verify.ts` - Verify contracts on block explorer
- `flattenForVerification.ts` - Flatten contracts for manual verification

## 🌐 Network Support

All scripts automatically detect the network and use the correct configurations:

### Testnet (hyperEvmTestnet)
- **RPC URL:** https://rpc.hyperliquid-testnet.xyz/evm
- **Chain ID:** 998
- **Currency:** HYPE
- **Explorer:** https://testnet.purrsec.com
- **Stablecoin:** USDC (Token ID: 0)
- **HYPE Token ID:** 1105
- **BTC Perp Asset ID:** 3
- **HYPE/USDC Spot Asset ID:** 114

### Mainnet (hyperEvmMainnet)
- **RPC URL:** https://rpc.hyperliquid.xyz/evm
- **Chain ID:** 999
- **Currency:** HYPE
- **Explorer:** https://hyperevmscan.io
- **Stablecoin:** USDT (Token ID: 268)
- **HYPE Token ID:** 150
- **BTC Perp Asset ID:** 0
- **HYPE/USDT Spot Asset ID:** 92

## 📋 Usage Examples

### Testing Scripts

```bash
# Check balances on testnet
npx hardhat run scripts/testing/checkBalance.ts --network hyperEvmTestnet

# Deposit USDC on testnet
npx hardhat run scripts/testing/deposit.ts --network hyperEvmTestnet

# Deposit USDT on mainnet
npx hardhat run scripts/testing/deposit.ts --network hyperEvmMainnet

# Place a limit order
npx hardhat run scripts/testing/placeLimitOrder.ts --network hyperEvmTestnet

# Swap HYPE to USDC
npx hardhat run scripts/testing/swapHypeToUsdc.ts --network hyperEvmTestnet

# Add API wallet
npx hardhat run scripts/testing/addApiWallet.ts --network hyperEvmTestnet
```

### Deployment Scripts

```bash
# Deploy proxy on testnet
npx hardhat run scripts/deployment/deployProxy.ts --network hyperEvmTestnet

# Deploy proxy on mainnet
npx hardhat run scripts/deployment/deployProxy.ts --network hyperEvmMainnet

# Upgrade proxy
npx hardhat run scripts/deployment/upgradeProxy.ts --network hyperEvmTestnet

# Verify contracts
npx hardhat run scripts/deployment/verify.ts --network hyperEvmTestnet
```

## 🔧 Configuration

Create a `.env` file in the root directory:

```env
# Private keys
PRIVATE_KEY=your_testnet_private_key_here
MAINNET_PRIVATE_KEY=your_mainnet_private_key_here

# Vault addresses (optional - scripts can load from deployment-info.json)
VAULT_ADDRESS=0xB6b9Db33FCdDC4c2FCCfc049D72aF5D0766A26e6
PROXY_ADDRESS=0xB6b9Db33FCdDC4c2FCCfc049D72aF5D0766A26e6

# Etherscan API key (for verification)
ETHERSCAN_API_KEY=your_api_key_here
```

## 📚 API Scripts

Standalone Node.js scripts for fetching Hyperliquid data (no Hardhat required):

```bash
# Set network (defaults to testnet)
export HYPERLIQUID_NETWORK=testnet  # or mainnet

# Get comprehensive vault data
node api-scripts/getVaultData.js

# Get account state
node api-scripts/getAccountState.js

# Get open orders
node api-scripts/getOpenOrders.js

# Export all linked assets
node api-scripts/exportLinkedAssets.js
```

See [`api-scripts/README.md`](./api-scripts/README.md) for complete API scripts documentation.

## ✨ Features

### User Functions
- ✅ Deposit stablecoins (USDC/USDT) to vault
- ✅ Withdraw stablecoins from vault
- ✅ Track deposits and withdrawals

### Owner Functions (Trading)
- ✅ Withdraw stablecoins
- ✅ Place limit orders on perpetuals
- ✅ Cancel orders
- ✅ Close positions
- ✅ Swap HYPE ↔ USDC/USDT on spot
- ✅ Manage vault transfers
- ✅ Token delegation for staking
- ✅ USD class transfers (perp ↔ spot)
- ✅ API wallet management
- ✅ Builder fee approvals
- ✅ Deposit/withdraw tokens to/from HyperCore

## 🔐 Security

- Uses OpenZeppelin upgradeable contracts
- Owner-only access for trading functions
- SafeERC20 for secure token transfers
- Proper input validation and error handling
- Network-aware configurations prevent cross-network errors

## 🛠️ Development

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Check for linting errors
npx hardhat check

# Clean build artifacts
npx hardhat clean
```

## 📁 Project Structure

```
hyperliquidvault/
├── contracts/              # Smart contracts
│   └── HyperCoreVault.sol  # Main vault contract
├── scripts/
│   ├── testing/           # Contract function testing scripts
│   └── deployment/        # Deployment and upgrade scripts
├── api-scripts/           # Standalone API scripts (no Hardhat)
│   ├── config.js         # Network configuration
│   └── *.js              # Various API data fetchers
├── data/                  # Exported asset data
│   └── assets/           # Token metadata JSON files
├── test/                  # Hardhat tests
└── hardhat.config.ts      # Hardhat configuration
```

## 📞 Need Help?

1. Check [`api-scripts/README.md`](./api-scripts/README.md) for API scripts usage
2. Check [`data/README.md`](./data/README.md) for asset data structure
3. Review [`ORGANIZATION_SUMMARY.md`](./ORGANIZATION_SUMMARY.md) for project organization
4. Visit [Hyperliquid Docs](https://hyperliquid.gitbook.io/hyperliquid-docs)

## 📄 License

MIT

# HyperCoreVault

A modular smart contract vault on HyperEVM for interacting with HyperCore via CoreWriter.

## 🎯 Project Overview

HyperCoreVault is a sophisticated smart contract vault that allows users to:
- Deposit and withdraw USDC
- Execute trading operations on Hyperliquid perpetuals and spot markets
- Manage staking and delegation
- Interact with the HyperCore protocol

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
# Use the proxy address (recommended)
VAULT_ADDRESS=0xB6b9Db33FCdDC4c2FCCfc049D72aF5D0766A26e6 npx hardhat run scripts/checkBalance.ts --network hyperEvmTestnet
```

## 🚀 Deployed Contracts (Testnet)

### Transparent Proxy (RECOMMENDED - Upgradeable) ⭐
- **Proxy Address:** `0xB6b9Db33FCdDC4c2FCCfc049D72aF5D0766A26e6`
- **Implementation:** `0xFCdBb2373f844a3C87473BF3F888cf2BBdB195c6` (✅ Verified)
- **Network:** HyperEVM Testnet (Chain ID: 998)
- **Explorer:** https://testnet.purrsec.com/address/0xB6b9Db33FCdDC4c2FCCfc049D72aF5D0766A26e6
- **Verified Source:** https://testnet.purrsec.com/contracts/full_match/998/0xFCdBb2373f844a3C87473BF3F888cf2BBdB195c6/

### Original Deployment (Non-Upgradeable)
- **Contract Address:** `0xe4944793ac38c0528243507244C451f174F81894` (✅ Verified)
- **Explorer:** https://testnet.purrsec.com/address/0xe4944793ac38c0528243507244C451f174F81894
- **Verified Source:** https://testnet.purrsec.com/contracts/full_match/998/0xe4944793ac38c0528243507244C451f174F81894/

## 📝 Available Scripts

### Deploy Contract
```bash
# Deploy as upgradeable proxy (RECOMMENDED)
npx hardhat run scripts/deployProxy.ts --network hyperEvmTestnet

# Deploy original (non-upgradeable)
npx hardhat run scripts/deploy.ts --network hyperEvmTestnet
```

### Verify Contracts
```bash
# Automated verification
npx hardhat run scripts/verify.ts --network hyperEvmTestnet

# Prepare for manual verification
npx hardhat run scripts/flattenForVerification.ts
```

### Check Balances
```bash
# For proxy deployment (use this)
VAULT_ADDRESS=0xB6b9Db33FCdDC4c2FCCfc049D72aF5D0766A26e6 npx hardhat run scripts/checkBalance.ts --network hyperEvmTestnet

# For original deployment
VAULT_ADDRESS=0xe4944793ac38c0528243507244C451f174F81894 npx hardhat run scripts/checkBalance.ts --network hyperEvmTestnet
```

### Deposit USDC
```bash
# For proxy deployment (use this)
VAULT_ADDRESS=0xB6b9Db33FCdDC4c2FCCfc049D72aF5D0766A26e6 npx hardhat run scripts/deposit.ts --network hyperEvmTestnet

# For original deployment
VAULT_ADDRESS=0xe4944793ac38c0528243507244C451f174F81894 npx hardhat run scripts/deposit.ts --network hyperEvmTestnet
```

## 🌐 Networks

### HyperEVM Testnet
- **RPC URL:** https://rpc.hyperliquid-testnet.xyz/evm
- **Chain ID:** 998
- **Currency:** HYPE
- **Explorer:** https://testnet.purrsec.com

### HyperEVM Mainnet
- **RPC URL:** https://rpc.hyperliquid.xyz/evm
- **Chain ID:** 999
- **Currency:** HYPE
- **Explorer:** https://hyperevmscan.io

## 🔧 Configuration

Create a `.env` file in the root directory:

```env
PRIVATE_KEY=your_private_key_here
# Use proxy address (recommended)
VAULT_ADDRESS=0xB6b9Db33FCdDC4c2FCCfc049D72aF5D0766A26e6
```

## 📚 Documentation

- **[PROXY_DEPLOYMENT_SUMMARY.md](./PROXY_DEPLOYMENT_SUMMARY.md)** - ⭐ Proxy deployment details & verification
- **[SETUP.md](./SETUP.md)** - Complete setup instructions and current status
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Original deployment guide and contract functions
- **[VERIFICATION_INSTRUCTIONS.md](./VERIFICATION_INSTRUCTIONS.md)** - Manual verification guide
- **[HyperCoreVault.sol](./contracts/HyperCoreVault.sol)** - Smart contract source code

## ✨ Features

### User Functions
- ✅ Deposit USDC to vault
- ✅ Track deposits and withdrawals

### Owner Functions (Trading)
- Withdraw USDC
- Place limit orders on perpetuals
- Cancel orders
- Manage vault transfers
- Token delegation for staking
- USD class transfers (perp ↔ spot)
- API wallet management
- Builder fee approvals

## 🔐 Security

- Uses OpenZeppelin upgradeable contracts
- Owner-only access for trading functions
- SafeERC20 for secure token transfers
- Proper input validation and error handling

## ⚠️ Important Notes

- Currently deployed on **TESTNET** only
- Your account needs USDC to test deposits
- Always verify transactions before signing
- Test thoroughly before mainnet deployment

## 🛠️ Development

```bash
# Compile contracts
npx hardhat compile

# Run tests (if available)
npx hardhat test

# Check for linting errors
npx hardhat check
```

## 📞 Need Help?

1. Check the [SETUP.md](./SETUP.md) for detailed instructions
2. Review [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment details
3. Visit [Hyperliquid Docs](https://hyperliquid.gitbook.io/hyperliquid-docs)

## 📄 License

MIT

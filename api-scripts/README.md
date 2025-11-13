# Hyperliquid API Scripts

Standalone Node.js scripts to fetch data from Hyperliquid. These scripts support both **testnet** and **mainnet** and don't require Hardhat.

## 🌐 Network Configuration

All scripts now support both **testnet** and **mainnet** via the centralized `config.js` module.

### Setting the Network

**Option 1: Environment Variable (Recommended)**
```bash
# Use testnet (default)
export HYPERLIQUID_NETWORK=testnet

# Use mainnet
export HYPERLIQUID_NETWORK=mainnet
```

**Option 2: Inline with Command**
```bash
# Run on testnet
HYPERLIQUID_NETWORK=testnet node api-scripts/getVaultData.js

# Run on mainnet
HYPERLIQUID_NETWORK=mainnet node api-scripts/getVaultData.js
```

### Network Details

| Network | API Endpoint | Explorer | Chain ID | RPC URL |
|---------|-------------|----------|----------|---------|
| **Testnet** | `https://api.hyperliquid-testnet.xyz/info` | `https://testnet.purrsec.com` | 998 | `https://rpc.hyperliquid-testnet.xyz/evm` |
| **Mainnet** | `https://api.hyperliquid.xyz/info` | `https://hyperevmscan.io` | 999 | `https://rpc.hyperliquid.xyz/evm` |

---

## 📋 Available Scripts

All scripts automatically detect and display the current network.

### ⭐ `getVaultData.js` (Recommended)
**Comprehensive vault data fetcher** - Gets everything in one beautifully formatted report:
- Account summary (value, margin, withdrawable)
- All perpetual positions with PnL
- Spot balances
- Open orders
- Recent fills (last 5)
- Recent funding payments (last 5)
- Vault statistics and leverage

**Usage:**
```bash
# Testnet
node api-scripts/getVaultData.js

# Mainnet
HYPERLIQUID_NETWORK=mainnet node api-scripts/getVaultData.js

# With custom address
node api-scripts/getVaultData.js 0xYourAddress
```

---

### 1. `getAccountState.js`
Fetches comprehensive account information:
- Account value and margin
- Open positions
- Cross margin summary
- Withdrawable balance

**Usage:**
```bash
node api-scripts/getAccountState.js
VAULT_ADDRESS=0xYourAddress node api-scripts/getAccountState.js
```

### 2. `getOpenOrders.js`
Fetches all open orders with details:
- Asset and side
- Price and size
- Order IDs
- Timestamps

**Usage:**
```bash
node api-scripts/getOpenOrders.js
```

### 3. `getUserFills.js`
Fetches recent trade fills:
- Executed trades
- Prices and sizes
- Fees paid
- Trade IDs

**Usage:**
```bash
node api-scripts/getUserFills.js
```

### 4. `getFundingHistory.js`
Fetches funding rate payments:
- Funding rates paid/received
- Assets and amounts
- Historical payments

**Usage:**
```bash
node api-scripts/getFundingHistory.js
```

### 5. `getMarketData.js`
Fetches market information:
- Current prices for all assets
- Available trading pairs
- Asset metadata

**Usage:**
```bash
node api-scripts/getMarketData.js
```

### 6. `getLinkedAssets.js`
Fetch all Hip-1 and EVM-linked assets:
- Hip-1 token IDs
- EVM contract addresses  
- System addresses for deposits/withdrawals
- Token decimals and metadata
- Canonical (Genesis) token status

**Usage:**
```bash
# Testnet assets
node api-scripts/getLinkedAssets.js

# Mainnet assets
HYPERLIQUID_NETWORK=mainnet node api-scripts/getLinkedAssets.js
```

**Features:**
- Shows all tokens with EVM contracts (testnet: 1,470+, mainnet: 396+)
- Displays system address for each token (for HyperCore transfers)
- Separates native tokens (HYPE), EVM-linked, and Hip-1 only tokens
- Includes system address calculation reference

### 7. `exportLinkedAssets.js` ⭐
Export all assets to JSON files:
- Fetches from both testnet and mainnet
- Exports to `../data/assets/` folder
- Creates 7 different JSON files for various use cases
- Includes simple arrays, categorized data, and quick lookup mappings

**Usage:**
```bash
node api-scripts/exportLinkedAssets.js
```

**Generated Files:**
- `testnet-assets.json` - Full testnet data (1,470 tokens)
- `testnet-assets-simple.json` - Token array only
- `testnet-token-mapping.json` - Quick ID→address lookup
- `mainnet-assets.json` - Full mainnet data (396 tokens)
- `mainnet-assets-simple.json` - Token array only
- `mainnet-token-mapping.json` - Quick ID→address lookup
- `all-networks-assets.json` - Combined networks

### 8. `findSpotPair.js`
Find a specific spot trading pair by token symbols:
- Searches on both testnet and mainnet
- Returns the spot asset ID for the pair

**Usage:**
```bash
# Find HYPE/USDC pair
node api-scripts/findSpotPair.js HYPE USDC

# Find any pair
node api-scripts/findSpotPair.js BTC USDC
```

### 9. `listSpotPairs.js`
List all available spot trading pairs:
- Shows all pairs on testnet and mainnet
- Displays asset IDs
- Highlights HYPE pairs

**Usage:**
```bash
node api-scripts/listSpotPairs.js
```

### 10. `getAllData.js`
Fetches everything in one go:
- Runs all the above scripts sequentially
- Provides comprehensive summary

**Usage:**
```bash
node api-scripts/getAllData.js
```

**Note:** For a single, well-formatted comprehensive report, use `getVaultData.js` instead.

---

## 🔧 Configuration

### Vault Address

Set your vault address as an environment variable:
```bash
export VAULT_ADDRESS=0xB6b9Db33FCdDC4c2FCCfc049D72aF5D0766A26e6
```

Or pass it inline:
```bash
VAULT_ADDRESS=0xYourAddress node api-scripts/getAccountState.js
```

### Network Selection

Set the network using the `HYPERLIQUID_NETWORK` environment variable:
```bash
export HYPERLIQUID_NETWORK=mainnet
```

Or in your `.env` file:
```
VAULT_ADDRESS=0xYourAddress
HYPERLIQUID_NETWORK=mainnet
```

---

## 📊 Usage Examples

### Switch Between Networks

```bash
# Default is testnet
node api-scripts/getVaultData.js

# Use mainnet
HYPERLIQUID_NETWORK=mainnet node api-scripts/getVaultData.js

# Set permanently for session
export HYPERLIQUID_NETWORK=mainnet
node api-scripts/getVaultData.js
node api-scripts/getAccountState.js
node api-scripts/getLinkedAssets.js
```

### Common Workflows

```bash
# Check vault data on testnet
node api-scripts/getVaultData.js

# Check vault data on mainnet
HYPERLIQUID_NETWORK=mainnet node api-scripts/getVaultData.js

# Export all asset data
node api-scripts/exportLinkedAssets.js

# Find a trading pair
node api-scripts/findSpotPair.js HYPE USDC

# Get comprehensive data
node api-scripts/getAllData.js
```

---

## 📚 API Information

### Available API Types

The Hyperliquid API supports these request types:

| Type | Description |
|------|-------------|
| `clearinghouseState` | Complete account state |
| `spotClearinghouseState` | Spot balances |
| `openOrders` | Open orders list |
| `userFills` | Recent trade fills |
| `userFunding` | Funding payments |
| `allMids` | Current market prices |
| `meta` | Asset metadata |
| `spotMeta` | Spot token metadata |
| `spotMetaAndAssetCtxs` | Spot pairs with context |

### Response Examples

**Account State:**
```json
{
  "marginSummary": {
    "accountValue": "30.0",
    "totalNtlPos": "0.0",
    "totalMarginUsed": "0.0"
  },
  "assetPositions": [],
  "withdrawable": "30.0"
}
```

**Spot Balances:**
```json
{
  "balances": [
    {
      "coin": "USDC",
      "hold": "0",
      "total": "30.0"
    }
  ]
}
```

---

## ⚙️ Requirements

- Node.js 18+ (for native fetch API)
- No additional dependencies required
- `.env` file with `VAULT_ADDRESS` (optional)

---

## 📝 Notes

- All scripts output formatted, human-readable data
- Network information is automatically displayed in output
- Can be imported as modules in other scripts
- Error handling included for all API calls
- Timestamps are converted to ISO format
- Scripts work offline with exported JSON data

---

## 🚀 Quick Start

1. Set your vault address:
```bash
export VAULT_ADDRESS=0xYourVaultAddress
```

2. Choose your network (optional, defaults to testnet):
```bash
export HYPERLIQUID_NETWORK=testnet  # or mainnet
```

3. Run any script:
```bash
node api-scripts/getVaultData.js
```

4. Switch to mainnet:
```bash
HYPERLIQUID_NETWORK=mainnet node api-scripts/getVaultData.js
```

---

## 🔗 Related

- Smart contract scripts: `../scripts/testing/`
- Deployment scripts: `../scripts/deployment/`
- Exported asset data: `../data/assets/`

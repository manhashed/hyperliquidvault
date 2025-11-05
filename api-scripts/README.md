# Hyperliquid API Scripts

Standalone Node.js scripts to fetch data from Hyperliquid testnet. These scripts don't require Hardhat and can be run directly.

## Available Scripts

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
node api-scripts/getVaultData.js
# or with custom address
node api-scripts/getVaultData.js 0xYourAddress
# or with environment variable
VAULT_ADDRESS=0xYourAddress node api-scripts/getVaultData.js
```

**Output Example:**
```
═══════════════════════════════════════════════════════════════
           HYPERLIQUID VAULT COMPREHENSIVE DATA
═══════════════════════════════════════════════════════════════
Vault Address: 0xB6b9Db33FCdDC4c2FCCfc049D72aF5D0766A26e6

📊 ACCOUNT SUMMARY
Account Value:        $30.00
Withdrawable:         $30.00

📈 PERPETUAL POSITIONS
No open perp positions

💰 SPOT BALANCES
Withdrawable USD:     $30.000000
```

---

### 1. `getAccountState.js`
Fetches comprehensive account information including:
- Account value and margin
- Open positions
- Cross margin summary
- Withdrawable balance

**Usage:**
```bash
node api-scripts/getAccountState.js
# or with custom address
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
**Fetch all Hip-1 and EVM-linked assets:**
- Hip-1 token IDs
- EVM contract addresses  
- System addresses for deposits/withdrawals
- Token decimals and metadata
- Canonical (Genesis) token status

**Usage:**
```bash
node api-scripts/getLinkedAssets.js
```

**Features:**
- Shows all tokens with EVM contracts (121+ tokens)
- Displays system address for each token (for HyperCore transfers)
- Separates native tokens (HYPE), EVM-linked, and Hip-1 only tokens
- Includes system address calculation reference

### 7. `exportLinkedAssets.js` ⭐
**Export all assets to JSON files:**
- Fetches from both testnet and mainnet
- Exports to `data/assets/` folder
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

**Perfect for:**
- Building applications with token data
- Offline token lookups
- Testing and development
- Analytics and research

### 8. `getAllData.js`
Fetches everything in one go:
- Runs all the above scripts sequentially
- Provides comprehensive summary

**Usage:**
```bash
node api-scripts/getAllData.js
```

**Note:** For a single, well-formatted comprehensive report, use `getVaultData.js` instead.

## Configuration

Set your vault address as an environment variable:
```bash
export VAULT_ADDRESS=0xB6b9Db33FCdDC4c2FCCfc049D72aF5D0766A26e6
```

Or pass it inline:
```bash
VAULT_ADDRESS=0xYourAddress node api-scripts/getAccountState.js
```

## API Endpoint

All scripts use the Hyperliquid testnet API:
```
https://api.hyperliquid-testnet.xyz/info
```

For mainnet, change to:
```
https://api.hyperliquid.xyz/info
```

## Available API Types

The Hyperliquid API supports these request types:

| Type | Description |
|------|-------------|
| `clearinghouseState` | Complete account state |
| `openOrders` | Open orders list |
| `userFills` | Recent trade fills |
| `userFunding` | Funding payments |
| `allMids` | Current market prices |
| `meta` | Asset metadata |
| `userState` | Alternative account state format |
| `frontendOpenOrders` | Frontend-formatted orders |

## Response Examples

### Account State
```json
{
  "marginSummary": {
    "accountValue": "30.0",
    "totalNtlPos": "0.0",
    "totalMarginUsed": "0.0"
  },
  "assetPositions": [],
  "crossMarginSummary": {
    "accountValue": "30.0",
    "withdrawable": "30.0"
  }
}
```

### Open Orders
```json
[
  {
    "coin": "BTC",
    "side": "B",
    "limitPx": "107616",
    "sz": "0.001",
    "oid": 123456,
    "timestamp": 1234567890
  }
]
```

## Requirements

- Node.js 18+ (for native fetch API)
- No additional dependencies required

## Notes

- All scripts output formatted, human-readable data
- Can also be imported as modules in other scripts
- Error handling included for all API calls
- Timestamps are converted to ISO format


# Hyperliquid API Scripts

Standalone Node.js scripts to fetch data from Hyperliquid testnet. These scripts don't require Hardhat and can be run directly.

## Available Scripts

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

### 6. `getAllData.js`
Fetches everything in one go:
- Runs all the above scripts
- Provides comprehensive summary

**Usage:**
```bash
node api-scripts/getAllData.js
```

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


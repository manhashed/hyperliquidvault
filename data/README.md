# HyperLiquid Assets Data

Exported token metadata for HyperLiquid testnet and mainnet.

## 📊 Statistics

### Testnet
- **Total Tokens**: 1,470
- **Native Tokens**: 1 (HYPE)
- **EVM-Linked**: 120
- **Hip-1 Only**: 1,349

### Mainnet
- **Total Tokens**: 396
- **Native Tokens**: 1 (HYPE)
- **EVM-Linked**: 98
- **Hip-1 Only**: 297

## 📁 Available Files

### Full Data Files

#### `testnet-assets.json` (943 KB)
Complete testnet token data with categorization:
```json
{
  "network": "Testnet",
  "timestamp": "2025-11-05T...",
  "apiEndpoint": "https://api.hyperliquid-testnet.xyz/info",
  "summary": {
    "totalTokens": 1470,
    "nativeTokens": 1,
    "evmLinkedTokens": 120,
    "hipOnlyTokens": 1349
  },
  "tokens": {
    "all": [...],
    "native": [...],
    "evmLinked": [...],
    "hipOnly": [...]
  }
}
```

#### `mainnet-assets.json` (258 KB)
Complete mainnet token data with same structure as testnet.

### Simple Arrays

#### `testnet-assets-simple.json` (397 KB)
Just the token array without categorization - ready to use directly:
```json
[
  {
    "name": "USDC",
    "hipTokenId": 0,
    "evmContract": "0x2B3370eE501B4a559b57D449569354196457D8Ab",
    "systemAddress": "0x2000000000000000000000000000000000000000",
    "decimals": {
      "sz": 8,
      "wei": 8
    },
    "isCanonical": true,
    "isNative": false,
    "hasEvmLink": true
  },
  ...
]
```

#### `mainnet-assets-simple.json` (109 KB)
Mainnet token array.

### Quick Lookup Mappings

#### `testnet-token-mapping.json` (188 KB)
Token ID to addresses mapping for quick lookups:
```json
{
  "0": {
    "name": "USDC",
    "systemAddress": "0x2000000000000000000000000000000000000000",
    "evmContract": "0x2B3370eE501B4a559b57D449569354196457D8Ab"
  },
  "1": {
    "name": "PURR",
    "systemAddress": "0x2000000000000000000000000000000000000001",
    "evmContract": "0xa9056c15938f9aff34cd497c722ce33db0c2fd57"
  },
  ...
}
```

#### `mainnet-token-mapping.json` (53 KB)
Mainnet mapping.

### Combined Networks

#### `all-networks-assets.json` (648 KB)
Both networks in one file:
```json
{
  "exportDate": "2025-11-05T...",
  "networks": {
    "testnet": {
      "summary": {...},
      "tokens": [...]
    },
    "mainnet": {
      "summary": {...},
      "tokens": [...]
    }
  }
}
```

## 🔧 Token Object Structure

Each token in the arrays contains:

```typescript
{
  name: string;              // Token symbol (e.g., "USDC", "HYPE")
  hipTokenId: number;        // Hip-1 token ID (0, 1, 135, etc.)
  evmContract: string | null; // EVM contract address (null if Hip-1 only)
  systemAddress: string;     // System address for Core transfers
  decimals: {
    sz: number;              // Size decimals
    wei: number | null;      // Wei decimals
  };
  isCanonical: boolean;      // Is a genesis/canonical token
  isNative: boolean;         // Is HYPE (native token)
  hasEvmLink: boolean;       // Has EVM contract
}
```

## 💡 Usage Examples

### JavaScript/TypeScript

```javascript
// Load all testnet tokens
const testnetTokens = require('./data/assets/testnet-assets-simple.json');

// Find USDC
const usdc = testnetTokens.find(t => t.name === 'USDC');
console.log(usdc.evmContract);      // 0x2B3370eE...
console.log(usdc.systemAddress);    // 0x2000...0000

// Load mapping for quick lookups
const mapping = require('./data/assets/testnet-token-mapping.json');
console.log(mapping[0].name);       // "USDC"
console.log(mapping[0].systemAddress); // 0x2000...0000

// Get only EVM-linked tokens
const fullData = require('./data/assets/testnet-assets.json');
const evmTokens = fullData.tokens.evmLinked;
console.log(`${evmTokens.length} tokens with EVM contracts`);
```

### Python

```python
import json

# Load testnet tokens
with open('data/assets/testnet-assets-simple.json', 'r') as f:
    tokens = json.load(f)

# Find HYPE
hype = next((t for t in tokens if t['name'] == 'HYPE'), None)
print(f"HYPE System Address: {hype['systemAddress']}")

# Load mapping
with open('data/assets/testnet-token-mapping.json', 'r') as f:
    mapping = json.load(f)

usdc_address = mapping['0']['systemAddress']
print(f"USDC System Address: {usdc_address}")
```

### Solidity

```solidity
// System addresses from JSON can be used in contracts
address constant USDC_SYSTEM_ADDRESS = 0x2000000000000000000000000000000000000000;
address constant HYPE_SYSTEM_ADDRESS = 0x2222222222222222222222222222222222222222;

// Or calculate programmatically
function getSystemAddress(uint256 tokenId) public pure returns (address) {
    if (tokenId == 135) {
        return 0x2222222222222222222222222222222222222222;
    }
    return address(uint160(0x2000000000000000000000000000000000000000 | tokenId));
}
```

## 🔄 Updating Data

To refresh the token data from the APIs:

```bash
# Run the export script
node api-scripts/exportLinkedAssets.js

# This will fetch latest data from:
# - Testnet: https://api.hyperliquid-testnet.xyz/info
# - Mainnet: https://api.hyperliquid.xyz/info
```

## 📚 Use Cases

1. **Token Discovery**: Browse all available tokens on HyperLiquid
2. **Address Lookups**: Get system addresses for Core transfers
3. **Contract Integration**: Find EVM contract addresses
4. **Bridge Development**: Know which tokens can bridge between EVM and Core
5. **Analytics**: Analyze token distribution and categorization
6. **Testing**: Use testnet data for development and testing

## 🔗 Related Scripts

- `api-scripts/getLinkedAssets.js` - Interactive console viewer
- `api-scripts/exportLinkedAssets.js` - Export script (generates these files)
- `api-scripts/getVaultData.js` - Check vault balances

## 📅 Data Freshness

Files include `timestamp` field showing when data was exported. Re-run the export script periodically to get latest tokens.

## ⚠️ Important Notes

1. **System Addresses**: Used to transfer tokens between HyperEVM and HyperCore
   - HYPE (Token 135): `0x2222...2222` (special case)
   - Other tokens: `0x20` + token ID in big-endian

2. **EVM Contracts**: Only tokens with `hasEvmLink: true` have EVM contracts

3. **Token IDs**: Hip-1 token IDs are unique across the network

4. **Canonical Tokens**: `isCanonical: true` indicates genesis/official tokens

5. **Network Differences**: Testnet has more test tokens, mainnet has production tokens


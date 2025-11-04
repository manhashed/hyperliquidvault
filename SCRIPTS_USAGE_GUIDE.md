# HyperCoreVault Scripts Usage Guide

## 📋 Overview

This guide covers all available scripts for interacting with your HyperCoreVault on HyperEVM testnet.

---

## 🔧 Configuration Scripts

### Network Setup
All scripts are configured in `hardhat.config.ts`:
- **HyperEVM Testnet** (Chain ID: 998)
- **HyperEVM Mainnet** (Chain ID: 999)

---

## 💰 Deposit & Withdrawal Scripts

### 1. `deposit.ts` - Deposit USDC to Vault
Deposits USDC from your wallet to the vault and transfers to perp account.

```bash
npx hardhat run scripts/deposit.ts --network hyperEvmTestnet
```

**Configuration:**
- Line 7: `APPROVAL_AMOUNT` - Amount to approve (default: 1M USDC)
- Line 8: `DEPOSIT_AMOUNT` - Amount to deposit (default: 10 USDC)

### 2. `withdraw.ts` - Withdraw USDC from Vault
Withdraws USDC from perp back to your wallet.

```bash
npx hardhat run scripts/withdraw.ts --network hyperEvmTestnet
```

### 3. `transferToPerp.ts` - Transfer USDC from Spot to Perp
Transfers USDC within HyperCore from spot balance to perp balance.

```bash
npx hardhat run scripts/transferToPerp.ts --network hyperEvmTestnet
```

**Configuration:**
- Line 8: `AMOUNT_USDC` - Amount to transfer (default: 30 USDC)

---

## 🎯 Trading Scripts

### 4. `placeLimitOrder.ts` - Place Limit Orders
Place limit orders for multiple assets with configurable parameters.

```bash
npx hardhat run scripts/placeLimitOrder.ts --network hyperEvmTestnet
```

**Multi-Asset Support:**
- **Line 43**: Change `SELECTED_ASSET` between "BTC" or "HYPE"
- **BTC**: Asset ID 0, configurable price/size
- **HYPE**: Asset ID 1105, configurable price/size

**Example:**
```typescript
const SELECTED_ASSET = "HYPE"; // Switch to HYPE
```

### 5. `closePosition.ts` - Close a Single Position
Close a specific open position with reduce-only order.

```bash
npx hardhat run scripts/closePosition.ts --network hyperEvmTestnet
```

**Configuration (Lines 23-27):**
```typescript
const position: ClosePositionParams = {
  assetId: 3,           // Asset ID
  assetName: "BTC",
  positionSize: 0.003,  // Positive=LONG, Negative=SHORT
  currentPrice: 107000,
};
```

### 6. `closeAllPositions.ts` - Close All Open Positions
Automatically fetches and closes all open positions.

```bash
npx hardhat run scripts/closeAllPositions.ts --network hyperEvmTestnet
```

---

## 💸 Token Transfer Scripts

### 7. `spotSend.ts` - Send Tokens from Spot Balance
Send tokens from vault's spot balance to any address.

```bash
npx hardhat run scripts/spotSend.ts --network hyperEvmTestnet
```

**Multi-Token Support:**
- **Line 36**: Change `SELECTED_TOKEN` between "USDC" or "HYPE"
- **Line 40**: Set `AMOUNT` (amount to send)

**Token Configurations:**
```typescript
USDC: {
  tokenId: 0n,
  decimals: 8,
  contractAddress: "0x2B3370eE501B4a559b57D449569354196457D8Ab"
}

HYPE: {
  tokenId: 135n,
  decimals: 18,
  contractAddress: "0x2222222222222222222222222222222222222222"
}
```

### 8. `depositToCoreScript.ts` - Deposit Tokens to HyperCore ⚠️
Deposit tokens from wallet to HyperCore.

```bash
npx hardhat run scripts/depositToCoreScript.ts --network hyperEvmTestnet
```

**Multi-Token Support:**
- **Line 34**: Change `SELECTED_TOKEN` between "USDC" or "HYPE"
- **Line 37**: Set `AMOUNT`

⚠️ **Note**: Currently has a smart contract logic issue - transfers to token address instead of core.

### 9. `withdrawFromCoreScript.ts` - Withdraw Tokens from HyperCore
Withdraw tokens from HyperCore spot balance.

```bash
npx hardhat run scripts/withdrawFromCoreScript.ts --network hyperEvmTestnet
```

**Multi-Token Support:**
- **Line 34**: Change `SELECTED_TOKEN` between "USDC" or "HYPE"
- **Line 37**: Set `AMOUNT`

---

## 🔄 Deployment & Upgrade Scripts

### 10. `deploy.ts` - Deploy New Vault (Non-Upgradeable)
Deploy a new HyperCoreVault contract without proxy.

```bash
npx hardhat run scripts/deploy.ts --network hyperEvmTestnet
```

### 11. `deployProxy.ts` - Deploy New Vault as Proxy
Deploy a new upgradeable HyperCoreVault with transparent proxy pattern.

```bash
npx hardhat run scripts/deployProxy.ts --network hyperEvmTestnet
```

### 12. `upgradeProxy.ts` - Upgrade Existing Proxy
Upgrade the implementation of an existing proxy contract.

```bash
npx hardhat run scripts/upgradeProxy.ts --network hyperEvmTestnet
```

**Configuration:**
- Line 4: `PROXY_ADDRESS` - Your proxy address
- Line 5: `PROXY_ADMIN_ADDRESS` - ProxyAdmin contract address

---

## 📊 API Scripts (Standalone - No Hardhat Required)

These scripts can be run directly with Node.js and don't require Hardhat.

### 13. `getAccountState.js` - Get Complete Account Info
```bash
node api-scripts/getAccountState.js
```

Shows: Account value, margin, open positions, withdrawable balance

### 14. `getOpenOrders.js` - Get All Open Orders
```bash
node api-scripts/getOpenOrders.js
```

Shows: All pending orders with details

### 15. `getUserFills.js` - Get Recent Trade Fills
```bash
node api-scripts/getUserFills.js
```

Shows: Executed trades, fees, trade IDs

### 16. `getFundingHistory.js` - Get Funding Payments
```bash
node api-scripts/getFundingHistory.js
```

Shows: Funding rates paid/received

### 17. `getMarketData.js` - Get Market Prices
```bash
node api-scripts/getMarketData.js
```

Shows: Current prices for all assets, available markets

### 18. `getAllData.js` - Get Everything
```bash
node api-scripts/getAllData.js
```

Runs all API scripts and provides comprehensive summary

---

## 🎛️ Quick Token Selection Guide

### For Multi-Token Scripts:

1. **Open the script file**
2. **Find the `SELECTED_TOKEN` or `SELECTED_ASSET` line**
3. **Change the value:**
   ```typescript
   const SELECTED_TOKEN = "USDC"; // or "HYPE"
   ```
4. **Save and run**

### Supported Tokens:

| Token | ID | Decimals | Address |
|-------|-----|----------|---------|
| USDC | 0 | 6 | `0x2B3370eE501B4a559b57D449569354196457D8Ab` |
| HYPE | 135 | 18 | `0x2222222222222222222222222222222222222222` |
| BTC (perp) | 0 | - | - |
| HYPE (perp) | 1105 | - | - |

---

## 🔐 Environment Variables

Set in `.env` file:

```env
PRIVATE_KEY=your_private_key_here
VAULT_ADDRESS=0xB6b9Db33FCdDC4c2FCCfc049D72aF5D0766A26e6
```

---

## 📍 Current Deployment

**Proxy Contract (USE THIS):**
- Address: `0xB6b9Db33FCdDC4c2FCCfc049D72aF5D0766A26e6`
- Implementation: `0xCD5b834575Bb1aF204b30B601B08802587C3c716`
- ProxyAdmin: `0x9263E34A9919c5fEe06674F9fE12538ff5A87F39`

**Owner:**
- Address: `0x2bBb22bE8deaB3487b378C95e276768a772C2738`

---

## 🚀 Workflow Examples

### Example 1: Place a HYPE Order
```bash
# 1. Edit placeLimitOrder.ts - set SELECTED_ASSET = "HYPE"
# 2. Run the script
npx hardhat run scripts/placeLimitOrder.ts --network hyperEvmTestnet
```

### Example 2: Send USDC via Spot
```bash
# 1. Edit spotSend.ts - set SELECTED_TOKEN = "USDC"
# 2. Run the script
npx hardhat run scripts/spotSend.ts --network hyperEvmTestnet
```

### Example 3: Check All Positions
```bash
node api-scripts/getAllData.js
```

---

## ⚠️ Important Notes

1. **Always use the proxy address** for contract interactions
2. **Test with small amounts first** on testnet
3. **Check balances** before and after operations
4. **IOC orders** (Immediate or Cancel) may not fill if no match
5. **Reduce-only orders** only close positions, won't open new ones

---

## 🆘 Troubleshooting

### "Insufficient balance"
- Check your token balance with `getAccountState.js`
- Ensure you have enough tokens in the correct balance (spot/perp)

### "Account is blacklisted"
- This occurs when trying to send tokens to invalid addresses
- Check the destination address is correct

### "Transaction failed"
- Ensure sufficient HYPE for gas fees
- Verify network connection to HyperEVM testnet
- Check transaction on explorer for details

---

## 📖 Documentation Files

- `README.md` - Main project overview
- `SCRIPTS_USAGE_GUIDE.md` - This file
- `api-scripts/README.md` - API scripts documentation

---

*Last Updated: After Proxy Upgrade*  
*Network: HyperEVM Testnet (Chain ID 998)*


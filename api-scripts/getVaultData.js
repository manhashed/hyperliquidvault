// Configuration
const VAULT_ADDRESS = process.env.VAULT_ADDRESS || "0xB6b9Db33FCdDC4c2FCCfc049D72aF5D0766A26e6";
const API_ENDPOINT = "https://api.hyperliquid-testnet.xyz/info";

/**
 * Comprehensive Vault Data Fetcher
 * Gets positions, spot balances, and all relevant vault information
 */

async function getVaultData(address) {
    try {
        console.log("═══════════════════════════════════════════════════════════════");
        console.log("           HYPERLIQUID VAULT COMPREHENSIVE DATA");
        console.log("═══════════════════════════════════════════════════════════════");
        console.log(`Vault Address: ${address}`);
        console.log(`API Endpoint: ${API_ENDPOINT}`);
        console.log("═══════════════════════════════════════════════════════════════\n");

        // Fetch user state (contains everything)
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: "clearinghouseState",
                user: address
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
        }

        const data = await response.json();

        // ═══════════════════════════════════════════════════════════════
        // ACCOUNT SUMMARY
        // ═══════════════════════════════════════════════════════════════
        console.log("📊 ACCOUNT SUMMARY");
        console.log("─────────────────────────────────────────────────────────────");
        
        if (data.marginSummary) {
            console.log(`Account Value:        $${parseFloat(data.marginSummary.accountValue).toFixed(2)}`);
            console.log(`Total Raw USD:        $${parseFloat(data.marginSummary.totalRawUsd).toFixed(2)}`);
            console.log(`Total Margin Used:    $${parseFloat(data.marginSummary.totalMarginUsed).toFixed(2)}`);
            console.log(`Withdrawable:         $${parseFloat(data.withdrawable).toFixed(2)}`);
        } else {
            console.log("No margin summary available");
        }
        console.log("");

        // ═══════════════════════════════════════════════════════════════
        // PERP POSITIONS
        // ═══════════════════════════════════════════════════════════════
        console.log("📈 PERPETUAL POSITIONS");
        console.log("─────────────────────────────────────────────────────────────");
        
        if (data.assetPositions && data.assetPositions.length > 0) {
            data.assetPositions.forEach((position, index) => {
                const positionData = position.position;
                console.log(`\nPosition #${index + 1}:`);
                console.log(`  Asset:              ${positionData.coin}`);
                console.log(`  Size:               ${positionData.szi}`);
                console.log(`  Entry Price:        $${parseFloat(positionData.entryPx).toFixed(2)}`);
                console.log(`  Position Value:     $${parseFloat(positionData.positionValue).toFixed(2)}`);
                console.log(`  Unrealized PnL:     $${parseFloat(positionData.unrealizedPnl).toFixed(2)}`);
                console.log(`  Return on Equity:   ${(parseFloat(positionData.returnOnEquity) * 100).toFixed(2)}%`);
                console.log(`  Leverage:           ${positionData.leverage.value}x (Type: ${positionData.leverage.type})`);
                console.log(`  Liquidation Price:  $${positionData.liquidationPx || 'N/A'}`);
                console.log(`  Margin Used:        $${parseFloat(positionData.marginUsed).toFixed(2)}`);
                console.log(`  Max Trade Size:     ${positionData.maxTradeSzs.join(', ')}`);
            });
        } else {
            console.log("No open perp positions");
        }
        console.log("");

        // ═══════════════════════════════════════════════════════════════
        // SPOT BALANCES
        // ═══════════════════════════════════════════════════════════════
        console.log("💰 SPOT BALANCES");
        console.log("─────────────────────────────────────────────────────────────");
        
        // Fetch spot balances separately
        const spotResponse = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: "spotClearinghouseState",
                user: address
            }),
        });

        if (spotResponse.ok) {
            const spotData = await spotResponse.json();
            
            if (spotData && spotData.balances && spotData.balances.length > 0) {
                console.log("\nToken Balances:");
                spotData.balances.forEach(balance => {
                    const hold = parseFloat(balance.hold || 0);
                    const total = parseFloat(balance.total || 0);
                    const available = total - hold;
                    
                    console.log(`\n  ${balance.coin}:`);
                    console.log(`    Total:      ${total.toFixed(6)}`);
                    console.log(`    Available:  ${available.toFixed(6)}`);
                    if (hold > 0) {
                        console.log(`    Hold:       ${hold.toFixed(6)}`);
                    }
                });
            } else {
                console.log("No spot token balances");
            }
        } else {
            console.log("Could not fetch spot balances");
        }

        // Also show perp withdrawable for comparison
        if (data.withdrawable && parseFloat(data.withdrawable) > 0) {
            console.log(`\nPerp Withdrawable:    $${parseFloat(data.withdrawable).toFixed(6)}`);
        }
        console.log("");

        // ═══════════════════════════════════════════════════════════════
        // OPEN ORDERS
        // ═══════════════════════════════════════════════════════════════
        console.log("📋 OPEN ORDERS");
        console.log("─────────────────────────────────────────────────────────────");

        // Fetch open orders separately
        const ordersResponse = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: "openOrders",
                user: address
            }),
        });

        if (ordersResponse.ok) {
            const ordersData = await ordersResponse.json();
            if (ordersData && ordersData.length > 0) {
                ordersData.forEach((order, index) => {
                    console.log(`\nOrder #${index + 1}:`);
                    console.log(`  Asset:        ${order.coin}`);
                    console.log(`  Side:         ${order.side}`);
                    console.log(`  Limit Price:  $${parseFloat(order.limitPx).toFixed(2)}`);
                    console.log(`  Size:         ${order.sz}`);
                    console.log(`  Reduce Only:  ${order.reduceOnly}`);
                    console.log(`  Order ID:     ${order.oid}`);
                    console.log(`  Timestamp:    ${new Date(order.timestamp).toLocaleString()}`);
                });
            } else {
                console.log("No open orders");
            }
        } else {
            console.log("Could not fetch open orders");
        }
        console.log("");

        // ═══════════════════════════════════════════════════════════════
        // RECENT FILLS
        // ═══════════════════════════════════════════════════════════════
        console.log("🔄 RECENT FILLS (Last 5)");
        console.log("─────────────────────────────────────────────────────────────");

        const fillsResponse = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: "userFills",
                user: address
            }),
        });

        if (fillsResponse.ok) {
            const fillsData = await fillsResponse.json();
            if (fillsData && fillsData.length > 0) {
                fillsData.slice(0, 5).forEach((fill, index) => {
                    console.log(`\nFill #${index + 1}:`);
                    console.log(`  Asset:        ${fill.coin}`);
                    console.log(`  Side:         ${fill.side}`);
                    console.log(`  Price:        $${parseFloat(fill.px).toFixed(2)}`);
                    console.log(`  Size:         ${fill.sz}`);
                    console.log(`  Closed PnL:   $${parseFloat(fill.closedPnl || 0).toFixed(2)}`);
                    console.log(`  Fee:          $${parseFloat(fill.fee).toFixed(4)}`);
                    console.log(`  Time:         ${new Date(fill.time).toLocaleString()}`);
                });
            } else {
                console.log("No recent fills");
            }
        } else {
            console.log("Could not fetch fills");
        }
        console.log("");

        // ═══════════════════════════════════════════════════════════════
        // FUNDING PAYMENTS (Last 5)
        // ═══════════════════════════════════════════════════════════════
        console.log("💸 RECENT FUNDING PAYMENTS (Last 5)");
        console.log("─────────────────────────────────────────────────────────────");

        const fundingResponse = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: "userFunding",
                user: address
            }),
        });

        if (fundingResponse.ok) {
            const fundingData = await fundingResponse.json();
            if (fundingData && fundingData.length > 0) {
                fundingData.slice(0, 5).forEach((funding, index) => {
                    console.log(`\nFunding #${index + 1}:`);
                    console.log(`  Asset:        ${funding.coin}`);
                    console.log(`  USD:          $${parseFloat(funding.usdc).toFixed(4)}`);
                    console.log(`  Funding Rate: ${(parseFloat(funding.fundingRate) * 100).toFixed(6)}%`);
                    console.log(`  Size:         ${funding.szi}`);
                    console.log(`  Time:         ${new Date(funding.time).toLocaleString()}`);
                });
            } else {
                console.log("No funding payments");
            }
        } else {
            console.log("Could not fetch funding history");
        }
        console.log("");

        // ═══════════════════════════════════════════════════════════════
        // SUMMARY STATISTICS
        // ═══════════════════════════════════════════════════════════════
        console.log("📊 VAULT STATISTICS");
        console.log("─────────────────────────────────────────────────────────────");
        
        const numPositions = data.assetPositions ? data.assetPositions.filter(p => p.type === 'oneWay').length : 0;
        const totalPnL = data.assetPositions 
            ? data.assetPositions.reduce((sum, pos) => sum + parseFloat(pos.position.unrealizedPnl || 0), 0)
            : 0;
        
        console.log(`Open Positions:       ${numPositions}`);
        console.log(`Total Unrealized PnL: $${totalPnL.toFixed(2)}`);
        
        if (data.marginSummary) {
            const leverage = parseFloat(data.marginSummary.totalMarginUsed) / parseFloat(data.marginSummary.accountValue);
            console.log(`Effective Leverage:   ${leverage.toFixed(2)}x`);
        }

        console.log("\n═══════════════════════════════════════════════════════════════");
        console.log("                    END OF VAULT DATA");
        console.log("═══════════════════════════════════════════════════════════════\n");

        // Return raw data for programmatic use
        return {
            marginSummary: data.marginSummary,
            positions: data.assetPositions,
            withdrawable: data.withdrawable,
            crossMarginSummary: data.crossMarginSummary,
        };

    } catch (error) {
        console.error('❌ Error fetching vault data:', error.message);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    const address = process.argv[2] || VAULT_ADDRESS;
    getVaultData(address)
        .then(() => {
            console.log('✅ Vault data fetched successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Failed to fetch vault data:', error);
            process.exit(1);
        });
}

module.exports = { getVaultData };


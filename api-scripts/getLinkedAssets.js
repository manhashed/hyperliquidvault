// Configuration
const API_ENDPOINT = "https://api.hyperliquid-testnet.xyz/info";

/**
 * Get all linked Hip-1 and EVM assets
 * Shows token IDs, EVM contract addresses, and system addresses
 */

async function getLinkedAssets() {
    try {
        console.log("═══════════════════════════════════════════════════════════════");
        console.log("        HYPERLIQUID LINKED HIP-1 & EVM ASSETS");
        console.log("═══════════════════════════════════════════════════════════════");
        console.log(`API Endpoint: ${API_ENDPOINT}`);
        console.log("═══════════════════════════════════════════════════════════════\n");

        // Fetch spot metadata (includes all token information)
        console.log("📡 Fetching asset metadata...\n");
        
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: "spotMeta"
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
        }

        const data = await response.json();

        if (!data || !data.tokens || data.tokens.length === 0) {
            console.log("❌ No token data available");
            return;
        }

        // Separate tokens into categories
        const evmLinkedTokens = [];
        const hipOnlyTokens = [];
        const nativeTokens = [];

        data.tokens.forEach(token => {
            if (token.evmContract) {
                evmLinkedTokens.push(token);
            } else if (token.name === 'HYPE') {
                nativeTokens.push(token);
            } else {
                hipOnlyTokens.push(token);
            }
        });

        // ═══════════════════════════════════════════════════════════════
        // NATIVE TOKENS (HYPE)
        // ═══════════════════════════════════════════════════════════════
        if (nativeTokens.length > 0) {
            console.log("🔵 NATIVE TOKENS");
            console.log("─────────────────────────────────────────────────────────────");
            nativeTokens.forEach(token => {
                const systemAddress = "0x2222222222222222222222222222222222222222";
                
                console.log(`\n  ${token.name} (${token.szDecimals} decimals)`);
                console.log(`    Token Index:      ${token.index}`);
                console.log(`    System Address:   ${systemAddress}`);
                console.log(`    Type:             Native (non-ERC20)`);
                console.log(`    Wei Decimals:     ${token.weiDecimals || 'N/A'}`);
            });
            console.log("");
        }

        // ═══════════════════════════════════════════════════════════════
        // EVM-LINKED TOKENS
        // ═══════════════════════════════════════════════════════════════
        console.log("🔗 EVM-LINKED TOKENS (Hip-1 + ERC20)");
        console.log("─────────────────────────────────────────────────────────────");
        
        if (evmLinkedTokens.length > 0) {
            console.log(`Found ${evmLinkedTokens.length} EVM-linked tokens:\n`);
            
            evmLinkedTokens.forEach((token, index) => {
                // Calculate system address
                const tokenId = token.index;
                const systemAddress = tokenId === 135 
                    ? "0x2222222222222222222222222222222222222222"
                    : "0x" + (0x2000000000000000000000000000000000000000n | BigInt(tokenId)).toString(16).padStart(40, '0');
                
                // Extract EVM contract address (it might be an object)
                const evmContractAddress = typeof token.evmContract === 'object' 
                    ? (token.evmContract.address || JSON.stringify(token.evmContract))
                    : token.evmContract;
                
                console.log(`${index + 1}. ${token.name}`);
                console.log(`    Hip-1 Token ID:       ${token.index}`);
                console.log(`    EVM Contract:         ${evmContractAddress}`);
                console.log(`    System Address:       ${systemAddress}`);
                console.log(`    Decimals:             ${token.szDecimals}`);
                console.log(`    Wei Decimals:         ${token.weiDecimals || 'N/A'}`);
                
                // Show if it's a genesis token
                if (token.isCanonical) {
                    console.log(`    Status:               ✅ Canonical (Genesis)`);
                }
                
                console.log("");
            });
            
            console.log(`Total EVM-linked tokens: ${evmLinkedTokens.length}`);
        } else {
            console.log("No EVM-linked tokens found");
        }
        console.log("");

        // ═══════════════════════════════════════════════════════════════
        // HIP-1 ONLY TOKENS (No EVM Link)
        // ═══════════════════════════════════════════════════════════════
        if (hipOnlyTokens.length > 0) {
            console.log("🔷 HIP-1 ONLY TOKENS (No EVM Contract)");
            console.log("─────────────────────────────────────────────────────────────");
            console.log(`Found ${hipOnlyTokens.length} Hip-1 only tokens:\n`);
            
            hipOnlyTokens.forEach((token, index) => {
                const tokenId = token.index;
                const systemAddress = "0x" + (0x2000000000000000000000000000000000000000n | BigInt(tokenId)).toString(16).padStart(40, '0');
                
                console.log(`${index + 1}. ${token.name}`);
                console.log(`    Hip-1 Token ID:   ${token.index}`);
                console.log(`    System Address:   ${systemAddress}`);
                console.log(`    Decimals:         ${token.szDecimals}`);
                console.log("");
            });
            
            console.log(`Total Hip-1 only tokens: ${hipOnlyTokens.length}`);
            console.log("");
        }

        // ═══════════════════════════════════════════════════════════════
        // SUMMARY STATISTICS
        // ═══════════════════════════════════════════════════════════════
        console.log("📊 SUMMARY");
        console.log("─────────────────────────────────────────────────────────────");
        console.log(`Total Tokens:         ${data.tokens.length}`);
        console.log(`Native Tokens:        ${nativeTokens.length} (HYPE)`);
        console.log(`EVM-Linked Tokens:    ${evmLinkedTokens.length}`);
        console.log(`Hip-1 Only Tokens:    ${hipOnlyTokens.length}`);
        console.log("");

        // ═══════════════════════════════════════════════════════════════
        // SYSTEM ADDRESS REFERENCE
        // ═══════════════════════════════════════════════════════════════
        console.log("💡 SYSTEM ADDRESS CALCULATION");
        console.log("─────────────────────────────────────────────────────────────");
        console.log("System addresses are used to transfer tokens between HyperEVM");
        console.log("and HyperCore (Hip-1 side):");
        console.log("");
        console.log("  HYPE (Token 135):  0x2222222222222222222222222222222222222222");
        console.log("  Other tokens:      0x20 + tokenId (big-endian format)");
        console.log("");
        console.log("Example:");
        console.log("  USDC (Token 0):    0x2000000000000000000000000000000000000000");
        console.log("  Token 1:           0x2000000000000000000000000000000000000001");
        console.log("  Token 255:         0x20000000000000000000000000000000000000ff");
        console.log("");

        console.log("═══════════════════════════════════════════════════════════════");
        console.log("                    END OF ASSET DATA");
        console.log("═══════════════════════════════════════════════════════════════\n");

        // Return structured data for programmatic use
        return {
            native: nativeTokens,
            evmLinked: evmLinkedTokens,
            hipOnly: hipOnlyTokens,
            total: data.tokens.length
        };

    } catch (error) {
        console.error('❌ Error fetching linked assets:', error.message);
        throw error;
    }
}

// Helper function to export system address calculation
function getSystemAddress(tokenId) {
    if (tokenId === 135) {
        return "0x2222222222222222222222222222222222222222";
    }
    return "0x" + (0x2000000000000000000000000000000000000000n | BigInt(tokenId)).toString(16).padStart(40, '0');
}

// Run if called directly
if (require.main === module) {
    getLinkedAssets()
        .then(() => {
            console.log('✅ Linked assets fetched successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Failed to fetch linked assets:', error);
            process.exit(1);
        });
}

module.exports = { getLinkedAssets, getSystemAddress };


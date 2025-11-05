const fs = require('fs');
const path = require('path');

/**
 * Export all linked Hip-1 and EVM assets from testnet and mainnet to JSON files
 */

const TESTNET_API = "https://api.hyperliquid-testnet.xyz/info";
const MAINNET_API = "https://api.hyperliquid.xyz/info";
const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'assets');

// Calculate system address for any token ID
function getSystemAddress(tokenId) {
    if (tokenId === 135) {
        return "0x2222222222222222222222222222222222222222";
    }
    return "0x" + (0x2000000000000000000000000000000000000000n | BigInt(tokenId)).toString(16).padStart(40, '0');
}

async function fetchAssets(apiEndpoint, networkName) {
    console.log(`\n📡 Fetching ${networkName} assets...`);
    
    try {
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: "spotMeta"
            }),
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!data || !data.tokens || data.tokens.length === 0) {
            console.log(`❌ No token data available for ${networkName}`);
            return null;
        }

        // Process and categorize tokens
        const processedTokens = data.tokens.map(token => {
            const tokenId = token.index;
            const systemAddress = getSystemAddress(tokenId);
            
            // Extract EVM contract address if it's an object
            let evmContractAddress = null;
            if (token.evmContract) {
                evmContractAddress = typeof token.evmContract === 'object' 
                    ? (token.evmContract.address || null)
                    : token.evmContract;
            }

            return {
                name: token.name,
                hipTokenId: tokenId,
                evmContract: evmContractAddress,
                systemAddress: systemAddress,
                decimals: {
                    sz: token.szDecimals,
                    wei: token.weiDecimals || null
                },
                isCanonical: token.isCanonical || false,
                isNative: token.name === 'HYPE',
                hasEvmLink: !!evmContractAddress
            };
        });

        // Categorize tokens
        const native = processedTokens.filter(t => t.isNative);
        const evmLinked = processedTokens.filter(t => t.hasEvmLink && !t.isNative);
        const hipOnly = processedTokens.filter(t => !t.hasEvmLink && !t.isNative);

        const result = {
            network: networkName,
            timestamp: new Date().toISOString(),
            apiEndpoint: apiEndpoint,
            summary: {
                totalTokens: processedTokens.length,
                nativeTokens: native.length,
                evmLinkedTokens: evmLinked.length,
                hipOnlyTokens: hipOnly.length
            },
            tokens: {
                all: processedTokens,
                native: native,
                evmLinked: evmLinked,
                hipOnly: hipOnly
            }
        };

        console.log(`✅ Found ${processedTokens.length} tokens on ${networkName}`);
        console.log(`   - Native: ${native.length}`);
        console.log(`   - EVM-Linked: ${evmLinked.length}`);
        console.log(`   - Hip-1 Only: ${hipOnly.length}`);

        return result;

    } catch (error) {
        console.error(`❌ Error fetching ${networkName} assets:`, error.message);
        return null;
    }
}

async function exportAssets() {
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("        EXPORT HYPERLIQUID LINKED ASSETS TO JSON");
    console.log("═══════════════════════════════════════════════════════════════");
    console.log(`Output Directory: ${OUTPUT_DIR}`);
    console.log("═══════════════════════════════════════════════════════════════");

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        console.log(`✅ Created output directory: ${OUTPUT_DIR}\n`);
    }

    // Fetch testnet assets
    const testnetAssets = await fetchAssets(TESTNET_API, 'Testnet');
    
    // Fetch mainnet assets
    const mainnetAssets = await fetchAssets(MAINNET_API, 'Mainnet');

    // Export testnet assets
    if (testnetAssets) {
        const testnetPath = path.join(OUTPUT_DIR, 'testnet-assets.json');
        fs.writeFileSync(testnetPath, JSON.stringify(testnetAssets, null, 2));
        console.log(`\n📝 Exported testnet assets to: ${testnetPath}`);
        
        // Export simplified testnet version (just the tokens array)
        const testnetSimplePath = path.join(OUTPUT_DIR, 'testnet-assets-simple.json');
        fs.writeFileSync(testnetSimplePath, JSON.stringify(testnetAssets.tokens.all, null, 2));
        console.log(`📝 Exported testnet simple to: ${testnetSimplePath}`);
    }

    // Export mainnet assets
    if (mainnetAssets) {
        const mainnetPath = path.join(OUTPUT_DIR, 'mainnet-assets.json');
        fs.writeFileSync(mainnetPath, JSON.stringify(mainnetAssets, null, 2));
        console.log(`\n📝 Exported mainnet assets to: ${mainnetPath}`);
        
        // Export simplified mainnet version
        const mainnetSimplePath = path.join(OUTPUT_DIR, 'mainnet-assets-simple.json');
        fs.writeFileSync(mainnetSimplePath, JSON.stringify(mainnetAssets.tokens.all, null, 2));
        console.log(`📝 Exported mainnet simple to: ${mainnetSimplePath}`);
    }

    // Create combined export
    if (testnetAssets && mainnetAssets) {
        const combined = {
            exportDate: new Date().toISOString(),
            networks: {
                testnet: {
                    summary: testnetAssets.summary,
                    tokens: testnetAssets.tokens.all
                },
                mainnet: {
                    summary: mainnetAssets.summary,
                    tokens: mainnetAssets.tokens.all
                }
            }
        };

        const combinedPath = path.join(OUTPUT_DIR, 'all-networks-assets.json');
        fs.writeFileSync(combinedPath, JSON.stringify(combined, null, 2));
        console.log(`\n📝 Exported combined assets to: ${combinedPath}`);
    }

    // Create index/mapping files for quick lookups
    if (testnetAssets) {
        // Token ID to address mapping (testnet)
        const testnetMapping = {};
        testnetAssets.tokens.all.forEach(token => {
            testnetMapping[token.hipTokenId] = {
                name: token.name,
                systemAddress: token.systemAddress,
                evmContract: token.evmContract
            };
        });
        const testnetMappingPath = path.join(OUTPUT_DIR, 'testnet-token-mapping.json');
        fs.writeFileSync(testnetMappingPath, JSON.stringify(testnetMapping, null, 2));
        console.log(`📝 Exported testnet mapping to: ${testnetMappingPath}`);
    }

    if (mainnetAssets) {
        // Token ID to address mapping (mainnet)
        const mainnetMapping = {};
        mainnetAssets.tokens.all.forEach(token => {
            mainnetMapping[token.hipTokenId] = {
                name: token.name,
                systemAddress: token.systemAddress,
                evmContract: token.evmContract
            };
        });
        const mainnetMappingPath = path.join(OUTPUT_DIR, 'mainnet-token-mapping.json');
        fs.writeFileSync(mainnetMappingPath, JSON.stringify(mainnetMapping, null, 2));
        console.log(`📝 Exported mainnet mapping to: ${mainnetMappingPath}`);
    }

    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("                    EXPORT COMPLETE");
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("\n📂 Exported Files:");
    console.log("   - testnet-assets.json (full data with categories)");
    console.log("   - testnet-assets-simple.json (just token array)");
    console.log("   - testnet-token-mapping.json (ID → addresses)");
    console.log("   - mainnet-assets.json (full data with categories)");
    console.log("   - mainnet-assets-simple.json (just token array)");
    console.log("   - mainnet-token-mapping.json (ID → addresses)");
    console.log("   - all-networks-assets.json (combined)");
    console.log("\n💡 Use these JSON files in your applications for token lookups!");
    console.log("═══════════════════════════════════════════════════════════════\n");

    return {
        testnet: testnetAssets,
        mainnet: mainnetAssets
    };
}

// Run if called directly
if (require.main === module) {
    exportAssets()
        .then(() => {
            console.log('✅ Asset export completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Failed to export assets:', error);
            process.exit(1);
        });
}

module.exports = { exportAssets, getSystemAddress };


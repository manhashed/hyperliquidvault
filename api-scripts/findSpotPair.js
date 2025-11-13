const { API_URL, NETWORK } = require('./config');

const TESTNET_API = "https://api.hyperliquid-testnet.xyz/info";
const MAINNET_API = "https://api.hyperliquid.xyz/info";

// Token ID mapping (from spotMeta)
const TOKEN_IDS = {
    'USDC': 0,
    'HYPE': 135,
    'PURR': 1
};

async function findSpotPair(base, quote, network = 'testnet') {
    const apiEndpoint = network === 'mainnet' ? MAINNET_API : TESTNET_API;
    
    try {
        const baseTokenId = TOKEN_IDS[base];
        const quoteTokenId = TOKEN_IDS[quote];
        
        if (baseTokenId === undefined || quoteTokenId === undefined) {
            console.log(`\n⚠️  Unknown token: ${base} or ${quote}`);
            console.log(`   Available: ${Object.keys(TOKEN_IDS).join(', ')}`);
            return null;
        }

        // Get all spot trading pairs
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: "spotMetaAndAssetCtxs" })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && data[0] && data[0].universe) {
            const pair = data[0].universe.find(p => 
                p.tokens && p.tokens[0] === baseTokenId && p.tokens[1] === quoteTokenId
            );

            if (pair) {
                console.log(`\n✅ Found ${base}/${quote} on ${network}:`);
                console.log(`   Spot Asset ID: ${pair.index}`);
                console.log(`   Pair Name: ${pair.name}`);
                console.log(`   Tokens: [${pair.tokens[0]}, ${pair.tokens[1]}]`);
                return pair.index;
            }
        }

        console.log(`\n❌ ${base}/${quote} pair not found on ${network}`);
        return null;

    } catch (error) {
        console.error(`Error searching ${network}:`, error.message);
        return null;
    }
}

async function main() {
    const base = process.argv[2] || 'HYPE';
    const quote = process.argv[3] || 'USDC';

    console.log(`\n🔍 Finding ${base}/${quote} spot pair...`);
    console.log("═══════════════════════════════════════════════════════════════\n");

    const testnetId = await findSpotPair(base, quote, 'testnet');
    const mainnetId = await findSpotPair(base, quote, 'mainnet');

    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("                     SUMMARY");
    console.log("═══════════════════════════════════════════════════════════════");
    console.log(`Pair: ${base}/${quote}`);
    console.log(`Testnet Asset ID:  ${testnetId !== null ? testnetId : 'Not Found'}`);
    console.log(`Mainnet Asset ID:  ${mainnetId !== null ? mainnetId : 'Not Found'}`);
    console.log("═══════════════════════════════════════════════════════════════\n");
}

if (require.main === module) {
    main().then(() => process.exit(0)).catch(console.error);
}

module.exports = { findSpotPair };


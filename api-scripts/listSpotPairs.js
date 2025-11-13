const { API_URL, NETWORK } = require('./config');

const TESTNET_API = "https://api.hyperliquid-testnet.xyz/info";
const MAINNET_API = "https://api.hyperliquid.xyz/info";

async function listSpotPairs(network = 'testnet') {
    const apiEndpoint = network === 'mainnet' ? MAINNET_API : TESTNET_API;
    
    try {
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: "spotMetaAndAssetCtxs" })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        
        console.log(`\n📊 ${network.toUpperCase()} SPOT PAIRS:\n`);
        
        if (data && data[0] && data[0].universe) {
            const pairs = data[0].universe;
            console.log(`Total pairs: ${pairs.length}\n`);
            
            // Look for HYPE pairs
            const hypePairs = pairs.filter(p => p.name.includes('HYPE'));
            console.log(`HYPE pairs found: ${hypePairs.length}`);
            hypePairs.forEach(p => {
                console.log(`  ${p.name} - Index: ${p.index}`);
            });
            
            // Show first 20 pairs
            console.log(`\nFirst 20 pairs:`);
            pairs.slice(0, 20).forEach(p => {
                console.log(`  ${p.name} - Index: ${p.index}`);
            });
        } else {
            console.log('No universe data found');
            console.log('Raw data:', JSON.stringify(data, null, 2).slice(0, 500));
        }

    } catch (error) {
        console.error(`Error:`, error.message);
    }
}

async function main() {
    await listSpotPairs('testnet');
    console.log('\n' + '='.repeat(60));
    await listSpotPairs('mainnet');
}

if (require.main === module) {
    main().then(() => process.exit(0)).catch(console.error);
}

module.exports = { listSpotPairs };


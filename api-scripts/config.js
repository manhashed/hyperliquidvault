/**
 * Configuration for Hyperliquid API Scripts
 * Supports both testnet and mainnet
 */

// Network selection - Reads from HYPERLIQUID_NETWORK env var, defaults to 'testnet'
// Options: 'testnet' or 'mainnet'
const NETWORK = process.env.HYPERLIQUID_NETWORK || 'testnet';

// Network-specific configurations
const NETWORKS = {
  testnet: {
    name: 'Testnet',
    apiUrl: 'https://api.hyperliquid-testnet.xyz/info',
    explorerUrl: 'https://testnet.purrsec.com',
    chainId: 998,
    rpcUrl: 'https://rpc.hyperliquid-testnet.xyz/evm',
  },
  mainnet: {
    name: 'Mainnet',
    apiUrl: 'https://api.hyperliquid.xyz/info',
    explorerUrl: 'https://hyperevmscan.io',
    chainId: 999,
    rpcUrl: 'https://rpc.hyperliquid.xyz/evm',
  },
};

// Get current network config
const currentNetwork = NETWORKS[NETWORK];

if (!currentNetwork) {
  console.error(`❌ Invalid network: ${NETWORK}`);
  console.error(`   Valid options: testnet, mainnet`);
  process.exit(1);
}

// Export configuration
module.exports = {
  NETWORK,
  API_URL: currentNetwork.apiUrl,
  EXPLORER_URL: currentNetwork.explorerUrl,
  CHAIN_ID: currentNetwork.chainId,
  RPC_URL: currentNetwork.rpcUrl,
  NETWORK_NAME: currentNetwork.name,
  
  // Helper function to display network info
  displayNetworkInfo: () => {
    console.log(`🌐 Network: ${currentNetwork.name}`);
    console.log(`   API: ${currentNetwork.apiUrl}`);
    console.log(`   Explorer: ${currentNetwork.explorerUrl}`);
  },
  
  // Helper to get explorer link
  getExplorerLink: (type, address) => {
    return `${currentNetwork.explorerUrl}/${type}/${address}`;
  },
};


import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hyperEvmTestnet: {
      url: "https://rpc.hyperliquid-testnet.xyz/evm",
      chainId: 998,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    hyperEvmMainnet: {
      url: "https://rpc.hyperliquid.xyz/evm",
      chainId: 999,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      hyperEvmTestnet: "no-api-key-needed",
      hyperEvmMainnet: "no-api-key-needed",
    },
    customChains: [
      {
        network: "hyperEvmTestnet",
        chainId: 998,
        urls: {
          apiURL: "https://sourcify.parsec.finance",
          browserURL: "https://testnet.purrsec.com",
        },
      },
      {
        network: "hyperEvmMainnet",
        chainId: 999,
        urls: {
          apiURL: "https://hyperevmscan.io/api",
          browserURL: "https://hyperevmscan.io",
        },
      },
    ],
  },
  sourcify: {
    enabled: true,
    apiUrl: "https://sourcify.parsec.finance",
    browserUrl: "https://testnet.purrsec.com",
  },
};

export default config;

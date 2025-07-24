import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import "dotenv/config"; // To load environment variables

// Ensure you have a .env file with these variables
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001"; // Dummy key for compilation
const MONAD_TESTNET_RPC_URL = process.env.MONAD_TESTNET_RPC_URL || "https://testnet-rpc.monad.xyz";
// Optional: Etherscan API key for verification
// const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.24",
      },
      {
        version: "0.8.20",
      }
    ]
  },
  networks: {
    hardhat: {}, // Default local network
    monadTestnet: {
      url: MONAD_TESTNET_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 10143, // Monad Testnet Chain ID
    },
    // Add other networks like mainnet if needed
  },
  // Optional: Etherscan configuration for verification
  // etherscan: {
  //   apiKey: ETHERSCAN_API_KEY,
  // },
};

export default config; 
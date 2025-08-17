require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
const { createClient } = require('undici');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      chainId: 31337
    },
    basecamp: {
      url: "https://testnet.rpc.camp.network",
      accounts: process.env.BASECAMP_PRIVATE_KEY ? [process.env.BASECAMP_PRIVATE_KEY] : [],
      chainId: 325000, // CAMP Network Testnet V2 Chain ID
      httpHeaders: {
        'User-Agent': 'hardhat'
      },
      clientConfig: {
        keepAlive: true,
        httpAgent: false,
        rejectUnauthorized: false, // This is to bypass SSL certificate issues
      }
    },
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      accounts: process.env.FUJI_PRIVATE_KEY ? [process.env.FUJI_PRIVATE_KEY] : [],
      chainId: 43113, // Avalanche Fuji Testnet Chain ID
      gasPrice: 225000000000,
      timeout: 60000, // 60 seconds
      httpHeaders: {
        'User-Agent': 'hardhat'
      },
      clientConfig: {
        keepAlive: true,
        httpAgent: false,
        rejectUnauthorized: false, // This is to bypass SSL certificate issues
      }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  etherscan: {
    apiKey: {
      basecamp: process.env.BASECAMP_EXPLORER_API_KEY || "",
      avalancheFujiTestnet: process.env.AVALANCHE_API_KEY || ""
    }
  }
};

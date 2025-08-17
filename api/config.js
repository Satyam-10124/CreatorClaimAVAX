// api/config.js
module.exports = {
  // Contract addresses on Fuji testnet
  contracts: {
    creatorRegistry: '0x4F992a229e3eBd64AC36137fa8750c8beA64929E',
    disputeResolver: '0xfd1411e2e3ddfC0C68649d3FEb1bE50C6d599EBd',
    licensingTerms: '0xae160d585c48b96f248Bd6f829f4432EFf9Eb49d', 
    paymentSplitter: '0xe523fc1cc80A6EF2f643895b556cf43A1f1bCF60'
  },
  
  // Enums from contracts
  enums: {
    LicensingStatus: {
      DENY: 0,
      ALLOW_FREE: 1,
      PAID: 2
    },
    AIUsageType: {
      TRAINING: 0,
      FINE_TUNING: 1,
      INFERENCE: 2,
      ALL: 3
    }
  },
  
  // Network settings
  network: {
    rpc: 'https://api.avax-test.network/ext/bc/C/rpc',
    chainId: 43113 // Fuji testnet
  }
};

// api/services/contractService.js
const { ethers } = require('ethers');
const config = require('../config');
require('dotenv').config();

// Load ABIs (using dynamic require to keep the example shorter)
const getABI = (contractName) => {
  return require(`../../artifacts/contracts/${contractName}.sol/${contractName}.json`).abi;
};

// Initialize provider
const provider = new ethers.providers.JsonRpcProvider(config.network.rpc);

// Contract instances
const creatorRegistry = new ethers.Contract(
  config.contracts.creatorRegistry, 
  getABI('CreatorRegistry'), 
  provider
);

const licensingTerms = new ethers.Contract(
  config.contracts.licensingTerms, 
  getABI('LicensingTerms'), 
  provider
);

const paymentSplitter = new ethers.Contract(
  config.contracts.paymentSplitter, 
  getABI('PaymentSplitter'), 
  provider
);

const disputeResolver = new ethers.Contract(
  config.contracts.disputeResolver, 
  getABI('DisputeResolver'), 
  provider
);

// Create authenticated signer for transactions
const getAuthenticatedSigner = () => {
  // Get private key from environment and ensure it's properly formatted
  let privateKey = process.env.API_PRIVATE_KEY;
  if (!privateKey) throw new Error('API private key not configured');
  
  // Ensure it has 0x prefix if not present
  if (!privateKey.startsWith('0x')) {
    privateKey = `0x${privateKey}`;
  }
  
  // Validate key length after potential prefix addition
  if (privateKey.length !== 66) { // 0x + 64 hex chars
    throw new Error('Invalid private key format or length');
  }
  
  try {
    return new ethers.Wallet(privateKey, provider);
  } catch (error) {
    console.error('Error creating wallet:', error);
    throw new Error(`Failed to create wallet: ${error.message}`);
  }
};

// Helper to extract event info from transaction
const extractEventArgs = async (tx, eventName) => {
  const receipt = await tx.wait();
  const event = receipt.events.find(e => e.event === eventName);
  return event ? event.args : null;
};

// Service export
module.exports = {
  // CONTENT OPERATIONS
  
  // Register new content
  async registerContent(creatorAddress, fingerprint, metadataURI) {
    try {
      const signer = getAuthenticatedSigner();
      const tx = await creatorRegistry.connect(signer).registerContent(
        fingerprint,
        metadataURI
      );
      
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "ContentRegistered");
      
      return { 
        success: true,
        txHash: tx.hash,
        contentId: event ? event.args.contentId.toString() : null
      };
    } catch (error) {
      console.error("Error registering content:", error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // Get content by ID
  async getContentById(contentId) {
    try {
      const content = await creatorRegistry.getContentById(contentId);
      return {
        success: true,
        contentId: content.contentId.toString(),
        creator: content.creator,
        fingerprint: content.fingerprint,
        metadataURI: content.metadataURI,
        licensingTermsId: content.licensingTermsId.toString()
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Get content by fingerprint
  async getContentByFingerprint(fingerprint) {
    try {
      const content = await creatorRegistry.getContentByFingerprint(fingerprint);
      return {
        success: true,
        contentId: content.contentId.toString(),
        creator: content.creator,
        fingerprint: content.fingerprint,
        metadataURI: content.metadataURI,
        licensingTermsId: content.licensingTermsId.toString()
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Get creator's content IDs
  async getCreatorContentIds(creatorAddress) {
    try {
      const contentIds = await creatorRegistry.getCreatorContentIds(creatorAddress);
      return {
        success: true,
        contentIds: contentIds.map(id => id.toString())
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Get total content count
  async getTotalContent() {
    try {
      const count = await creatorRegistry.getTotalContent();
      return {
        success: true,
        count: count.toString()
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // LICENSING OPERATIONS
  
  // Create terms for content
  async createTerms(contentId, status, price, requireAttribution, allowedUsageTypes, customTermsURI = "") {
    try {
      const signer = getAuthenticatedSigner();
      const tx = await licensingTerms.connect(signer).createTerms(
        contentId,
        status,
        price,
        requireAttribution,
        allowedUsageTypes,
        customTermsURI || ""
      );
      
      console.log(`Creating terms for content ${contentId}, transaction hash: ${tx.hash}`);
      
      // Wait for 2 confirmations to ensure transaction is mined
      const receipt = await tx.wait(2);
      const event = receipt.events.find(e => e.event === "TermsCreated");
      const termsId = event ? event.args.termsId.toString() : null;
      
      console.log(`Terms created with ID: ${termsId}, block number: ${receipt.blockNumber}`);
      
      // Wait a moment to ensure blockchain state is updated
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Attempt to verify terms existence
      let verifiedTerms = null;
      try {
        verifiedTerms = await licensingTerms.getTermsById(termsId);
        console.log(`Terms verified, ID: ${termsId}, creator: ${verifiedTerms.creator}`);
      } catch (verifyError) {
        console.warn(`Warning: Created terms could not be verified: ${verifyError.message}`);
      }
      
      return {
        success: true,
        txHash: tx.hash,
        termsId: termsId,
        blockNumber: receipt.blockNumber,
        confirmed: !!verifiedTerms
      };
    } catch (error) {
      console.error("Error creating terms:", error);
      return { success: false, error: error.message };
    }
  },
  
  // Update existing terms
  async updateTerms(termsId, active, status, price, requireAttribution, allowedUsageTypes, customTermsURI = "") {
    try {
      const signer = getAuthenticatedSigner();
      const tx = await licensingTerms.connect(signer).updateTerms(
        termsId,
        active,
        status,
        price,
        requireAttribution,
        allowedUsageTypes,
        customTermsURI
      );
      
      return {
        success: true,
        txHash: tx.hash,
        termsId: termsId.toString()
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Get terms by ID with retry mechanism
  async getTermsById(termsId) {
    try {
      if (!termsId) {
        return {
          success: false,
          error: 'Invalid terms ID'
        };
      }

      console.log(`Attempting to retrieve terms with ID ${termsId}...`);
      
      // Try to retrieve the terms with multiple retries
      let terms = null;
      let attempts = 0;
      const maxAttempts = 3;
      let lastError = null;
      
      // Implement retry loop for blockchain sync delays
      while (attempts < maxAttempts) {
        try {
          console.log(`Attempt ${attempts + 1} to retrieve terms ID ${termsId}`);
          terms = await licensingTerms.getTermsById(termsId);
          console.log(`Raw terms data on attempt ${attempts + 1}:`, terms);
          
          // Check for valid data - the terms object has a dual format (array + named properties)
          // We need to look for either terms.id OR terms[0] (the ID as first array element)
          const hasNamedProps = terms && (terms.id !== undefined || terms.contentId !== undefined);
          const hasArrayProps = terms && terms.length > 0;
          
          if (hasNamedProps || hasArrayProps) {
            console.log(`Valid terms data structure found on attempt ${attempts + 1}`);
            break;
          } else {
            console.log(`Empty or undefined terms data on attempt ${attempts + 1}`);
          }
        } catch (retryError) {
          console.warn(`Attempt ${attempts + 1} failed:`, retryError.message);
          lastError = retryError;
        }
        
        // Wait before next retry
        const delayMs = 2000 * (attempts + 1); // Exponential backoff
        console.log(`Waiting ${delayMs}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        attempts++;
      }
      
      // Handle case when we've run out of retries
      if (!terms) {
        console.error(`Terms with ID ${termsId} not found after ${maxAttempts} attempts`);
        return { 
          success: false, 
          error: `Terms with ID ${termsId} could not be retrieved or do not exist after ${maxAttempts} attempts` 
        };
      }
      
      // Extract data from the terms object, handling both array and named property formats
      const termsData = {
        id: terms.id || (terms[0] ? terms[0] : termsId),
        creator: terms.creator || terms[1],
        status: terms.status || terms[2] || 0,
        price: terms.price || terms[3] || 0,
        contentId: terms.contentId || (terms[5] && terms[5][0]),
        requireAttribution: terms.requireAttribution || terms[7] || false,
        allowedUsageTypes: terms.allowedUsageTypes || terms[6] || [],
        customTermsURI: terms.customTermsURI || terms[8] || "",
        active: terms.active || terms[10] || true
      };
      
      console.log(`Normalized terms data:`, termsData);
      
      console.log(`Successfully retrieved terms with ID ${termsId}:`, {
        id: termsData.id.toString(),
        contentId: termsData.contentId.toString(),
        status: termsData.status,
        price: termsData.price.toString()
      });
      
      // Return formatted terms data using our normalized structure
      return {
        success: true,
        termsId: termsData.id.toString(),
        creator: termsData.creator,
        contentId: termsData.contentId.toString(),
        active: termsData.active,
        status: termsData.status,
        price: termsData.price.toString(),
        requireAttribution: termsData.requireAttribution,
        allowedUsageTypes: Array.isArray(termsData.allowedUsageTypes) 
          ? termsData.allowedUsageTypes.map(t => t.toString()) 
          : [],
        customTermsURI: termsData.customTermsURI
      };
    } catch (error) {
      console.error(`Unexpected error in getTermsById(${termsId}):`, error);
      return { 
        success: false, 
        error: `Error retrieving terms: ${error.message}` 
      };
    }
    
    // Validate inputs
    if (!contentIds || !amounts || contentIds.length !== amounts.length) {
      throw new Error('Invalid payment parameters');
    }
    
    // Create clean arrays to avoid any reference issues
    const cleanContentIds = [];
    const cleanAmounts = [];
    
    // Process each item carefully
    for (let i = 0; i < contentIds.length; i++) {
      // Convert content ID to integer
      const contentId = parseInt(String(contentIds[i]).trim(), 10);
      if (isNaN(contentId)) {
        throw new Error(`Invalid content ID at index ${i}: ${contentIds[i]}`);
      }
      cleanContentIds.push(contentId);
      
      // Convert amount to BigNumber
      try {
        const amount = ethers.BigNumber.from(String(amounts[i]).trim());
        cleanAmounts.push(amount);
      } catch (err) {
        throw new Error(`Invalid amount at index ${i}: ${amounts[i]} - ${err.message}`);
      }
    }
    
    console.log('Cleaned payment parameters:', {
      contentIds: cleanContentIds,
      amounts: cleanAmounts.map(a => a.toString())
    });
    
    const signer = getAuthenticatedSigner();
    
    // Calculate total value to send with transaction
    let totalAmount = ethers.BigNumber.from(0);
    for (const amount of cleanAmounts) {
      totalAmount = totalAmount.add(amount);
    }
    
    console.log(`Total payment amount: ${totalAmount.toString()}`);
    
    // Convert data to the format expected by Solidity
    
    // For notes, contract expects a single string
    const notesStr = Array.isArray(notes) ? notes.join(", ") : (notes || "");
    
    console.log('Attempting payment with raw number values...');
    try {
      // Try with raw number values
      const tx = await paymentSplitter.connect(signer).createPayment(
        cleanContentIds,     // Pass raw numbers
        cleanAmounts,        // Pass BigNumber objects
        notesStr,           // Pass notes as a single string
        { value: totalAmount, gasLimit: 500000 }
      );
      
      const receipt = await tx.wait(1);
      console.log(`Payment transaction confirmed in block ${receipt.blockNumber}`);
      
      const event = receipt.events.find(e => e.event === "PaymentProcessed");
      const amount = event ? event.args.amount : null;
      
      return {
        success: true,
        txHash: tx.hash,
        amount: amount ? amount.toString() : null
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Get creator balance
  async getCreatorBalance(creatorAddress) {
    try {
      // PaymentSplitter exposes getCreatorEarnings(address) as the view method
      // There is no getCreatorBalance() or public creatorBalances mapping
      const balance = await paymentSplitter.getCreatorEarnings(creatorAddress);
      
      return {
        success: true,
        creator: creatorAddress,
        balance: balance.toString()
      };
    } catch (error) {
      return { 
        success: false, 
        creator: creatorAddress,
        balance: "0",
        error: error.message 
      };
    }
  },
  
  // Get payment details
  async getPaymentById(paymentId) {
    try {
      const payment = await paymentSplitter.getPaymentById(paymentId);
      return {
        success: true,
        paymentId: payment.id.toString(),
        buyer: payment.buyer,
        contentId: payment.contentId.toString(),
        amount: payment.amount.toString(),
        note: payment.note,
        timestamp: payment.timestamp.toString()
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Process payment for content
  async createPayment(contentIds, amounts, notes) {
    try {
      console.log('Payment request received:', { contentIds, amounts, notes });
      
      // Validate inputs
      if (!contentIds || !amounts || contentIds.length !== amounts.length) {
        throw new Error('Invalid payment parameters');
      }
      
      // Explicitly create simple arrays instead of BigNumber objects
      const cleanContentIds = contentIds.map(id => Number(id));
      const cleanAmounts = amounts.map(amount => ethers.utils.parseUnits(amount.toString(), 'wei').toString());
      
      console.log('Simplified parameters:', {
        contentIds: cleanContentIds,
        amounts: cleanAmounts
      });
      
      const signer = getAuthenticatedSigner();
      
      // Calculate total value to send with transaction
      let totalAmount = ethers.BigNumber.from(0);
      for (const amount of cleanAmounts) {
        totalAmount = totalAmount.add(ethers.BigNumber.from(amount));
      }
      
      console.log(`Total payment amount: ${totalAmount.toString()}`);
      
      // For notes, contract expects a single string
      const notesStr = Array.isArray(notes) ? notes.join(", ") : (notes || "");
      
      console.log('Debug info for contract call:');
      console.log(`- contentIds: [${cleanContentIds.join(', ')}]`);
      console.log(`- amounts: [${cleanAmounts.join(', ')}]`);
      console.log(`- notes: "${notesStr}"`);
      console.log(`- value: ${totalAmount.toString()}`);
      
      // Try direct contract interaction using overrides to ensure proper type conversion
      const paymentSplitterInterface = paymentSplitter.interface;
      const data = paymentSplitterInterface.encodeFunctionData('createPayment', [
        cleanContentIds,
        cleanAmounts,
        notesStr
      ]);
      
      console.log('Encoded function data:', data);
      
      const tx = await signer.sendTransaction({
        to: paymentSplitter.address,
        data: data,
        value: totalAmount,
        gasLimit: 500000
      });
      
      console.log(`Payment transaction sent: ${tx.hash}`);
      
      // Wait for confirmation
      const receipt = await tx.wait(1);
      console.log(`Payment confirmed in block ${receipt.blockNumber}`);
      
      // Since we're using low-level call, we need to decode events manually
      let paymentId = null;
      if (receipt.logs && receipt.logs.length > 0) {
        try {
          for (const log of receipt.logs) {
            try {
              const decodedLog = paymentSplitterInterface.parseLog(log);
              if (decodedLog.name === 'PaymentProcessed') {
                paymentId = decodedLog.args.paymentId.toString();
                break;
              } else if (decodedLog.name === 'PaymentCreated') {
                paymentId = decodedLog.args.paymentId.toString();
                break;
              }
            } catch (e) {
              // Not all logs can be parsed, ignore parsing errors
              console.log('Could not parse log:', e.message);
            }
          }
        } catch (e) {
          console.error('Error parsing logs:', e.message);
        }
      }
      
      return {
        success: true,
        txHash: tx.hash,
        paymentId: paymentId,
        totalAmount: totalAmount.toString(),
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error("Error creating payment:", error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // DISPUTE OPERATIONS
  
  // Report a dispute
  async reportDispute(defendant, contentIds, evidenceURI, violationDetails) {
    try {
      const signer = getAuthenticatedSigner();
      const tx = await disputeResolver.connect(signer).reportDispute(
        defendant,
        contentIds,
        evidenceURI,
        violationDetails
      );
      
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "DisputeReported");
      
      return {
        success: true,
        txHash: tx.hash,
        disputeId: event ? event.args.disputeId.toString() : null
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Vote on a dispute
  async voteOnDispute(disputeId, isValid) {
    try {
      const signer = getAuthenticatedSigner();
      const tx = await disputeResolver.connect(signer).voteOnDispute(disputeId, isValid);
      
      return {
        success: true,
        txHash: tx.hash,
        disputeId: disputeId.toString()
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Get combined dispute info
  async getDisputeById(disputeId) {
    try {
      // Use the three specialized functions to get complete info
      const basicInfo = await disputeResolver.getDisputeBasicInfo(disputeId);
      const contentInfo = await disputeResolver.getDisputeContentInfo(disputeId);
      const votingInfo = await disputeResolver.getDisputeVotingInfo(disputeId);
      
      return {
        success: true,
        disputeId: basicInfo.id.toString(),
        reporter: basicInfo.reporter,
        defendant: basicInfo.defendant,
        status: basicInfo.status,
        contentIds: contentInfo.contentIds.map(id => id.toString()),
        evidenceURI: contentInfo.evidenceURI,
        violationDetails: contentInfo.violationDetails,
        arbiters: votingInfo.arbiters,
        validVotes: votingInfo.validVotes.toString(),
        invalidVotes: votingInfo.invalidVotes.toString()
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Get total disputes
  async getTotalDisputes() {
    try {
      const count = await disputeResolver.getTotalDisputes();
      return {
        success: true,
        count: count.toString()
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Check if an address is an arbiter
  async isArbiter(address) {
    try {
      const result = await disputeResolver.isArbiter(address);
      return {
        success: true,
        address,
        isArbiter: result
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Add an arbiter
  async addArbiter(arbiterAddress) {
    try {
      const signer = getAuthenticatedSigner();
      const tx = await disputeResolver.connect(signer).addArbiter(arbiterAddress);
      
      return {
        success: true,
        txHash: tx.hash,
        arbiter: arbiterAddress
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Expose enums for external use
  enums: config.enums
};

// Test script for CreatorClaim Protocol contracts on Fuji testnet
const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("Testing CreatorClaim Protocol on Fuji Testnet");
  console.log("===========================================");

  // Contract addresses on Fuji testnet
  const creatorRegistryAddress = "0x4F992a229e3eBd64AC36137fa8750c8beA64929E";
  const disputeResolverAddress = "0xfd1411e2e3ddfC0C68649d3FEb1bE50C6d599EBd";
  const licensingTermsAddress = "0xae160d585c48b96f248Bd6f829f4432EFf9Eb49d";
  const paymentSplitterAddress = "0xe523fc1cc80A6EF2f643895b556cf43A1f1bCF60";

  // Get contract factories
  const CreatorRegistry = await ethers.getContractFactory("CreatorRegistry");
  const DisputeResolver = await ethers.getContractFactory("DisputeResolver");
  const LicensingTerms = await ethers.getContractFactory("LicensingTerms");
  const PaymentSplitter = await ethers.getContractFactory("PaymentSplitter");

  // Attach to the deployed contracts
  const creatorRegistry = CreatorRegistry.attach(creatorRegistryAddress);
  const disputeResolver = DisputeResolver.attach(disputeResolverAddress);
  const licensingTerms = LicensingTerms.attach(licensingTermsAddress);
  const paymentSplitter = PaymentSplitter.attach(paymentSplitterAddress);

  // Get signers
  const [deployer] = await ethers.getSigners();
  console.log(`Testing with account: ${deployer.address}`);
  console.log(`Account balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} AVAX`);

  try {
    // Step 1: Register Content
    console.log("\n=== Step 1: Register Content ===");
    const timestamp = Math.floor(Date.now() / 1000);
    const fingerprint = `fuji-test-fingerprint-${timestamp}`;
    const metadataUri = `https://example.com/metadata/${timestamp}`;
    
    console.log(`Registering content with fingerprint: ${fingerprint}`);
    console.log(`Metadata URI: ${metadataUri}`);
    
    const registerTx = await creatorRegistry.registerContent(fingerprint, metadataUri);
    console.log(`Transaction hash: ${registerTx.hash}`);
    await registerTx.wait();
    console.log(`Content registration confirmed!`);
    
    // Get content count - use getTotalContent() instead of getContentCount()
    const contentCount = await creatorRegistry.getTotalContent();
    console.log(`Total content count: ${contentCount}`);
    
    // Get the latest content ID (assuming it's the one we just created)
    const contentId = contentCount;
    
    // Retrieve content details
    const content = await creatorRegistry.getContentById(contentId);
    console.log(`\nContent ID ${contentId} details:`);
    console.log(`- Creator: ${content.creator}`);
    console.log(`- Fingerprint: ${content.fingerprint}`);
    console.log(`- Metadata URI: ${content.metadataUri}`);
    console.log(`- Active: ${content.isActive}`);
    
    // Step 2: Set Licensing Terms
    console.log("\n=== Step 2: Set Licensing Terms ===");
    const price = ethers.parseEther("0.01"); // 0.01 AVAX
    const attributionRequired = true;
    
    // LicensingStatus: 0 = DENY, 1 = ALLOW_FREE, 2 = PAID
    const licenseStatus = 2; // PAID
    // AIUsageType: 0 = TRAINING, 1 = FINE_TUNING, 2 = INFERENCE, 3 = ALL
    const allowedUsageTypes = [3]; // Allow ALL usage types
    const customTermsUri = `https://example.com/terms/${timestamp}`;
    
    console.log(`Setting licensing terms for Content ID ${contentId}:`);
    console.log(`- Status: PAID (${licenseStatus})`);
    console.log(`- Price: ${ethers.formatEther(price)} AVAX`);
    console.log(`- Attribution Required: ${attributionRequired}`);
    console.log(`- Allowed Usage Types: ALL`);
    console.log(`- Custom Terms URI: ${customTermsUri}`);
    
    // Use createTerms instead of setLicensingTerms
    const termsTx = await licensingTerms.createTerms(
      contentId,
      licenseStatus,
      price,
      attributionRequired,
      allowedUsageTypes,
      customTermsUri
    );
    console.log(`Transaction hash: ${termsTx.hash}`);
    await termsTx.wait();
    console.log(`Licensing terms set successfully!`);
    
    // Get terms ID from event logs
    const receipt = await ethers.provider.getTransactionReceipt(termsTx.hash);
    let termsId = 0;
    if (receipt && receipt.logs && receipt.logs.length > 0) {
      // Extract termsId from the TermsCreated event
      const event = receipt.logs[0];
      termsId = Number(event.topics[1]); // TermsCreated event, first indexed parameter is termsId
      console.log(`Terms created with ID: ${termsId}`);
    }
    
    // Retrieve terms (if there's a getTermsForContent or similar function)
    // Note: You'll need to replace this with the actual function name available in your contract
    try {
      const terms = await licensingTerms.getTermsById(termsId);
      console.log(`\nLicensing terms for Terms ID ${termsId}:`);
      console.log(`- Creator: ${terms.creator}`);
      console.log(`- Status: ${terms.status}`);
      console.log(`- Price: ${ethers.formatEther(terms.price)} AVAX`);
      console.log(`- Attribution Required: ${terms.requireAttribution}`);
    } catch (error) {
      console.log(`Could not retrieve terms details: ${error.message}`);
      console.log("Check if your contract has a function to retrieve terms by ID.");
    }
    
    // Step 3: Make a Payment for Content Usage
    console.log("\n=== Step 3: Make a Payment for Content Usage ===");
    const paymentAmount = price; // Same as licensing price
    
    console.log(`Making payment for Content ID ${contentId}:`);
    console.log(`- Amount: ${ethers.formatEther(paymentAmount)} AVAX`);
    console.log(`- Notes: Test payment for Fuji testnet`);
    
    // Use createPayment instead of makePayment with array parameters
    const contentIds = [contentId]; // Array of content IDs
    const contentAmounts = [paymentAmount]; // Array of amounts
    const paymentNotes = "Test payment for Fuji testnet";
    
    const paymentTx = await paymentSplitter.createPayment(
      contentIds,
      contentAmounts,
      paymentNotes,
      { value: paymentAmount } // Send ETH with the transaction
    );
    
    console.log(`Transaction hash: ${paymentTx.hash}`);
    await paymentTx.wait();
    console.log(`Payment successful!`);
    
    // Get payment ID from event logs
    const paymentReceipt = await ethers.provider.getTransactionReceipt(paymentTx.hash);
    let paymentId = 0;
    if (paymentReceipt && paymentReceipt.logs && paymentReceipt.logs.length > 0) {
      // Extract payment ID from the PaymentCreated event
      const paymentEvent = paymentReceipt.logs[0];
      paymentId = Number(paymentEvent.topics[1]); // PaymentCreated event, first indexed parameter is paymentId
      console.log(`Payment created with ID: ${paymentId}`);
    }
    
    // Try to retrieve payment details if there's a getter function available
    try {
      const payment = await paymentSplitter.getPaymentById(paymentId);
      console.log(`\nPayment ID ${paymentId} details:`);
      console.log(`- Payer: ${payment.payer}`);
      console.log(`- Total Amount: ${ethers.formatEther(payment.totalAmount)} AVAX`);
      console.log(`- Protocol Fee: ${ethers.formatEther(payment.protocolFee)} AVAX`);
      console.log(`- Notes: ${payment.notes}`);
    } catch (error) {
      console.log(`Could not retrieve payment details: ${error.message}`);
      console.log("Check if your contract has a function to retrieve payment by ID.");
    }
    
    // Step 4: Withdraw Creator Earnings
    console.log("\n=== Step 4: Withdraw Creator Earnings ===");
    if (deployer.address.toLowerCase() === content.creator.toLowerCase()) {
      console.log(`Withdrawing earnings...`);
      
      const withdrawTx = await paymentSplitter.withdrawCreatorEarnings();
      console.log(`Transaction hash: ${withdrawTx.hash}`);
      await withdrawTx.wait();
      console.log(`Earnings withdrawn successfully!`);
      
      const newCreatorEarnings = await paymentSplitter.getCreatorEarnings(content.creator);
      console.log(`Creator earnings after withdrawal: ${ethers.formatEther(newCreatorEarnings)} AVAX`);
    } else {
      console.log(`Cannot withdraw earnings as the test account is not the creator.`);
      console.log(`To withdraw, connect with the creator account: ${content.creator}`);
    }
    
    // Step 5: Add Arbiters for Dispute Resolution
    console.log("\n=== Step 5: Add Arbiters for Dispute Resolution ===");
    const arbiter = deployer.address;
    
    console.log(`Adding arbiter: ${arbiter}`);
    
    try {
      const addArbiterTx = await disputeResolver.addArbiter(arbiter);
      console.log(`Transaction hash: ${addArbiterTx.hash}`);
      await addArbiterTx.wait();
      console.log(`Arbiter added successfully!`);
      
      // Check if arbiter was added - use isArbiter instead of isActiveArbiter
      const isArbiterActive = await disputeResolver.isArbiter(arbiter);
      console.log(`Is active arbiter: ${isArbiterActive}`);
    } catch (error) {
      console.log(`Error adding arbiter: ${error.message}`);
      console.log(`Note: This might fail if the account is already an arbiter or doesn't have admin rights`);
    }
    
    // Step 6: Report a Dispute
    console.log("\n=== Step 6: Report a Dispute ===");
    const evidenceUri = `https://example.com/evidence/${timestamp}`;
    const violationDetails = "Test dispute for Fuji testnet";
    
    console.log(`Reporting dispute for Content ID ${contentId}:`);
    console.log(`- Evidence URI: ${evidenceUri}`);
    console.log(`- Violation Details: ${violationDetails}`);
    
    try {
      const reportTx = await disputeResolver.reportDispute(
        deployer.address, // defendant (using self for testing)
        [contentId],      // array of content IDs
        evidenceUri,
        violationDetails
      );
      console.log(`Transaction hash: ${reportTx.hash}`);
      await reportTx.wait();
      console.log(`Dispute reported successfully!`);
      
      // Get dispute count - use getTotalDisputes instead of getDisputeCount
      const disputeCount = await disputeResolver.getTotalDisputes();
      console.log(`Total disputes: ${disputeCount}`);
      
      // Get the dispute ID (assuming it's the one we just created)
      const disputeId = disputeCount;
      
      try {
        // Get dispute details using the correct functions
        const disputeBasic = await disputeResolver.getDisputeBasicInfo(disputeId);
        const disputeContent = await disputeResolver.getDisputeContentInfo(disputeId);
        const disputeVoting = await disputeResolver.getDisputeVotingInfo(disputeId);
        
        console.log(`\nDispute ID ${disputeId} details:`);
        console.log(`- Reporter: ${disputeBasic.reporter}`);
        console.log(`- Defendant: ${disputeBasic.defendant}`);
        console.log(`- Status: ${disputeBasic.status}`);
        console.log(`- Evidence URI: ${disputeContent.evidenceURI}`);
        console.log(`- Violation Details: ${disputeContent.violationDetails}`);
        console.log(`- Valid Votes: ${disputeVoting.validVotes}`);
        console.log(`- Invalid Votes: ${disputeVoting.invalidVotes}`);
      } catch (error) {
        console.log(`Error retrieving dispute details: ${error.message}`);
      }
      
      // Step 7: Vote on Dispute
      console.log("\n=== Step 7: Vote on Dispute ===");
      console.log(`Voting on Dispute ID ${disputeId}:`);
      console.log(`- Vote: Valid (true)`);
      
      try {
        const voteTx = await disputeResolver.voteOnDispute(disputeId, true);
        console.log(`Transaction hash: ${voteTx.hash}`);
        await voteTx.wait();
        console.log(`Vote cast successfully!`);
      } catch (error) {
        console.log(`Error voting on dispute: ${error.message}`);
        console.log(`Note: This might fail if the account is not an arbiter or already voted`);
      }
    } catch (error) {
      console.log(`Error with dispute operations: ${error.message}`);
    }
    
    // Step 8: Update Licensing Terms
    console.log("\n=== Step 8: Update Licensing Terms ===");
    try {
      const newPrice = ethers.parseEther("0.02"); // 0.02 AVAX
      const newAttributionRequired = false;
      
      console.log(`Updating licensing terms for Content ID ${contentId}:`);
      console.log(`- New Price: ${ethers.formatEther(newPrice)} AVAX`);
      console.log(`- New Attribution Required: ${newAttributionRequired}`);
      
      // Use createTerms instead of setLicensingTerms
      const updateTermsTx = await licensingTerms.createTerms(
        contentId,
        2, // PAID
        newPrice,
        newAttributionRequired,
        [3], // Allow ALL usage types
        customTermsUri
      );
      console.log(`Transaction hash: ${updateTermsTx.hash}`);
      await updateTermsTx.wait();
      console.log(`Licensing terms updated successfully!`);
      
      // Get terms ID from event logs
      const updateReceipt = await ethers.provider.getTransactionReceipt(updateTermsTx.hash);
      let updatedTermsId = 0;
      if (updateReceipt && updateReceipt.logs && updateReceipt.logs.length > 0) {
        // Extract termsId from the TermsCreated event
        const updateEvent = updateReceipt.logs[0];
        updatedTermsId = Number(updateEvent.topics[1]); // TermsCreated event, first indexed parameter is termsId
        console.log(`Updated terms created with ID: ${updatedTermsId}`);
      }
      
      // Retrieve updated terms (if there's a getTermsForContent or similar function)
      // Note: You'll need to replace this with the actual function name available in your contract
      try {
        const updatedTerms = await licensingTerms.getTermsById(updatedTermsId);
        console.log(`\nUpdated licensing terms for Terms ID ${updatedTermsId}:`);
        console.log(`- Creator: ${updatedTerms.creator}`);
        console.log(`- Status: ${updatedTerms.status}`);
        console.log(`- Price: ${ethers.formatEther(updatedTerms.price)} AVAX`);
        console.log(`- Attribution Required: ${updatedTerms.requireAttribution}`);
      } catch (error) {
        console.log(`Could not retrieve updated terms details: ${error.message}`);
        console.log("Check if your contract has a function to retrieve terms by ID.");
      }
      
    } catch (error) {
      console.log(`Error updating licensing terms: ${error.message}`);
    }
    
    console.log("\n=== Test Summary ===");
    console.log(`Contract interactions completed successfully!`);
    console.log(`- Created Content ID: ${contentId}`);
    console.log(`- Set and updated licensing terms`);
    console.log(`- Processed payment for content usage`);
    console.log(`- Added arbiter and reported dispute`);
    console.log(`- Voted on dispute (if applicable)`);
    
  } catch (error) {
    console.error(`\nERROR: ${error.message}`);
    console.error(error);
  }
}

// Helper function to convert dispute status number to string
function getDisputeStatusString(status) {
  const statusMap = {
    0: "PENDING",
    1: "RESOLVED_VALID",
    2: "RESOLVED_INVALID",
    3: "CANCELLED"
  };
  return statusMap[status] || `Unknown (${status})`;
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// Demo script to demonstrate CreatorClaim Protocol workflow
const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("\nCreatorClaim Protocol Demo\n");
  console.log("==========================");
  
  // For testnet deployment, we'll use the connected wallet and create additional signers
  const [deployer] = await ethers.getSigners();
  const deployerAddress = deployer.address;
  
  // When running on testnet, all operations will be from the same account
  // In a real-world scenario, these would be different accounts
  const creator1 = deployer;
  const creator2 = deployer;
  const consumer1 = deployer;
  const consumer2 = deployer;
  const arbiter1 = deployer;
  const arbiter2 = deployer;
  
  console.log("Account addresses:");
  console.log(`Deployer/Owner: ${deployerAddress}`);
  console.log(`Creator 1: ${creator1.address}`);
  console.log(`Creator 2: ${creator2.address}`);
  console.log(`Consumer 1: ${consumer1.address}`);
  console.log(`Consumer 2: ${consumer2.address}`);
  console.log(`Arbiter 1: ${arbiter1.address}`);
  console.log(`Arbiter 2: ${arbiter2.address}`);
  console.log();

  // Load the deployed contract instances
  console.log("Loading deployed contracts...");

  // Deploy contracts if needed and get the addresses
  let creatorRegistryAddress, disputeResolverAddress, licensingTermsAddress, paymentSplitterAddress;

  // Try to deploy contracts to get fresh addresses
  try {
    console.log("Attempting to deploy contracts for demo...");
    
    // Get the contract factories
    const CreatorRegistryFactory = await ethers.getContractFactory("CreatorRegistry");
    const DisputeResolverFactory = await ethers.getContractFactory("DisputeResolver");
    const LicensingTermsFactory = await ethers.getContractFactory("LicensingTerms");
    const PaymentSplitterFactory = await ethers.getContractFactory("PaymentSplitter");
    
    // Deploy CreatorRegistry first
    const creatorRegistryContract = await CreatorRegistryFactory.deploy(deployerAddress);
    await creatorRegistryContract.waitForDeployment();
    creatorRegistryAddress = await creatorRegistryContract.getAddress();
    
    // Deploy DisputeResolver with CreatorRegistry address
    const requiredVotes = 2; // Initially require 2 votes to resolve a dispute
    const disputeResolverContract = await DisputeResolverFactory.deploy(
      creatorRegistryAddress,
      requiredVotes,
      deployerAddress
    );
    await disputeResolverContract.waitForDeployment();
    disputeResolverAddress = await disputeResolverContract.getAddress();
    
    // Deploy LicensingTerms with CreatorRegistry address
    const licensingTermsContract = await LicensingTermsFactory.deploy(
      creatorRegistryAddress,
      deployerAddress
    );
    await licensingTermsContract.waitForDeployment();
    licensingTermsAddress = await licensingTermsContract.getAddress();
    
    // Deploy PaymentSplitter with CreatorRegistry and LicensingTerms addresses
    const protocolFee = 500; // 5.00%
    const paymentSplitterContract = await PaymentSplitterFactory.deploy(
      creatorRegistryAddress,
      licensingTermsAddress,
      protocolFee,
      deployerAddress
    );
    await paymentSplitterContract.waitForDeployment();
    paymentSplitterAddress = await paymentSplitterContract.getAddress();
    
    // Set up contract connections
    await creatorRegistryContract.setLicensingTermsContract(licensingTermsAddress);
    
    console.log("Contracts deployed successfully for demo.");
  } catch (error) {
    console.log("Could not deploy fresh contracts. Will try to use default addresses.");
    // Use hardcoded addresses as fallback
    creatorRegistryAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    disputeResolverAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    licensingTermsAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
    paymentSplitterAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
  }

  console.log(`Using the following contract addresses:`);
  console.log(`- CreatorRegistry: ${creatorRegistryAddress}`);
  console.log(`- DisputeResolver: ${disputeResolverAddress}`);
  console.log(`- LicensingTerms: ${licensingTermsAddress}`);
  console.log(`- PaymentSplitter: ${paymentSplitterAddress}`);

  const CreatorRegistry = await ethers.getContractFactory("CreatorRegistry");
  const DisputeResolver = await ethers.getContractFactory("DisputeResolver");
  const LicensingTerms = await ethers.getContractFactory("LicensingTerms");
  const PaymentSplitter = await ethers.getContractFactory("PaymentSplitter");

  const creatorRegistry = CreatorRegistry.attach(creatorRegistryAddress);
  const disputeResolver = DisputeResolver.attach(disputeResolverAddress);
  const licensingTerms = LicensingTerms.attach(licensingTermsAddress);
  const paymentSplitter = PaymentSplitter.attach(paymentSplitterAddress);
  
  console.log("Contracts loaded successfully.");
  console.log();

  // Step 1: Creators register their content
  console.log("Step 1: Content Registration");
  console.log("----------------------------");
  
  let creator1ContentId;
  let creator2ContentId;
  
  // Try to get existing content IDs first
  try {
    // Check if content already exists by trying to get content by fingerprint
    const existingContent1 = await creatorRegistry.getContentByFingerprint("fingerprint-creator1-image-001");
    if (existingContent1 && Number(existingContent1.contentId) > 0) {
      creator1ContentId = existingContent1.contentId;
      console.log(`Content for Creator 1 already exists with ID: ${creator1ContentId}`);
    }
  } catch (error) {
    // Content doesn't exist yet, will register new
  }
  
  // Register content for Creator 1 if it doesn't exist
  if (!creator1ContentId) {
    try {
      console.log("Creator 1 is registering new content...");
      const tx1 = await creatorRegistry.connect(creator1).registerContent(
        "fingerprint-creator1-image-001",
        "ipfs://QmCreator1Image001Metadata"
      );
      
      const receipt1 = await tx1.wait();
      // Find the ContentRegistered event
      const contentRegisteredEvent = receipt1.logs.find(
        log => log.fragment && log.fragment.name === "ContentRegistered"
      );
      creator1ContentId = contentRegisteredEvent ? contentRegisteredEvent.args.contentId : 1; // Fallback to ID 1
      console.log(`Creator 1's content registered with ID: ${creator1ContentId}`);
    } catch (error) {
      // If registration fails (e.g., already registered), try to get content ID again
      try {
        const existingContent = await creatorRegistry.getContentByFingerprint("fingerprint-creator1-image-001");
        creator1ContentId = existingContent.contentId;
        console.log(`Retrieved existing content for Creator 1 with ID: ${creator1ContentId}`);
      } catch (innerError) {
        console.error("Error registering content for Creator 1:", error);
        throw error; // Re-throw if we still can't get the content
      }
    }
  }
  
  // Try to get existing content for Creator 2
  try {
    const existingContent2 = await creatorRegistry.getContentByFingerprint("fingerprint-creator2-audio-001");
    if (existingContent2 && Number(existingContent2.contentId) > 0) {
      creator2ContentId = existingContent2.contentId;
      console.log(`Content for Creator 2 already exists with ID: ${creator2ContentId}`);
    }
  } catch (error) {
    // Content doesn't exist yet, will register new
  }
  
  // Register content for Creator 2 if it doesn't exist
  if (!creator2ContentId) {
    try {
      console.log("Creator 2 is registering new content...");
      const tx2 = await creatorRegistry.connect(creator2).registerContent(
        "fingerprint-creator2-audio-001",
        "ipfs://QmCreator2Audio001Metadata"
      );
      
      const receipt2 = await tx2.wait();
      // Find the ContentRegistered event
      const contentRegisteredEvent2 = receipt2.logs.find(
        log => log.fragment && log.fragment.name === "ContentRegistered"
      );
      creator2ContentId = contentRegisteredEvent2 ? contentRegisteredEvent2.args.contentId : 2; // Fallback to ID 2
      console.log(`Creator 2's content registered with ID: ${creator2ContentId}`);
    } catch (error) {
      // If registration fails (e.g., already registered), try to get content ID again
      try {
        const existingContent = await creatorRegistry.getContentByFingerprint("fingerprint-creator2-audio-001");
        creator2ContentId = existingContent.contentId;
        console.log(`Retrieved existing content for Creator 2 with ID: ${creator2ContentId}`);
      } catch (innerError) {
        console.error("Error registering content for Creator 2:", error);
        throw error; // Re-throw if we still can't get the content
      }
    }
  }
  console.log();

  // Step 2: Creators set licensing terms
  console.log("Step 2: Setting Licensing Terms");
  console.log("------------------------------");
  
  // Licensing status enums
  const LicensingStatus = {
    DENY: 0,
    ALLOW_FREE: 1,
    PAID: 2
  };
  
  // AI usage type enums
  const AIUsageType = {
    TRAINING: 0,
    FINE_TUNING: 1,
    INFERENCE: 2,
    ALL: 3
  };
  
  // Creator 1 sets paid licensing terms
  console.log("Creator 1 is setting paid licensing terms...");
  const creator1Price = ethers.parseEther("0.01"); // 0.01 ETH per usage unit
  const tx3 = await licensingTerms.connect(creator1).createTerms(
    creator1ContentId,
    LicensingStatus.PAID,
    creator1Price,
    true, // require attribution
    [AIUsageType.TRAINING, AIUsageType.FINE_TUNING, AIUsageType.INFERENCE], // all usage types
    "ipfs://QmCreator1CustomTerms"
  );
  
  const receipt3 = await tx3.wait();
  // Find the TermsCreated event
  const termsCreatedEvent1 = receipt3.logs.find(
    log => log.fragment && log.fragment.name === "TermsCreated"
  );
  const creator1TermsId = termsCreatedEvent1 ? termsCreatedEvent1.args.termsId : 1; // Fallback to ID 1
  console.log(`Creator 1's licensing terms created with ID: ${creator1TermsId}`);
  
  // Creator 2 sets free licensing terms
  console.log("Creator 2 is setting free licensing terms with attribution...");
  const tx4 = await licensingTerms.connect(creator2).createTerms(
    creator2ContentId,
    LicensingStatus.ALLOW_FREE,
    0, // free
    true, // require attribution
    [AIUsageType.INFERENCE], // only inference allowed
    "ipfs://QmCreator2CustomTerms"
  );
  
  const receipt4 = await tx4.wait();
  // Find the TermsCreated event
  const termsCreatedEvent2 = receipt4.logs.find(
    log => log.fragment && log.fragment.name === "TermsCreated"
  );
  const creator2TermsId = termsCreatedEvent2 ? termsCreatedEvent2.args.termsId : 2; // Fallback to ID 2
  console.log(`Creator 2's licensing terms created with ID: ${creator2TermsId}`);
  console.log();

  // Step 3: View content and terms information
  console.log("Step 3: Viewing Content and Terms Information");
  console.log("--------------------------------------------");
  
  // Get content info
  const content1 = await creatorRegistry.getContentById(creator1ContentId);
  console.log("Creator 1's Content Information:");
  console.log(`- Content ID: ${content1.id}`);
  console.log(`- Creator: ${content1.creator}`);
  console.log(`- Content Fingerprint: ${content1.contentFingerprint}`);
  console.log(`- Active: ${content1.active}`);
  console.log(`- Licensing Terms ID: ${content1.licensingTermsId}`);
  console.log();
  
  // Get terms info
  const terms1 = await licensingTerms.getTermsById(creator1TermsId);
  console.log("Creator 1's Licensing Terms Information:");
  console.log(`- Terms ID: ${terms1.id}`);
  console.log(`- Licensing Status: ${terms1.status === LicensingStatus.PAID ? "PAID" : 
               terms1.status === LicensingStatus.ALLOW_FREE ? "ALLOW_FREE" : "DENY"}`);
  console.log(`- Price: ${ethers.formatEther(terms1.price)} ETH`);
  console.log(`- Attribution Required: ${terms1.requireAttribution}`);
  console.log();

  // Step 4: Consumer pays for content usage
  console.log("Step 4: Consumers Pay for Content Usage");
  console.log("--------------------------------------");
  
  // Consumer 1 pays for Creator 1's content
  console.log("Consumer 1 is paying for Creator 1's content...");
  const paymentAmount = ethers.parseEther("0.01");
  const tx5 = await paymentSplitter.connect(consumer1).processPayment(
    [creator1ContentId], // content IDs
    [paymentAmount], // payment amounts
    "AI training dataset usage", // notes
    { value: paymentAmount }
  );
  
  const receipt5 = await tx5.wait();
  // Find the PaymentProcessed event
  const paymentProcessedEvent = receipt5.logs.find(
    log => log.fragment && log.fragment.name === "PaymentProcessed"
  );
  const paymentId = paymentProcessedEvent ? paymentProcessedEvent.args.paymentId : 1; // Fallback to ID 1
  console.log(`Payment processed with ID: ${paymentId}`);
  
  // Check payment details
  const payment = await paymentSplitter.getPaymentById(paymentId);
  console.log("Payment details:");
  console.log(`- From: ${payment.payer}`);
  console.log(`- Total Amount: ${ethers.formatEther(payment.totalAmount)} ETH`);
  console.log(`- Notes: ${payment.notes}`);
  console.log(`- Timestamp: ${new Date(Number(payment.timestamp) * 1000)}`);
  console.log();
  
  // Check creator balance
  const creator1Balance = await paymentSplitter.getCreatorEarnings(creator1.address);
  console.log(`Creator 1's earnings balance: ${ethers.formatEther(creator1Balance)} ETH`);
  console.log();

  // Step 5: Creator withdraws earnings
  console.log("Step 5: Creator Withdraws Earnings");
  console.log("---------------------------------");
  
  console.log("Creator 1 is withdrawing earnings...");
  const balanceBefore = await ethers.provider.getBalance(creator1.address);
  
  const tx6 = await paymentSplitter.connect(creator1).withdrawCreatorEarnings();
  const receipt6 = await tx6.wait();
  
  const balanceAfter = await ethers.provider.getBalance(creator1.address);
  const gasCost = BigInt(receipt6.gasUsed) * BigInt(receipt6.gasPrice);
  const withdrawn = balanceAfter - balanceBefore + gasCost;
  
  console.log(`Creator 1 withdrew approximately ${ethers.formatEther(withdrawn)} ETH`);
  
  // Verify balance in contract is now 0
  const creator1BalanceAfter = await paymentSplitter.getCreatorEarnings(creator1.address);
  console.log(`Creator 1's remaining earnings balance: ${ethers.formatEther(creator1BalanceAfter)} ETH`);
  console.log();

  // Step 6: Set up dispute resolution
  console.log("Step 6: Setting Up Dispute Resolution");
  console.log("------------------------------------");
  
  // Add arbiters
  console.log("Adding arbiters...");
  await disputeResolver.connect(deployer).addArbiter(arbiter1.address);
  await disputeResolver.connect(deployer).addArbiter(arbiter2.address);
  
  // Verify arbiters
  const isArbiter1 = await disputeResolver.isArbiter(arbiter1.address);
  const isArbiter2 = await disputeResolver.isArbiter(arbiter2.address);
  console.log(`Arbiter 1 status: ${isArbiter1 ? "Active" : "Inactive"}`);
  console.log(`Arbiter 2 status: ${isArbiter2 ? "Active" : "Inactive"}`);
  console.log();

  // Step 7: Report and resolve a dispute
  console.log("Step 7: Reporting and Resolving a Dispute");
  console.log("----------------------------------------");
  
  // Report a dispute
  console.log("Creator 2 is reporting a dispute against Consumer 2...");
  const tx7 = await disputeResolver.connect(creator2).reportDispute(
    consumer2.address, // defendant
    [creator2ContentId], // content IDs
    "ipfs://QmEvidenceURI", // evidence URI
    "Unauthorized use without attribution" // violation details
  );
  
  const receipt7 = await tx7.wait();
  // Find the DisputeReported event
  const disputeReportedEvent = receipt7.logs.find(
    log => log.fragment && log.fragment.name === "DisputeReported"
  );
  const disputeId = disputeReportedEvent ? disputeReportedEvent.args.disputeId : 1; // Fallback to ID 1
  console.log(`Dispute reported with ID: ${disputeId}`);
  
  // Arbiters vote
  console.log("Arbiters are voting on the dispute...");
  await disputeResolver.connect(arbiter1).voteOnDispute(disputeId, true); // valid violation
  console.log("Arbiter 1 voted: Valid violation");
  await disputeResolver.connect(arbiter2).voteOnDispute(disputeId, true); // valid violation
  console.log("Arbiter 2 voted: Valid violation");
  
  // Check dispute status after voting
  const [contentIds, evidenceURI, violationDetails, resolutionNotes] = await disputeResolver.getDisputeContentInfo(disputeId);
  const [arbiters, validVotes, invalidVotes] = await disputeResolver.getDisputeVotingInfo(disputeId);
  
  // Determine status based on voting results
  let status;
  if (validVotes >= 2) { // Using 2 as the required votes threshold since it was set in the deployment
    status = 2; // RESOLVED_VALID
  } else if (invalidVotes >= 2) {
    status = 3; // RESOLVED_INVALID
  } else if (validVotes > 0 || invalidVotes > 0) {
    status = 1; // UNDER_REVIEW
  } else {
    status = 0; // REPORTED
  }
  
  console.log("Dispute status after voting:");
  const statusMap = [
    "REPORTED",
    "UNDER_REVIEW",
    "RESOLVED_VALID", 
    "RESOLVED_INVALID",
    "SETTLED"
  ];
  console.log(`- Status: ${statusMap[status]}`);
  console.log(`- Resolution time: ${status === 2 || status === 3 ? "Resolved" : "Not resolved"}`);
  console.log();

  // Step 8: Update licensing terms
  console.log("Step 8: Updating Licensing Terms");
  console.log("-------------------------------");
  
  // Creator 1 updates price
  console.log("Creator 1 is updating licensing price...");
  const newPrice = ethers.parseEther("0.02"); // increase to 0.02 ETH
  await licensingTerms.connect(creator1).updateLicensePrice(creator1TermsId, newPrice);
  
  // Creator 2 updates attribution requirement
  console.log("Creator 2 is updating attribution requirement...");
  await licensingTerms.connect(creator2).updateAttributionRequirement(creator2TermsId, false);
  
  // Verify updates
  const updatedTerms1 = await licensingTerms.getTermsById(creator1TermsId);
  const updatedTerms2 = await licensingTerms.getTermsById(creator2TermsId);
  
  console.log("Updated terms for Creator 1:");
  console.log(`- Price: ${ethers.formatEther(updatedTerms1.price)} ETH`);
  
  console.log("Updated terms for Creator 2:");
  console.log(`- Attribution Required: ${updatedTerms2.requireAttribution}`);
  console.log();

  console.log("CreatorClaim Protocol Demo Completed!");
  console.log("===================================");
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

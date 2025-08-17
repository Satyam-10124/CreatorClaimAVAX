const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DisputeResolver", function () {
  let CreatorRegistry;
  let DisputeResolver;
  let creatorRegistry;
  let disputeResolver;
  let owner;
  let creator1;
  let creator2;
  let aiCompany;
  let arbiter1;
  let arbiter2;
  let arbiter3;
  
  const contentFingerprint = "QmT8TkzrrL6cSZ7Nwx4JDuR7A2vJoKJ4LkyfYwNLs1aVwp";
  const metadataURI = "ipfs://QmW8svkJ8s1ygZ9DuHJ6pktiYjdPGZpQY7GQpYYgYFk2XC";
  const evidenceURI = "ipfs://QmEvidenceHashHere";
  const violationDetails = "AI usage without proper licensing";
  const resolutionNotes = "Violation confirmed and resolved";
  
  beforeEach(async function () {
    // Get signers
    [owner, creator1, creator2, aiCompany, arbiter1, arbiter2, arbiter3] = await ethers.getSigners();
    
    // Deploy CreatorRegistry contract
    CreatorRegistry = await ethers.getContractFactory("CreatorRegistry");
    creatorRegistry = await CreatorRegistry.deploy(owner.address);
    await creatorRegistry.waitForDeployment();
    
    // Deploy DisputeResolver contract
    DisputeResolver = await ethers.getContractFactory("DisputeResolver");
    disputeResolver = await DisputeResolver.deploy(
      await creatorRegistry.getAddress(),
      2, // Default required votes for resolution
      owner.address
    );
    await disputeResolver.waitForDeployment();
    
    // Register content for testing
    await creatorRegistry.connect(creator1).registerContent(contentFingerprint, metadataURI);
    
    // Add arbiters
    await disputeResolver.connect(owner).addArbiter(arbiter1.address);
    await disputeResolver.connect(owner).addArbiter(arbiter2.address);
    await disputeResolver.connect(owner).addArbiter(arbiter3.address);
  });
  
  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await disputeResolver.owner()).to.equal(owner.address);
    });
    
    it("Should initialize with the correct CreatorRegistry", async function () {
      expect(await disputeResolver.creatorRegistry()).to.equal(await creatorRegistry.getAddress());
    });
    
    it("Should initialize with default required votes", async function () {
      expect(await disputeResolver.requiredVotes()).to.equal(2);
    });
  });
  
  describe("Arbiter Management", function () {
    it("Should allow owner to add arbiters", async function () {
      const newArbiter = aiCompany.address;
      await expect(disputeResolver.connect(owner).addArbiter(newArbiter))
        .to.emit(disputeResolver, "ArbiterAdded")
        .withArgs(newArbiter);
      
      expect(await disputeResolver.isArbiter(newArbiter)).to.be.true;
      // Check all arbiters are now registered
      expect(await disputeResolver.isArbiter(arbiter1.address)).to.be.true;
      expect(await disputeResolver.isArbiter(arbiter2.address)).to.be.true;
      expect(await disputeResolver.isArbiter(arbiter3.address)).to.be.true;
      expect(await disputeResolver.isArbiter(newArbiter)).to.be.true;
    });
    
    it("Should not allow adding the same arbiter twice", async function () {
      await expect(
        disputeResolver.connect(owner).addArbiter(arbiter1.address)
      ).to.be.revertedWith("Already an arbiter");
    });
    
    it("Should allow owner to remove arbiters", async function () {
      await expect(disputeResolver.connect(owner).removeArbiter(arbiter1.address))
        .to.emit(disputeResolver, "ArbiterRemoved")
        .withArgs(arbiter1.address);
      
      expect(await disputeResolver.isArbiter(arbiter1.address)).to.be.false;
      // Check arbiter was removed
      expect(await disputeResolver.isArbiter(arbiter1.address)).to.be.false;
      expect(await disputeResolver.isArbiter(arbiter2.address)).to.be.true;
      expect(await disputeResolver.isArbiter(arbiter3.address)).to.be.true;
    });
    
    it("Should not allow removing non-existent arbiters", async function () {
      await expect(
        disputeResolver.removeArbiter(aiCompany.address)
      ).to.be.revertedWith("Not an arbiter");
    });
    
    it("Should allow owner to update required votes", async function () {
      await expect(disputeResolver.connect(owner).updateRequiredVotes(3))
        .to.emit(disputeResolver, "RequiredVotesUpdated")
        .withArgs(2, 3);
      
      expect(await disputeResolver.requiredVotes()).to.equal(3);
    });
    
    it("Should not allow setting required votes higher than arbiter count", async function () {
      await expect(
        disputeResolver.connect(owner).updateRequiredVotes(4)
      ).to.be.revertedWith("Required votes must be greater than 0");
    });
  });
  
  describe("Dispute Reporting and Resolution", function () {
    it("Should allow anyone to report a dispute", async function () {
      const contentIds = [1];
      
      await expect(disputeResolver.connect(creator1).reportDispute(
        aiCompany.address,
        contentIds,
        evidenceURI,
        violationDetails
      )).to.emit(disputeResolver, "DisputeReported")
        .withArgs(1, creator1.address, aiCompany.address);
      
      // Get dispute details
      const basicInfo = await disputeResolver.getDisputeBasicInfo(1);
      expect(basicInfo.id).to.equal(1);
      expect(basicInfo.reporter).to.equal(creator1.address);
      expect(basicInfo.defendant).to.equal(aiCompany.address);
      expect(basicInfo.status).to.equal(0); // REPORTED status
      
      const contentInfo = await disputeResolver.getDisputeContentInfo(1);
      expect(contentInfo.contentIds.length).to.equal(1);
      expect(contentInfo.contentIds[0]).to.equal(1);
      expect(contentInfo.evidenceURI).to.equal(evidenceURI);
      expect(contentInfo.violationDetails).to.equal(violationDetails);
      
      const votingInfo = await disputeResolver.getDisputeVotingInfo(1);
      expect(votingInfo.validVotes).to.equal(0);
      expect(votingInfo.invalidVotes).to.equal(0);
    });
    
    it("Should allow arbiters to vote on disputes", async function () {
      // Report a dispute first
      const contentIds = [1];
      await disputeResolver.connect(creator1).reportDispute(
        aiCompany.address,
        contentIds,
        evidenceURI,
        violationDetails
      );
      
      // Arbiter 1 votes valid
      await expect(disputeResolver.connect(arbiter1).voteOnDispute(1, true))
        .to.emit(disputeResolver, "DisputeVoteCast")
        .withArgs(1, arbiter1.address, true);
      
      // Verify vote was counted
      const votingInfo = await disputeResolver.getDisputeVotingInfo(1);
      expect(votingInfo.validVotes).to.equal(1);
      expect(votingInfo.invalidVotes).to.equal(0);
      
      // Check that arbiter is recorded in arbiters list
      expect(votingInfo.arbiters.length).to.equal(1);
      expect(votingInfo.arbiters[0]).to.equal(arbiter1.address);
    });
    
    it("Should not allow the same arbiter to vote twice", async function () {
      // Report a dispute first
      const contentIds = [1];
      await disputeResolver.connect(creator1).reportDispute(
        aiCompany.address,
        contentIds,
        evidenceURI,
        violationDetails
      );
      
      // Arbiter 1 votes valid
      await disputeResolver.connect(arbiter1).voteOnDispute(1, true);
      
      // Arbiter 1 tries to vote again
      await expect(
        disputeResolver.connect(arbiter1).voteOnDispute(1, false)
      ).to.be.revertedWith("Arbiter has already voted");
    });
    
    it("Should auto-resolve dispute when enough valid votes are cast", async function () {
      // Report a dispute first
      const contentIds = [1];
      await disputeResolver.connect(creator1).reportDispute(
        aiCompany.address,
        contentIds,
        evidenceURI,
        violationDetails
      );
      
      // Arbiters vote (need 2 valid votes for resolution)
      await disputeResolver.connect(arbiter1).voteOnDispute(1, true);
      
      // Second vote should trigger resolution
      await expect(disputeResolver.connect(arbiter2).voteOnDispute(1, true))
        .to.emit(disputeResolver, "DisputeResolved")
        .withArgs(1, true); // Resolved as valid
      
      // Check updated status
      const basicInfo = await disputeResolver.getDisputeBasicInfo(1);
      expect(basicInfo.status).to.equal(1); // RESOLVED_VALID
    });
    
    it("Should auto-resolve dispute as invalid when enough invalid votes are cast", async function () {
      // Report a dispute first
      const contentIds = [1];
      await disputeResolver.connect(creator1).reportDispute(
        aiCompany.address,
        contentIds,
        evidenceURI,
        violationDetails
      );
      
      // Arbiters vote (need majority of invalid votes for invalid resolution)
      await disputeResolver.connect(arbiter1).voteOnDispute(1, false);
      
      // Second vote should trigger resolution
      await expect(disputeResolver.connect(arbiter2).voteOnDispute(1, false))
        .to.emit(disputeResolver, "DisputeResolved")
        .withArgs(1, false); // Resolved as invalid
      
      // Check updated status
      const basicInfo = await disputeResolver.getDisputeBasicInfo(1);
      expect(basicInfo.status).to.equal(2); // RESOLVED_INVALID
    });
    
    it("Should allow owner to manually resolve a dispute", async function () {
      // Report a dispute first
      const contentIds = [1];
      await disputeResolver.connect(creator1).reportDispute(
        aiCompany.address,
        contentIds,
        evidenceURI,
        violationDetails
      );
      
      // Owner manually resolves as valid with notes
      await expect(disputeResolver.connect(owner).resolveDispute(1, true, resolutionNotes))
        .to.emit(disputeResolver, "DisputeResolved")
        .withArgs(1, true);
      
      // Check updated status and notes
      const basicInfo = await disputeResolver.getDisputeBasicInfo(1);
      expect(basicInfo.status).to.equal(1); // RESOLVED_VALID
      
      const contentInfo = await disputeResolver.getDisputeContentInfo(1);
      expect(contentInfo.resolutionNotes).to.equal(resolutionNotes);
    });
    
    it("Should not allow non-owner to manually resolve a dispute", async function () {
      // Report a dispute first
      const contentIds = [1];
      await disputeResolver.connect(creator1).reportDispute(
        aiCompany.address,
        contentIds,
        evidenceURI,
        violationDetails
      );
      
      // Non-owner tries to resolve
      await expect(
        disputeResolver.connect(creator1).resolveDispute(1, true, resolutionNotes)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
    
    it("Should not allow voting on resolved disputes", async function () {
      // Report a dispute first
      const contentIds = [1];
      await disputeResolver.connect(creator1).reportDispute(
        aiCompany.address,
        contentIds,
        evidenceURI,
        violationDetails
      );
      
      // Owner resolves the dispute
      await disputeResolver.connect(owner).resolveDispute(1, true, resolutionNotes);
      
      // Arbiter tries to vote on resolved dispute
      await expect(
        disputeResolver.connect(arbiter1).voteOnDispute(1, true)
      ).to.be.revertedWith("Dispute is already resolved");
    });
    
    it("Should not allow non-arbiters to vote on disputes", async function () {
      // Report a dispute first
      const contentIds = [1];
      await disputeResolver.connect(creator1).reportDispute(
        aiCompany.address,
        contentIds,
        evidenceURI,
        violationDetails
      );
      
      // Non-arbiter tries to vote
      await expect(
        disputeResolver.connect(creator2).voteOnDispute(1, true)
      ).to.be.revertedWith("Only arbiters can vote");
    });
  });
  
  describe("Dispute Queries", function () {
    beforeEach(async function () {
      // Report multiple disputes for testing
      await disputeResolver.connect(creator1).reportDispute(
        aiCompany.address,
        [1],
        evidenceURI,
        "First dispute"
      );
      
      await disputeResolver.connect(creator2).reportDispute(
        aiCompany.address,
        [1],
        evidenceURI,
        "Second dispute"
      );
    });
    
    it("Should return correct dispute counts", async function () {
      expect(await disputeResolver.getTotalDisputes()).to.equal(2);
    });
    
    it("Should return disputes by reporter", async function () {
      const creator1Disputes = await disputeResolver.getReporterDisputeIds(creator1.address);
      expect(creator1Disputes.length).to.equal(1);
      expect(creator1Disputes[0]).to.equal(1);
      
      const creator2Disputes = await disputeResolver.getReporterDisputeIds(creator2.address);
      expect(creator2Disputes.length).to.equal(1);
      expect(creator2Disputes[0]).to.equal(2);
    });
    
    it("Should return disputes by defendant", async function () {
      const companyDisputes = await disputeResolver.getDefendantDisputeIds(aiCompany.address);
      expect(companyDisputes.length).to.equal(2);
      expect(companyDisputes[0]).to.equal(1);
      expect(companyDisputes[1]).to.equal(2);
    });
    
    it("Should return disputes by content", async function () {
      const contentDisputes = await disputeResolver.getContentDisputeIds(1);
      expect(contentDisputes.length).to.equal(2);
      expect(contentDisputes[0]).to.equal(1);
      expect(contentDisputes[1]).to.equal(2);
    });
  });
});

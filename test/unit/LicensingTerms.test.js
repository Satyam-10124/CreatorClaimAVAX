const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LicensingTerms", function () {
  let CreatorRegistry;
  let LicensingTerms;
  let creatorRegistry;
  let licensingTerms;
  let owner;
  let creator1;
  let creator2;
  let aiCompany;
  
  const contentFingerprint = "QmT8TkzrrL6cSZ7Nwx4JDuR7A2vJoKJ4LkyfYwNLs1aVwp";
  const metadataURI = "ipfs://QmW8svkJ8s1ygZ9DuHJ6pktiYjdPGZpQY7GQpYYgYFk2XC";
  
  beforeEach(async function () {
    // Get signers
    [owner, creator1, creator2, aiCompany] = await ethers.getSigners();
    
    // Deploy CreatorRegistry contract
    CreatorRegistry = await ethers.getContractFactory("CreatorRegistry");
    creatorRegistry = await CreatorRegistry.deploy(owner.address);
    await creatorRegistry.waitForDeployment();
    
    // Deploy LicensingTerms contract
    LicensingTerms = await ethers.getContractFactory("LicensingTerms");
    licensingTerms = await LicensingTerms.deploy(await creatorRegistry.getAddress(), owner.address);
    await licensingTerms.waitForDeployment();
    
    // Set LicensingTerms contract in CreatorRegistry
    await creatorRegistry.setLicensingTermsContract(await licensingTerms.getAddress());
    
    // Register content for testing
    await creatorRegistry.connect(creator1).registerContent(contentFingerprint, metadataURI);
  });
  
  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await licensingTerms.owner()).to.equal(owner.address);
    });
    
    it("Should initialize with the correct CreatorRegistry", async function () {
      expect(await licensingTerms.creatorRegistry()).to.equal(creatorRegistry.address);
    });
    
    it("Should initialize with 0 terms", async function () {
      expect(await licensingTerms.getTotalTerms()).to.equal(0);
    });
  });
  
  describe("Terms Creation", function () {
    it("Should allow a creator to create licensing terms", async function () {
      const licensePrice = ethers.parseEther("0.01");
      const usageTypes = [1, 2]; // Training, Inference
      const customTerms = "Custom licensing terms for AI usage";
      
      await expect(licensingTerms.connect(creator1).createTerms(
        1, // Content ID
        2, // PAID status
        licensePrice,
        true, // Require attribution
        usageTypes,
        customTerms
      )).to.emit(licensingTerms, "TermsCreated")
        .withArgs(1, creator1.address, 1);
      
      // Verify terms were created
      const terms = await licensingTerms.getTermsById(1);
      expect(terms.id).to.equal(1);
      expect(terms.contentId).to.equal(1);
      expect(terms.creator).to.equal(creator1.address);
      expect(terms.licensingStatus).to.equal(2); // PAID
      expect(terms.licensePrice).to.equal(licensePrice);
      expect(terms.requireAttribution).to.be.true;
      expect(terms.customTerms).to.equal(customTerms);
    });
    
    it("Should not allow non-creator to create terms", async function () {
      await expect(licensingTerms.connect(creator2).createTerms(
        1, // Content ID
        2, // PAID status
        ethers.parseEther("0.01"),
        true,
        [1, 2],
        "Custom terms"
      )).to.be.revertedWith("Only content creator can create terms");
    });
    
    it("Should link licensing terms to content", async function () {
      // Create terms
      await licensingTerms.connect(creator1).createTerms(
        1, // Content ID
        2, // PAID status
        ethers.parseEther("0.01"),
        true,
        [1, 2],
        "Custom terms"
      );
      
      // Link terms to content
      await expect(creatorRegistry.connect(creator1).setContentLicensingTerms(1, 1))
        .to.emit(creatorRegistry, "ContentLicensingTermsSet")
        .withArgs(1, 1);
      
      // Verify the link
      const content = await creatorRegistry.getContentById(1);
      expect(content.licensingTermsId).to.equal(1);
    });
  });
  
  describe("Terms Updates", function () {
    beforeEach(async function () {
      // Create terms before tests
      await licensingTerms.connect(creator1).createTerms(
        1, // Content ID
        2, // PAID status
        ethers.parseEther("0.01"),
        true,
        [1, 2],
        "Custom terms"
      );
      
      // Link terms to content
      await creatorRegistry.connect(creator1).setContentLicensingTerms(1, 1);
    });
    
    it("Should allow creator to update licensing status", async function () {
      await expect(licensingTerms.connect(creator1).updateLicensingStatus(1, 1))
        .to.emit(licensingTerms, "TermsUpdated")
        .withArgs(1, creator1.address);
      
      const terms = await licensingTerms.getTermsById(1);
      expect(terms.licensingStatus).to.equal(1); // FREE
    });
    
    it("Should allow creator to update license price", async function () {
      const newPrice = ethers.parseEther("0.02");
      await expect(licensingTerms.connect(creator1).updateLicensePrice(1, newPrice))
        .to.emit(licensingTerms, "TermsUpdated")
        .withArgs(1, creator1.address);
      
      const terms = await licensingTerms.getTermsById(1);
      expect(terms.licensePrice).to.equal(newPrice);
    });
    
    it("Should allow creator to update attribution requirement", async function () {
      await expect(licensingTerms.connect(creator1).updateAttributionRequirement(1, false))
        .to.emit(licensingTerms, "TermsUpdated")
        .withArgs(1, creator1.address);
      
      const terms = await licensingTerms.getTermsById(1);
      expect(terms.requireAttribution).to.be.false;
    });
    
    it("Should allow creator to update usage types", async function () {
      const newUsageTypes = [2, 3]; // Inference, Commercial
      await expect(licensingTerms.connect(creator1).updateAllowedUsageTypes(1, newUsageTypes))
        .to.emit(licensingTerms, "TermsUpdated")
        .withArgs(1, creator1.address);
      
      const allowedTypes = await licensingTerms.getAllowedUsageTypes(1);
      expect(allowedTypes.length).to.equal(2);
      expect(allowedTypes[0]).to.equal(2);
      expect(allowedTypes[1]).to.equal(3);
    });
    
    it("Should allow creator to update custom terms", async function () {
      const newCustomTerms = "Updated custom terms for AI usage";
      await expect(licensingTerms.connect(creator1).updateCustomTerms(1, newCustomTerms))
        .to.emit(licensingTerms, "TermsUpdated")
        .withArgs(1, creator1.address);
      
      const terms = await licensingTerms.getTermsById(1);
      expect(terms.customTerms).to.equal(newCustomTerms);
    });
  });
  
  describe("License Checking", function () {
    beforeEach(async function () {
      // Create terms before tests - PAID license
      await licensingTerms.connect(creator1).createTerms(
        1, // Content ID
        2, // PAID status
        ethers.parseEther("0.01"),
        true,
        [1, 2],
        "Custom terms"
      );
      
      // Link terms to content
      await creatorRegistry.connect(creator1).setContentLicensingTerms(1, 1);
    });
    
    it("Should correctly check if content is licensable", async function () {
      expect(await licensingTerms.isContentLicensable(1)).to.be.true;
      
      // Change status to DENY and check again
      await licensingTerms.connect(creator1).updateLicensingStatus(1, 0);
      expect(await licensingTerms.isContentLicensable(1)).to.be.false;
    });
    
    it("Should correctly report if content requires payment", async function () {
      expect(await licensingTerms.isLicensePaid(1)).to.be.true;
      
      // Change status to FREE and check again
      await licensingTerms.connect(creator1).updateLicensingStatus(1, 1);
      expect(await licensingTerms.isLicensePaid(1)).to.be.false;
    });
    
    it("Should correctly check if usage type is allowed", async function () {
      expect(await licensingTerms.isUsageTypeAllowed(1, 1)).to.be.true; // Training
      expect(await licensingTerms.isUsageTypeAllowed(1, 2)).to.be.true; // Inference
      expect(await licensingTerms.isUsageTypeAllowed(1, 3)).to.be.false; // Commercial
    });
    
    it("Should correctly check if attribution is required", async function () {
      expect(await licensingTerms.isAttributionRequired(1)).to.be.true;
      
      // Update to not require attribution
      await licensingTerms.connect(creator1).updateAttributionRequirement(1, false);
      expect(await licensingTerms.isAttributionRequired(1)).to.be.false;
    });
  });
});

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CreatorRegistry", function () {
  let CreatorRegistry;
  let creatorRegistry;
  let owner;
  let creator1;
  let creator2;
  let nonOwner;
  
  const contentFingerprint = "QmT8TkzrrL6cSZ7Nwx4JDuR7A2vJoKJ4LkyfYwNLs1aVwp";
  const metadataURI = "ipfs://QmW8svkJ8s1ygZ9DuHJ6pktiYjdPGZpQY7GQpYYgYFk2XC";
  const updatedMetadataURI = "ipfs://QmNewURIforContentUpdate";
  
  beforeEach(async function () {
    // Get signers
    [owner, creator1, creator2, nonOwner] = await ethers.getSigners();
    
    // Deploy CreatorRegistry contract
    CreatorRegistry = await ethers.getContractFactory("CreatorRegistry");
    creatorRegistry = await CreatorRegistry.deploy(owner.address);
    await creatorRegistry.waitForDeployment();
  });
  
  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await creatorRegistry.owner()).to.equal(owner.address);
    });
    
    it("Should initialize with 0 content", async function () {
      expect(await creatorRegistry.getTotalContent()).to.equal(0);
    });
  });
  
  describe("Content Registration", function () {
    it("Should allow a creator to register content", async function () {
      // Register content
      await expect(creatorRegistry.connect(creator1).registerContent(
        contentFingerprint,
        metadataURI
      )).to.emit(creatorRegistry, "ContentRegistered")
        .withArgs(1, creator1.address, contentFingerprint, metadataURI);
      
      // Verify content was registered
      const contentId = await creatorRegistry.getContentIdByFingerprint(contentFingerprint);
      expect(contentId).to.equal(1);
      
      // Verify content details
      const content = await creatorRegistry.getContentById(contentId);
      expect(content.id).to.equal(1);
      expect(content.creator).to.equal(creator1.address);
      expect(content.contentFingerprint).to.equal(contentFingerprint);
      expect(content.metadataURI).to.equal(metadataURI);
      expect(content.active).to.be.true;
    });
    
    it("Should not allow registering the same content fingerprint twice", async function () {
      // Register content first time
      await creatorRegistry.connect(creator1).registerContent(contentFingerprint, metadataURI);
      
      // Try to register the same fingerprint again
      await expect(
        creatorRegistry.connect(creator2).registerContent(contentFingerprint, metadataURI)
      ).to.be.revertedWith("Content already registered");
    });
    
    it("Should track content IDs by creator", async function () {
      // Creator 1 registers content
      await creatorRegistry.connect(creator1).registerContent(contentFingerprint, metadataURI);
      
      // Creator 2 registers different content
      await creatorRegistry.connect(creator2).registerContent(
        contentFingerprint + "2", 
        metadataURI + "2"
      );
      
      // Check creator's content IDs
      const creator1ContentIds = await creatorRegistry.getContentIdsByCreator(creator1.address);
      const creator2ContentIds = await creatorRegistry.getContentIdsByCreator(creator2.address);
      
      expect(creator1ContentIds.length).to.equal(1);
      expect(creator1ContentIds[0]).to.equal(1);
      expect(creator2ContentIds.length).to.equal(1);
      expect(creator2ContentIds[0]).to.equal(2);
    });
  });
  
  describe("Content Updates", function () {
    beforeEach(async function () {
      // Register content before tests
      await creatorRegistry.connect(creator1).registerContent(contentFingerprint, metadataURI);
    });
    
    it("Should allow creator to update metadata", async function () {
      await expect(creatorRegistry.connect(creator1).updateContentMetadata(
        1, 
        updatedMetadataURI
      )).to.emit(creatorRegistry, "ContentUpdated")
        .withArgs(1, creator1.address, updatedMetadataURI);
      
      const content = await creatorRegistry.getContentById(1);
      expect(content.metadataURI).to.equal(updatedMetadataURI);
    });
    
    it("Should not allow non-creator to update metadata", async function () {
      await expect(
        creatorRegistry.connect(creator2).updateContentMetadata(1, updatedMetadataURI)
      ).to.be.revertedWith("Only content creator can update");
    });
    
    it("Should allow creator to deactivate content", async function () {
      await expect(creatorRegistry.connect(creator1).setContentActive(
        1,
        false
      )).to.emit(creatorRegistry, "ContentStatusChanged")
        .withArgs(1, creator1.address, false);
      
      const content = await creatorRegistry.getContentById(1);
      expect(content.active).to.be.false;
    });
    
    it("Should not allow non-creator to deactivate content", async function () {
      await expect(
        creatorRegistry.connect(creator2).setContentActive(1, false)
      ).to.be.revertedWith("Only content creator can update");
    });
  });
  
  describe("Licensing Terms Integration", function () {
    beforeEach(async function () {
      // Register content before tests
      await creatorRegistry.connect(creator1).registerContent(contentFingerprint, metadataURI);
    });
    
    it("Should allow owner to set licensing terms contract", async function () {
      // For this test we'll just use a random address as the licensing terms contract
      await expect(creatorRegistry.setLicensingTermsContract(nonOwner.address))
        .to.emit(creatorRegistry, "LicensingTermsContractSet")
        .withArgs(nonOwner.address);
      
      expect(await creatorRegistry.licensingTermsContract()).to.equal(nonOwner.address);
    });
    
    it("Should not allow non-owner to set licensing terms contract", async function () {
      await expect(
        creatorRegistry.connect(nonOwner).setLicensingTermsContract(nonOwner.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
    
    it("Should not allow linking licensing terms before contract is set", async function () {
      await expect(
        creatorRegistry.connect(creator1).setContentLicensingTerms(1, 1)
      ).to.be.revertedWith("Licensing terms contract not set");
    });
    
    it("Should prevent operations on non-existent content", async function () {
      await expect(
        creatorRegistry.getContentById(999)
      ).to.be.revertedWith("Content does not exist");
      
      await expect(
        creatorRegistry.connect(creator1).updateContentMetadata(999, updatedMetadataURI)
      ).to.be.revertedWith("Content does not exist");
      
      await expect(
        creatorRegistry.connect(creator1).setContentActive(999, false)
      ).to.be.revertedWith("Content does not exist");
      
      await expect(
        creatorRegistry.connect(creator1).setContentLicensingTerms(999, 1)
      ).to.be.revertedWith("Content does not exist");
    });
  });
});

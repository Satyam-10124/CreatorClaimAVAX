const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PaymentSplitter", function () {
  let CreatorRegistry;
  let LicensingTerms;
  let PaymentSplitter;
  let creatorRegistry;
  let licensingTerms;
  let paymentSplitter;
  let owner;
  let creator1;
  let creator2;
  let aiCompany;
  
  const contentFingerprint1 = "QmT8TkzrrL6cSZ7Nwx4JDuR7A2vJoKJ4LkyfYwNLs1aVwp";
  const contentFingerprint2 = "QmT8TkzrrL6cSZ7Nwx4JDuR7A2vJoKJ4LkyfYwNLs2aVwq";
  const metadataURI = "ipfs://QmW8svkJ8s1ygZ9DuHJ6pktiYjdPGZpQY7GQpYYgYFk2XC";
  const licensePrice = ethers.parseEther("0.01");
  
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
    
    // Deploy PaymentSplitter contract
    PaymentSplitter = await ethers.getContractFactory("PaymentSplitter");
    paymentSplitter = await PaymentSplitter.deploy(
      await creatorRegistry.getAddress(),
      await licensingTerms.getAddress(),
      500, // Initial protocol fee of 5%
      owner.address
    );
    await paymentSplitter.waitForDeployment();
    
    // Set LicensingTerms contract in CreatorRegistry
    await creatorRegistry.setLicensingTermsContract(await licensingTerms.getAddress());
    
    // Register contents for testing
    await creatorRegistry.connect(creator1).registerContent(contentFingerprint1, metadataURI);
    await creatorRegistry.connect(creator2).registerContent(contentFingerprint2, metadataURI);
    
    // Create terms for content
    await licensingTerms.connect(creator1).createTerms(
      2, // PAID status (enum value 2 for PAID)
      licensePrice, // price
      1000, // usageUnit (e.g., 1000 tokens)
      [1, 2], // Training, Inference (AIUsageType enum values)
      true, // Require attribution
      "Custom terms" // customTermsURI
    );
    
    await licensingTerms.connect(creator2).createTerms(
      2, // PAID status (enum value 2 for PAID)
      licensePrice * 2n, // price (double the price)
      1000, // usageUnit (e.g., 1000 tokens)
      [1, 2], // Training, Inference (AIUsageType enum values)
      true, // Require attribution
      "Custom terms for content 2" // customTermsURI
    );
    
    // Link terms to content
    await creatorRegistry.connect(creator1).setContentLicensingTerms(1, 1);
    await creatorRegistry.connect(creator2).setContentLicensingTerms(2, 2);
  });
  
  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await paymentSplitter.owner()).to.equal(owner.address);
    });
    
    it("Should initialize with the correct contracts", async function () {
      expect(await paymentSplitter.creatorRegistry()).to.equal(await creatorRegistry.getAddress());
      expect(await paymentSplitter.licensingTerms()).to.equal(await licensingTerms.getAddress());
    });
    
    it("Should initialize with default protocol fee rate", async function () {
      expect(await paymentSplitter.protocolFeeRate()).to.equal(500); // 5%
    });
  });
  
  describe("Protocol Fee Management", function () {
    it("Should allow owner to update protocol fee rate", async function () {
      await expect(paymentSplitter.connect(owner).updateProtocolFeeRate(700))
        .to.emit(paymentSplitter, "ProtocolFeeRateUpdated")
        .withArgs(500, 700);
      
      expect(await paymentSplitter.protocolFeeRate()).to.equal(700); // 7%
    });
    
    it("Should not allow setting protocol fee above maximum", async function () {
      await expect(
        paymentSplitter.connect(owner).updateProtocolFeeRate(1100) // 11%
      ).to.be.revertedWith("Fee exceeds maximum");
    });
    
    it("Should not allow non-owner to update protocol fee rate", async function () {
      await expect(
        paymentSplitter.connect(aiCompany).updateProtocolFeeRate(700)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
  
  describe("Payment Processing", function () {
    it("Should process payments for single content", async function () {
      const contentIds = [1];
      const contentAmounts = [licensePrice];
      const totalAmount = licensePrice;
      
      // Process payment with enough ETH
      await expect(paymentSplitter.connect(aiCompany).processPayment(
        contentIds,
        contentAmounts,
        "Payment for content usage",
        { value: totalAmount }
      )).to.emit(paymentSplitter, "PaymentProcessed");
      
      // Verify payment was recorded
      const payment = await paymentSplitter.getPaymentById(1);
      expect(payment.id).to.equal(1);
      expect(payment.payer).to.equal(aiCompany.address);
      expect(payment.contentIds[0]).to.equal(1);
      expect(payment.contentAmounts[0]).to.equal(licensePrice);
      expect(payment.totalAmount).to.equal(totalAmount);
      expect(payment.processed).to.be.true;
      expect(payment.notes).to.equal("Payment for content usage");
    });
    
    it("Should process payments for multiple contents", async function () {
      const contentIds = [1, 2];
      const contentAmounts = [licensePrice, licensePrice.mul(2)];
      const totalAmount = licensePrice.add(licensePrice.mul(2));
      
      // Process payment with enough ETH
      await expect(paymentSplitter.connect(aiCompany).processPayment(
        contentIds,
        contentAmounts,
        "Payment for multiple content usage",
        { value: totalAmount }
      )).to.emit(paymentSplitter, "PaymentProcessed");
      
      // Verify payment was recorded
      const payment = await paymentSplitter.getPaymentById(1);
      expect(payment.id).to.equal(1);
      expect(payment.payer).to.equal(aiCompany.address);
      expect(payment.contentIds.length).to.equal(2);
      expect(payment.contentIds[0]).to.equal(1);
      expect(payment.contentIds[1]).to.equal(2);
      expect(payment.contentAmounts[0]).to.equal(licensePrice);
      expect(payment.contentAmounts[1]).to.equal(licensePrice.mul(2));
      expect(payment.totalAmount).to.equal(totalAmount);
      expect(payment.processed).to.be.true;
    });
    
    it("Should fail if payment amount doesn't match content amounts", async function () {
      const contentIds = [1, 2];
      const contentAmounts = [licensePrice, licensePrice.mul(2)];
      const incorrectTotal = licensePrice; // Not enough
      
      await expect(
        paymentSplitter.connect(aiCompany).processPayment(
          contentIds,
          contentAmounts,
          "Insufficient payment",
          { value: incorrectTotal }
        )
      ).to.be.revertedWith("Payment amount mismatch");
    });
    
    it("Should fail if arrays have mismatched lengths", async function () {
      const contentIds = [1, 2];
      const contentAmounts = [licensePrice]; // Missing one amount
      const totalAmount = licensePrice;
      
      await expect(
        paymentSplitter.connect(aiCompany).processPayment(
          contentIds,
          contentAmounts,
          "Mismatched arrays",
          { value: totalAmount }
        )
      ).to.be.revertedWith("Array length mismatch");
    });
  });
  
  describe("Withdrawals", function () {
    beforeEach(async function () {
      // Process a payment before testing withdrawals
      const contentIds = [1, 2];
      const contentAmounts = [licensePrice, licensePrice.mul(2)];
      const totalAmount = licensePrice.add(licensePrice.mul(2));
      
      await paymentSplitter.connect(aiCompany).processPayment(
        contentIds,
        contentAmounts,
        "Payment for withdrawal tests",
        { value: totalAmount }
      );
    });
    
    it("Should allow creators to withdraw their earnings", async function () {
      const initialBalance = await ethers.provider.getBalance(creator1.address);
      
      // Creator 1 withdraws earnings
      const tx = await paymentSplitter.connect(creator1).withdrawCreatorEarnings();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      
      // Calculate expected earnings with fee deduction (5%)
      // Fee: licensePrice * 0.05 = licensePrice * 500 / 10000
      // Earnings: licensePrice - fee
      const expectedEarnings = licensePrice.sub(licensePrice.mul(500).div(10000));
      
      const newBalance = await ethers.provider.getBalance(creator1.address);
      const balanceChange = newBalance.sub(initialBalance).add(gasUsed);
      
      expect(balanceChange).to.equal(expectedEarnings);
      
      // Check that earnings were reset
      expect(await paymentSplitter.getCreatorEarnings(creator1.address)).to.equal(0);
    });
    
    it("Should allow owner to withdraw protocol fees", async function () {
      const initialBalance = await ethers.provider.getBalance(owner.address);
      
      // Owner withdraws protocol fees
      const tx = await paymentSplitter.connect(owner).withdrawProtocolFees();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      
      // Calculate expected protocol fees (5% of total)
      // Total: licensePrice + licensePrice*2 = licensePrice*3
      // Fee: licensePrice*3 * 0.05 = licensePrice*3 * 500 / 10000
      const expectedFees = licensePrice.mul(3).mul(500).div(10000);
      
      const newBalance = await ethers.provider.getBalance(owner.address);
      const balanceChange = newBalance.sub(initialBalance).add(gasUsed);
      
      expect(balanceChange).to.equal(expectedFees);
      
      // Check that protocol fees were reset
      expect(await paymentSplitter.totalProtocolFees()).to.equal(0);
    });
    
    it("Should fail if non-owner tries to withdraw protocol fees", async function () {
      await expect(
        paymentSplitter.connect(aiCompany).withdrawProtocolFees()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
    
    it("Should fail if creator has no earnings to withdraw", async function () {
      // First withdrawal
      await paymentSplitter.connect(creator1).withdrawCreatorEarnings();
      
      // Try to withdraw again
      await expect(
        paymentSplitter.connect(creator1).withdrawCreatorEarnings()
      ).to.be.revertedWith("No earnings to withdraw");
    });
  });
  
  describe("Payment Records", function () {
    beforeEach(async function () {
      // Process payments for testing
      const contentIds1 = [1];
      const contentAmounts1 = [licensePrice];
      await paymentSplitter.connect(aiCompany).processPayment(
        contentIds1, contentAmounts1, "First payment", { value: licensePrice }
      );
      
      const contentIds2 = [2];
      const contentAmounts2 = [licensePrice.mul(2)];
      await paymentSplitter.connect(aiCompany).processPayment(
        contentIds2, contentAmounts2, "Second payment", { value: licensePrice.mul(2) }
      );
    });
    
    it("Should return correct payment counts", async function () {
      expect(await paymentSplitter.getTotalPayments()).to.equal(2);
    });
    
    it("Should track payments by payer correctly", async function () {
      const payerPayments = await paymentSplitter.getUserPaymentIds(aiCompany.address);
      expect(payerPayments.length).to.equal(2);
      expect(payerPayments[0]).to.equal(1);
      expect(payerPayments[1]).to.equal(2);
    });
    
    it("Should track payments by content correctly", async function () {
      // Get payment for content 1
      const payment1 = await paymentSplitter.getPaymentById(1);
      expect(payment1.contentIds[0]).to.equal(1);
      
      // Get payment for content 2
      const payment2 = await paymentSplitter.getPaymentById(2);
      expect(payment2.contentIds[0]).to.equal(2);
    });
  });
});

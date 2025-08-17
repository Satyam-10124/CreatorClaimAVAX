// Deploy script for CreatorClaim Protocol contracts
const hre = require("hardhat");

async function main() {
  console.log("Deploying CreatorClaim Protocol contracts...");

  // Get the contract factories
  const CreatorRegistry = await hre.ethers.getContractFactory("CreatorRegistry");
  const DisputeResolver = await hre.ethers.getContractFactory("DisputeResolver");
  const LicensingTerms = await hre.ethers.getContractFactory("LicensingTerms");
  const PaymentSplitter = await hre.ethers.getContractFactory("PaymentSplitter");
  
  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying contracts with account: ${deployer.address}`);
  
  // Deploy CreatorRegistry first
  console.log("Deploying CreatorRegistry...");
  const creatorRegistry = await CreatorRegistry.deploy(deployer.address);
  await creatorRegistry.waitForDeployment();
  const creatorRegistryAddress = await creatorRegistry.getAddress();
  console.log(`CreatorRegistry deployed to: ${creatorRegistryAddress}`);
  
  // Deploy DisputeResolver with CreatorRegistry address
  console.log("Deploying DisputeResolver...");
  // Initially require 2 votes to resolve a dispute
  const requiredVotes = 2;
  const disputeResolver = await DisputeResolver.deploy(
    creatorRegistryAddress,
    requiredVotes,
    deployer.address
  );
  await disputeResolver.waitForDeployment();
  const disputeResolverAddress = await disputeResolver.getAddress();
  console.log(`DisputeResolver deployed to: ${disputeResolverAddress}`);
  
  // Deploy LicensingTerms with CreatorRegistry address
  console.log("Deploying LicensingTerms...");
  const licensingTerms = await LicensingTerms.deploy(
    creatorRegistryAddress,
    deployer.address
  );
  await licensingTerms.waitForDeployment();
  const licensingTermsAddress = await licensingTerms.getAddress();
  console.log(`LicensingTerms deployed to: ${licensingTermsAddress}`);
  
  // Deploy PaymentSplitter with CreatorRegistry and LicensingTerms addresses
  console.log("Deploying PaymentSplitter...");
  // Set protocol fee to 5%
  const protocolFee = 500; // 5.00%
  const paymentSplitter = await PaymentSplitter.deploy(
    creatorRegistryAddress,
    licensingTermsAddress,
    protocolFee,
    deployer.address
  );
  await paymentSplitter.waitForDeployment();
  const paymentSplitterAddress = await paymentSplitter.getAddress();
  console.log(`PaymentSplitter deployed to: ${paymentSplitterAddress}`);
  
  // Set up contract connections
  console.log("Setting up contract connections...");
  
  // Set LicensingTerms address in CreatorRegistry
  await creatorRegistry.setLicensingTermsContract(licensingTermsAddress);
  console.log("Set LicensingTerms address in CreatorRegistry");
  
  // Print all deployed addresses for reference
  console.log("\nDeployment Summary:");
  console.log("-------------------");
  console.log(`CreatorRegistry: ${creatorRegistryAddress}`);
  console.log(`DisputeResolver: ${disputeResolverAddress}`);
  console.log(`LicensingTerms: ${licensingTermsAddress}`);
  console.log(`PaymentSplitter: ${paymentSplitterAddress}`);
  console.log("\nCreatorClaim Protocol deployed successfully!");
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

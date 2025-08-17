# CreatorClaim Protocol: Frontend Integration Guide

## Project Overview
CreatorClaim is a protocol that gives creators sovereignty over how their intellectual property is used in AI training, while enabling transparent and fair licensing mechanisms. The protocol addresses the issue where AI models train on creator works without permission or compensation.

## Technical Stack
- **Blockchain**: BaseCAMP L1 (Chain ID: 325000)
- **Smart Contracts**: Solidity 0.8.20
- **Backend**: Node.js / Hardhat
- **Suggested Frontend**: React/Next.js
- **API**: REST API with JSON responses

## API Documentation

### Base Configuration

```javascript
// API base URL
const API_BASE = 'http://localhost:3000/api';  // Change to production URL as needed

// Authentication
const headers = {
  'Content-Type': 'application/json',
  'X-API-Key': 'YOUR_API_KEY'  // Replace with your API key
};
```

### Content Management Endpoints

#### 1. Register Content

Register new content on the platform.

- **Endpoint**: `POST /api/content`
- **Body**:
  ```json
  {
    "fingerprint": "unique-content-identifier",
    "metadataURI": "ipfs://QmYourMetadataHash"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "contentId": "1",
    "message": "Content registered successfully"
  }
  ```

#### 2. Get Content By ID

Retrieve content details by its ID.

- **Endpoint**: `GET /api/content/{contentId}`
- **Response**:
  ```json
  {
    "success": true,
    "content": {
      "id": "1",
      "creator": "0x123...",
      "contentFingerprint": "unique-content-identifier",
      "metadataURI": "ipfs://QmYourMetadataHash",
      "active": true,
      "licensingTermsId": "1",
      "registrationTime": "2023-08-08T16:30:00Z"
    }
  }
  ```

#### 3. Get Content By Fingerprint

Retrieve content details by its fingerprint.

- **Endpoint**: `GET /api/content/fingerprint/{fingerprint}`
- **Response**: Same as Get Content By ID

#### 4. Get Content Count

Get the total number of registered content items.

- **Endpoint**: `GET /api/content/stats/count`
- **Response**:
  ```json
  {
    "success": true,
    "count": 42
  }
  ```

### Licensing Terms Endpoints

#### 1. Create Licensing Terms

Set licensing terms for registered content.

- **Endpoint**: `POST /api/terms`
- **Body**:
  ```json
  {
    "contentId": "1",
    "status": 2,          // 0: DENY, 1: ALLOW_FREE, 2: PAID
    "price": "10000000000000000",  // 0.01 ETH (in wei)
    "requireAttribution": true,
    "allowedUsageTypes": [0, 1, 2]  // 0: TRAINING, 1: FINE_TUNING, 2: INFERENCE, 3: ALL
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "termsId": "1",
    "message": "Licensing terms created successfully"
  }
  ```

#### 2. Get Terms By ID

Retrieve licensing terms details.

- **Endpoint**: `GET /api/terms/{termsId}`
- **Response**:
  ```json
  {
    "success": true,
    "terms": {
      "id": "1",
      "contentId": "1",
      "status": 2,
      "price": "10000000000000000",
      "requireAttribution": true,
      "allowedUsageTypes": [0, 1, 2],
      "customTermsURI": "ipfs://QmCustomTerms",
      "creationTime": "2023-08-08T16:35:00Z"
    }
  }
  ```

### Payment Endpoints

#### 1. Process Payment

Pay for content usage rights.

- **Endpoint**: `POST /api/payments`
- **Body**:
  ```json
  {
    "contentIds": ["1", "2"],
    "amounts": ["10000000000000000", "20000000000000000"],
    "notes": ["AI training usage", "Fine-tuning usage"]
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "paymentId": "1",
    "totalAmount": "30000000000000000",
    "message": "Payment processed successfully"
  }
  ```

#### 2. Get Payment By ID

Retrieve payment details.

- **Endpoint**: `GET /api/payments/{paymentId}`
- **Response**:
  ```json
  {
    "success": true,
    "payment": {
      "id": "1",
      "payer": "0x456...",
      "totalAmount": "30000000000000000",
      "notes": "AI training usage",
      "timestamp": "2023-08-08T16:40:00Z",
      "contentIds": ["1", "2"],
      "amounts": ["10000000000000000", "20000000000000000"]
    }
  }
  ```

#### 3. Get Creator Earnings

Check earnings balance for a creator.

- **Endpoint**: `GET /api/earnings/{creatorAddress}`
- **Response**:
  ```json
  {
    "success": true,
    "creatorAddress": "0x123...",
    "balance": "27000000000000000",  // 0.027 ETH (after protocol fee)
    "withdrawableAmount": "27000000000000000"
  }
  ```

#### 4. Withdraw Creator Earnings

Withdraw available earnings (requires authentication as the creator).

- **Endpoint**: `POST /api/earnings/withdraw`
- **Response**:
  ```json
  {
    "success": true,
    "amount": "27000000000000000",
    "transactionHash": "0xabc...",
    "message": "Earnings withdrawn successfully"
  }
  ```

### Dispute Resolution Endpoints

#### 1. Report Dispute

Report a violation.

- **Endpoint**: `POST /api/disputes`
- **Body**:
  ```json
  {
    "defendant": "0x789...",
    "contentIds": ["1"],
    "violationDetails": "Unauthorized use without proper attribution",
    "evidenceURI": "ipfs://QmEvidenceHash"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "disputeId": "1",
    "message": "Dispute reported successfully"
  }
  ```

#### 2. Get Dispute Details

Retrieve dispute information.

- **Endpoint**: `GET /api/disputes/{disputeId}`
- **Response**:
  ```json
  {
    "success": true,
    "dispute": {
      "id": "1",
      "reporter": "0x123...",
      "defendant": "0x789...",
      "contentInfo": {
        "contentIds": ["1"],
        "evidenceURI": "ipfs://QmEvidenceHash",
        "violationDetails": "Unauthorized use without proper attribution",
        "resolutionNotes": ""
      },
      "votingInfo": {
        "arbiters": ["0xaaa...", "0xbbb..."],
        "validVotes": 1,
        "invalidVotes": 0
      },
      "status": 1,  // 0: REPORTED, 1: UNDER_REVIEW, 2: RESOLVED_VALID, 3: RESOLVED_INVALID
      "creationTime": "2023-08-08T16:45:00Z"
    }
  }
  ```

#### 3. Vote on Dispute

Cast a vote on a dispute (arbiter only).

- **Endpoint**: `POST /api/disputes/{disputeId}/vote`
- **Body**:
  ```json
  {
    "isValid": true
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "disputeId": "1",
    "message": "Vote recorded successfully"
  }
  ```

#### 4. Check if Address is Arbiter

Verify if an address has arbiter permissions.

- **Endpoint**: `GET /api/arbiters/{address}`
- **Response**:
  ```json
  {
    "success": true,
    "address": "0xaaa...",
    "isArbiter": true
  }
  ```

## Core Smart Contracts
The protocol consists of four main smart contracts:

1. **CreatorRegistry.sol**
   - Handles content registration and ownership
   - Stores content metadata and fingerprints
   - Maps content to creators and licensing terms

2. **LicensingTerms.sol**
   - Manages licensing conditions and pricing
   - Supports free/paid licensing options
   - Controls attribution requirements

3. **PaymentSplitter.sol**
   - Processes payments for content usage
   - Handles royalty distribution
   - Manages creator withdrawals

4. **DisputeResolver.sol**
   - Handles violation reports and dispute resolution
   - Manages arbitration and voting on disputes
   - Tracks dispute lifecycles and evidence

## Frontend Integration with Ethers.js

For direct blockchain interaction without using the REST API, you can use ethers.js:

### Setting Up Contract Connections

```javascript
import { ethers } from 'ethers';
import CreatorRegistryABI from '../artifacts/contracts/CreatorRegistry.sol/CreatorRegistry.json';
import LicensingTermsABI from '../artifacts/contracts/LicensingTerms.sol/LicensingTerms.json';
import PaymentSplitterABI from '../artifacts/contracts/PaymentSplitter.sol/PaymentSplitter.json';
import DisputeResolverABI from '../artifacts/contracts/DisputeResolver.sol/DisputeResolver.json';

// Contract addresses (replace with actual deployed addresses)
const CREATOR_REGISTRY_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const LICENSING_TERMS_ADDRESS = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';
const PAYMENT_SPLITTER_ADDRESS = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';
const DISPUTE_RESOLVER_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

// Set up provider and signer
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// Create contract instances
const creatorRegistry = new ethers.Contract(
  CREATOR_REGISTRY_ADDRESS,
  CreatorRegistryABI.abi,
  signer
);

const licensingTerms = new ethers.Contract(
  LICENSING_TERMS_ADDRESS,
  LicensingTermsABI.abi,
  signer
);

const paymentSplitter = new ethers.Contract(
  PAYMENT_SPLITTER_ADDRESS,
  PaymentSplitterABI.abi,
  signer
);

const disputeResolver = new ethers.Contract(
  DISPUTE_RESOLVER_ADDRESS,
  DisputeResolverABI.abi,
  signer
);
```

### Contract Interaction Examples

#### Content Registration

```javascript
// Register new content
const registerContent = async (fingerprint, metadataURI) => {
  try {
    const tx = await creatorRegistry.registerContent(fingerprint, metadataURI);
    const receipt = await tx.wait();
    
    // Get content ID from event
    const contentRegisteredEvent = receipt.logs.find(
      log => log.fragment && log.fragment.name === "ContentRegistered"
    );
    
    const contentId = contentRegisteredEvent ? 
      contentRegisteredEvent.args.contentId : 
      null;
      
    return { success: true, contentId };
  } catch (error) {
    console.error("Error registering content:", error);
    return { success: false, error: error.message };
  }
};
```

#### Create Licensing Terms

```javascript
// Create licensing terms for content
const createLicensingTerms = async (contentId, status, price, requireAttribution, usageTypes, customTermsURI) => {
  try {
    const tx = await licensingTerms.createTerms(
      contentId,
      status, // 0: DENY, 1: ALLOW_FREE, 2: PAID
      price,  // in wei
      requireAttribution,
      usageTypes, // array of allowed usage types
      customTermsURI
    );
    
    const receipt = await tx.wait();
    
    // Get terms ID from event
    const termsCreatedEvent = receipt.logs.find(
      log => log.fragment && log.fragment.name === "TermsCreated"
    );
    
    const termsId = termsCreatedEvent ? 
      termsCreatedEvent.args.termsId : 
      null;
      
    return { success: true, termsId };
  } catch (error) {
    console.error("Error creating terms:", error);
    return { success: false, error: error.message };
  }
};
```

#### Process Payment

```javascript
// Process payment for content usage
const processPayment = async (contentIds, amounts, notes) => {
  try {
    const totalAmount = amounts.reduce(
      (sum, amount) => sum + BigInt(amount), 
      BigInt(0)
    );
    
    const tx = await paymentSplitter.processPayment(
      contentIds,
      amounts,
      notes,
      { value: totalAmount }
    );
    
    const receipt = await tx.wait();
    
    // Get payment ID from event
    const paymentProcessedEvent = receipt.logs.find(
      log => log.fragment && log.fragment.name === "PaymentProcessed"
    );
    
    const paymentId = paymentProcessedEvent ? 
      paymentProcessedEvent.args.paymentId : 
      null;
      
    return { success: true, paymentId, totalAmount: totalAmount.toString() };
  } catch (error) {
    console.error("Error processing payment:", error);
    return { success: false, error: error.message };
  }
};
```

#### Report Dispute

```javascript
// Report a dispute for content misuse
const reportDispute = async (defendant, contentIds, evidenceURI, violationDetails) => {
  try {
    const tx = await disputeResolver.reportDispute(
      defendant,
      contentIds,
      evidenceURI,
      violationDetails
    );
    
    const receipt = await tx.wait();
    
    // Get dispute ID from event
    const disputeReportedEvent = receipt.logs.find(
      log => log.fragment && log.fragment.name === "DisputeReported"
    );
    
    const disputeId = disputeReportedEvent ? 
      disputeReportedEvent.args.disputeId : 
      null;
      
    return { success: true, disputeId };
  } catch (error) {
    console.error("Error reporting dispute:", error);
    return { success: false, error: error.message };
  }
};
```

#### Fetch Dispute Information

```javascript
// Get comprehensive dispute information
const getDisputeInfo = async (disputeId) => {
  try {
    // Get content information
    const contentInfo = await disputeResolver.getDisputeContentInfo(disputeId);
    const [contentIds, evidenceURI, violationDetails, resolutionNotes] = contentInfo;
    
    // Get voting information
    const votingInfo = await disputeResolver.getDisputeVotingInfo(disputeId);
    const [arbiters, validVotes, invalidVotes] = votingInfo;
    
    // Determine dispute status
    let status;
    const requiredVotes = await disputeResolver.requiredVotes();
    
    if (validVotes >= requiredVotes) {
      status = "RESOLVED_VALID";
    } else if (invalidVotes >= requiredVotes) {
      status = "RESOLVED_INVALID";
    } else if (validVotes > 0 || invalidVotes > 0) {
      status = "UNDER_REVIEW";
    } else {
      status = "REPORTED";
    }
    
    return {
      success: true,
      dispute: {
        id: disputeId,
        contentInfo: {
          contentIds,
          evidenceURI,
          violationDetails,
          resolutionNotes
        },
        votingInfo: {
          arbiters,
          validVotes,
          invalidVotes
        },
        status
      }
    };
  } catch (error) {
    console.error("Error getting dispute info:", error);
    return { success: false, error: error.message };
  }
};
```

## User Flows to Implement

1. **Creator Dashboard**
   - Content registration with metadata upload
   - Licensing terms configuration (free/paid/deny)
   - Earnings tracking and withdrawal
   - Dispute management and monitoring

2. **Consumer Portal**
   - Content discovery and licensing
   - Payment processing for usage rights
   - Attribution management
   - Usage tracking and compliance

3. **Administration Interface**
   - Dispute resolution workflow
   - Protocol management
   - Analytics and reporting

## Current Status
- All smart contracts are implemented and fully tested
- Deployment scripts for BaseCAMP are configured
- End-to-end demo script is running successfully
- API endpoints are ready for frontend integration

## Resources
- GitHub Repository: [CreatorClaim Protocol]
- Smart Contract ABIs: Available in the `/artifacts` directory
- Demo Script: `/scripts/demo.js` shows all protocol interactions
- API Test Script: `/api/test-api.js` demonstrates API usage

Please reach out if you have any questions about the API endpoints, smart contract functionality, or integration points.

# CreatorClaim Protocol API

This API provides a REST interface for interacting with the CreatorClaim Protocol smart contracts deployed on Avalanche Fuji testnet.

## Features

- **Content Registration**: Register and retrieve digital content
- **Licensing Management**: Create and update licensing terms
- **Payment Processing**: Process payments for content usage
- **Earnings Withdrawal**: Allow creators to withdraw their earnings
- **Dispute Resolution**: Report and resolve content disputes

## Setup

### Prerequisites

- Node.js (v14+)
- npm or yarn
- Access to Avalanche Fuji testnet
- Private key with AVAX for gas fees

### Installation

1. Install dependencies:
```bash
cd api
npm install
```

2. Create a `.env` file in the api directory:
```
API_KEY=your_secure_api_key
API_PRIVATE_KEY=your_wallet_private_key
PORT=3000
```

### Running the API Server

```bash
npm start
```

The API will be available at `http://localhost:3000`.

## API Endpoints

### Content Endpoints

- `POST /api/content` - Register new content
  - Request body: `{ "fingerprint": "content-hash", "metadataURI": "ipfs://..." }`
  
- `GET /api/content/:id` - Get content by ID

- `GET /api/content/fingerprint/:fingerprint` - Get content by fingerprint

- `GET /api/creator/:address/content` - Get all content by a creator

- `GET /api/content/stats/count` - Get total content count

### Licensing Endpoints

- `POST /api/terms` - Create licensing terms
  - Request body: `{ "contentId": "1", "status": 2, "price": "10000000000000000", "requireAttribution": true, "allowedUsageTypes": [0,1,2] }`

- `PUT /api/terms/:id` - Update licensing terms

- `GET /api/terms/:id` - Get terms by ID

### Payment Endpoints

- `POST /api/payments` - Make a payment
  - Request body: `{ "contentIds": ["1"], "amounts": ["10000000000000000"], "notes": ["License payment"] }`

- `GET /api/payments/:id` - Get payment details

- `POST /api/earnings/withdraw` - Withdraw creator earnings

- `GET /api/earnings/:address` - Get creator's balance

### Dispute Endpoints

- `POST /api/disputes` - Report a dispute
  - Request body: `{ "defendant": "0x...", "contentIds": ["1"], "evidenceURI": "ipfs://...", "violationDetails": "Unauthorized usage" }`

- `POST /api/disputes/:id/vote` - Vote on a dispute
  - Request body: `{ "isValid": true }`

- `GET /api/disputes/:id` - Get dispute details

- `GET /api/disputes/stats/count` - Get total disputes count

- `GET /api/arbiters/:address` - Check if address is an arbiter

- `POST /api/arbiters` - Add a new arbiter (admin only)
  - Request body: `{ "arbiterAddress": "0x..." }`

## Authentication

Protected endpoints require an API key to be included in the request header:

```
X-API-Key: your_api_key_here
```

## Example Usage (JavaScript)

```javascript
// Example: Register new content
async function registerContent() {
  const response = await fetch('http://localhost:3000/api/content', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'your_api_key_here'
    },
    body: JSON.stringify({
      fingerprint: 'unique-content-hash-123',
      metadataURI: 'ipfs://QmYourMetadataHash'
    })
  });
  
  const data = await response.json();
  console.log('Content registered:', data);
}
```

## Integration with Frontend

This API is designed to work with any frontend application that needs to interact with CreatorClaim Protocol smart contracts. The endpoints follow RESTful patterns and return JSON responses with consistent structure:

```json
{
  "success": true,
  "txHash": "0x...",
  "contentId": "1"
}
```

## Error Handling

All endpoints return a consistent error format:

```json
{
  "success": false,
  "error": "Error message"
}
```

## Contract Addresses (Fuji Testnet)

- CreatorRegistry: 0x4F992a229e3eBd64AC36137fa8750c8beA64929E
- DisputeResolver: 0xfd1411e2e3ddfC0C68649d3FEb1bE50C6d599EBd
- LicensingTerms: 0xae160d585c48b96f248Bd6f829f4432EFf9Eb49d
- PaymentSplitter: 0xe523fc1cc80A6EF2f643895b556cf43A1f1bCF60

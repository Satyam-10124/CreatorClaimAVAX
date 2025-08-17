# CreatorClaim Protocol

A full‑stack, Avalanche‑powered protocol for creators to register content, define licensing terms, accept payments, and resolve disputes. This repository contains smart contracts (Hardhat), an Express API, and a modern React (Vite + shadcn/ui + Tailwind) frontend.

## Table of Contents
- Overview
- Features
- Architecture
- Getting Started
  - Prerequisites
  - Clone & Install
  - Environment Variables
  - Run Locally
- Usage Walkthrough
- Scripts
- Testing
- Deployment Notes
- Security & Production Hardening
- Project Structure
- License

## Overview
CreatorClaim gives creators sovereignty over their IP in AI training by enabling on‑chain registration, programmable licensing terms, automated royalty payments, and community dispute resolution.

## Features
- Creator Dashboard with stats and quick actions
- Content registration with on‑chain proofs
- Smart licensing: price (wei), usage types, attribution requirement, external terms link
- Payments and automated earnings tracking via `PaymentSplitter`
- Dispute resolution workflows
- AI Companies page to discover terms and purchase licenses
- Polished UI with glass‑morphism theme, SPA routing, accessibility improvements

## Architecture
- Contracts (Solidity, Hardhat):
  - `contracts/CreatorRegistry.sol`
  - `contracts/LicensingTerms.sol`
  - `contracts/PaymentSplitter.sol`
  - `contracts/DisputeResolver.sol`
- Backend (Node/Express): `api/server.js`, business logic in `api/services/contractService.js`
- Frontend (React/Vite/TypeScript/Tailwind): `frontend/`
- Artifacts: `artifacts/` (compiled ABIs), `scripts/` (deploy/test helpers)

### Frontend → Backend
Frontend uses helpers in `frontend/src/lib/api.ts`:
- Base URL: `VITE_API_BASE` (defaults to `http://localhost:3003/api`)
- `apiGet(path)` – GET without auth
- `apiPost(path, body, apiKey?)` – generic POST, optional `X-API-Key`
- `apiPostProtected(path, body)` – development‑only shortcut that injects `VITE_API_KEY`

Backend validates `X-API-Key` for protected routes and talks to the blockchain using `API_PRIVATE_KEY`.

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm/npm
- An Avalanche RPC (Fuji testnet or local)

### Clone & Install
```bash
# clone
git clone <repo-url>
cd Creator_Claim

# install root toolchains (optional)
# contracts + api use root node_modules; frontend has its own
npm install

# install frontend deps
cd frontend && npm install && cd ..
```

### Environment Variables
Create `.env` files as below. Never commit private keys.

Root `.env` (optional, for Hardhat):
```
# add your RPCs and keys as needed for hardhat.config.js
```

Backend `api/.env`:
```
API_KEY=dev-local-key               # required for protected endpoints
API_PRIVATE_KEY=0x...               # signer for on-chain txs
RPC_URL=https://api.avax-test.network/ext/bc/C/rpc # example
NETWORK=fuji                        # used by services/config
PORT=3003
```

Frontend `frontend/.env`:
```
VITE_API_BASE=http://localhost:3003/api
VITE_API_KEY=dev-local-key          # dev ONLY; do not ship to production
```

### Run Locally
In two terminals:
```bash
# Terminal 1: backend
npm run dev:api        # or: node api/server.js (see package.json scripts)

# Terminal 2: frontend
cd frontend
npm run dev            # Vite dev server
```
Open http://localhost:5173 (or the port shown by Vite).

## Usage Walkthrough
1. Go to `/creator`:
   - Register content (on‑chain)
   - Create licensing terms (price, usage flags, attribution)
   - View terms, make payments, check earnings
2. “For AI companies” `/ai`:
   - Enter Content ID, fetch terms, purchase license (protected API)
3. Disputes `/disputes`:
   - File/view disputes per the contract/service APIs

## Scripts
Root scripts (see `package.json`):
- `hardhat` tasks (compile, test, deploy) via `hardhat.config.js`
- `scripts/deploy.js` – deploy contracts
- `scripts/test-fuji.js` / `scripts/demo.js` – examples

Frontend scripts (`frontend/package.json`):
- `dev` – Vite dev server
- `build` – production build
- `preview` – preview built app

## Testing
- Smart contracts: `npx hardhat test` (see `test/unit/*.test.js`)
- API integration: `api/test-api.js` exercises key endpoints
- Frontend: add component tests with Vitest/RTL (recommended)

## Deployment Notes
- Backend: deploy `api/` behind HTTPS reverse proxy; set `API_KEY`, `API_PRIVATE_KEY`, `RPC_URL`, `PORT`
- Frontend: build with `npm run build` in `frontend/` and host static artifacts
- Ensure `VITE_API_BASE` points to your live API URL

## Security & Production Hardening
- Remove usage of `apiPostProtected` and `VITE_API_KEY` from the browser in production; proxy sensitive actions server‑side
- Validate and sanitize all inputs (consider Zod schemas for both client and server)
- Add rate limiting, CORS allow‑list, auth, and structured logging
- Use environment‑specific RPC URLs and keys via secure secret management
- Monitor errors (Sentry) and add request tracing/metrics where possible

## Project Structure
```
Creator_Claim/
├─ api/                       # Express API + services
├─ artifacts/                 # ABIs and build artifacts
├─ contracts/                 # Solidity contracts
├─ frontend/                  # React app (Vite + Tailwind)
├─ scripts/                   # Deployment/demo scripts
├─ test/                      # Hardhat tests
├─ hardhat.config.js
├─ package.json
└─ README.md                  # this file
```

## License
MIT or as specified by the repository. Update this section if different.


# 🌐 CreatorClaim Protocol  

**Own your data. License it for AI. Get paid — powered by Avalanche.**  

CreatorClaim is a **full-stack on-chain licensing protocol** for creators. It enables provable ownership, programmable license terms, automated royalty payments, and community-driven dispute resolution — all secured on the **Avalanche blockchain**.  

We are building the **licensing layer for the AI era**, empowering creators to monetize their data while providing AI companies with trusted, compliant access to training datasets.  

---

## 🚀 Overview  

- **Problem**: Creators have no provable ownership; AI labs train on scraped content for free. AI companies face legal/reputational risk with unclear rights.  
- **Solution**: Register content on Avalanche, define license terms, and receive transparent on-chain payments. AI companies get verifiable receipts and safe access.  
- **Vision**: Onboard millions of creators, unlock $1B+ in creator earnings, and make Avalanche the global hub for licensed AI data.  

---

## 🔑 Features  

- 📌 **Creator Dashboard** → stats & quick actions  
- 📝 **Content Registration** → proof of ownership via Avalanche + Snowtrace links  
- ⚖️ **Smart Licensing** → FREE/PAID terms, usage rules, attribution, pricing (wei)  
- 💸 **PaymentSplitter** → automated payouts + protocol fee  
- 👩‍⚖️ **DisputeResolver** → community arbitration  
- 🔍 **AI Companies Page** → discover terms, purchase licenses, get on-chain receipts  
- 🎨 **Modern UI** → React + Tailwind + shadcn/ui (glass-morphism theme)  

---

## 🏗️ Architecture  

### Smart Contracts (Solidity, Hardhat)  
- `CreatorRegistry.sol` → register fingerprints & creators  
- `LicensingTerms.sol` → store license rules & pricing  
- `PaymentSplitter.sol` → handle payouts + platform fee  
- `DisputeResolver.sol` → arbitration logic  

### Backend (Node/Express)  
- API proxy for contract calls & indexing  
- Protected routes with `X-API-Key` + signer wallet  

### Frontend (React + Vite + shadcn/ui)  
- Creator workflows: Register → License → Earnings → Dispute  
- AI workflows: View terms → Pay → Get receipts  
- Integrated Snowtrace links for trust & transparency  

### Data Storage  
- Metadata references stored on **IPFS**  

---

## ⚙️ Getting Started  

### Prerequisites  
- Node.js 18+  
- npm/pnpm  
- Avalanche RPC (Fuji testnet recommended)  

### Clone & Install  
```bash
git clone <repo-url>
cd Creator_Claim
npm install
cd frontend && npm install && cd ..
```  

### Environment Variables  
**Backend (`api/.env`)**  
```env
API_KEY=dev-local-key
API_PRIVATE_KEY=0x...
RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
NETWORK=fuji
PORT=3003
```  

**Frontend (`frontend/.env`)**  
```env
VITE_API_BASE=http://localhost:3003/api
VITE_API_KEY=dev-local-key
```  

### Run Locally  
```bash
# Terminal 1: backend
npm run dev:api  

# Terminal 2: frontend
cd frontend && npm run dev
```  
App will open at: `http://localhost:5173`  

---

## 🖥️ Usage Walkthrough  

1. **Creator Flow (/creator)**  
   - Register content → on-chain proof (Snowtrace link)  
   - Set license terms → FREE/PAID, attribution, usage  
   - View earnings & withdraw  

2. **AI Company Flow (/ai)**  
   - Enter Content ID → view license terms  
   - Pay on-chain → receipt via Snowtrace  

3. **Dispute Flow (/disputes)**  
   - File a violation → arbiters vote → resolution recorded  

---

## 📊 Economic Opportunity  

- **10M creators** × **$100/year licenses** = **$1B creator earnings**  
- **10% protocol fee** = **$100M annual revenue**  
- Sustainable, scalable alternative to tipping models  

---

## 📅 Roadmap  

- **Phase 1 (MVP)** → Content registry, licensing terms, payments (✅ Fuji testnet live)  
- **Phase 2** → Indexing & analytics, arbitration network, early user onboarding  
- **Phase 3** → Enterprise APIs for AI labs, scaling to millions of creators  

---

## 👥 Team  

- **Satyam (POC)** → Product & Partnerships (creators, AI labs)  
- **Engineering Team** → Smart contracts, frontend, API integrations  
- **Why Us** → Deep Web3 + AI expertise, strong creator & AI buyer networks  

---

## 🛡️ Security & Hardening  

- Server-side signing with private keys  
- Rate limiting & input validation (Zod schemas)  
- Production deployment behind HTTPS reverse proxy  
- Monitoring (Sentry/logging) + structured metrics  

---

## 📂 Project Structure  

```
Creator_Claim/
├─ api/           # Express API
├─ contracts/     # Solidity contracts
├─ frontend/      # React app (Vite + Tailwind + shadcn/ui)
├─ scripts/       # Deployment/demo scripts
├─ test/          # Hardhat tests
└─ README.md
```  

---

## 📜 License  
MIT (or update if otherwise).  

---

## 🤝 Grant Alignment (Team1 Avalanche Mini Grants)  

CreatorClaim directly aligns with the **Team1 Mini Grants** program goals:  

- **Built on Avalanche** → Live prototype deployed on Fuji testnet with verifiable Snowtrace receipts.  
- **MVP Ready** → Core flows (Register → License → Pay → Earnings → Dispute) already functional.  
- **Milestones**:  
  - Phase 1: Polish MVP, integrate indexing, early user testing.  
  - Phase 2: Launch arbitration network & feedback loop.  
  - Phase 3: Enterprise APIs for AI labs + Demo Day showcase.  
- **Ecosystem Impact** → Onboards millions of creators, unlocks compliant data sources for AI, drives $100M+ in platform revenue through Avalanche.  
- **Why Team1** → Mentorship, milestone structure, and Demo Day acceleration perfectly fit our path to scale and adoption.  

---

✨ *CreatorClaim: the licensing layer for AI data — secured by Avalanche.*  

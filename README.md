# Aleph Platform

Collaborative procurement platform for retailers and suppliers, with on-chain execution on Avalanche (Fuji/Testnet and Mainnet by environment), aggregated order tokenization, and a full financial lifecycle.

This document describes the vision of the final functional system, not a reduced version.

## 1) System Vision

Aleph connects retailers and suppliers in a coordinated purchasing network:

- Retailers group together to consolidate demand.
- Permissioned pools are created per campaign.
- Each participant registers purchase commitments.
- The system aggregates demand and creates a structured order.
- The order is tokenized into operational/financial representations.
- Financing, settlement, repayment, and bridge events are supported.
- The full cycle is auditable through API and on-chain tx hash traceability.

## 2) Business Objectives

- Improve negotiation power for small and mid-sized retailers.
- Provide early visibility of real demand to suppliers.
- Reduce operational friction in coordination, settlement, and collections.
- Enable structured financing on top of tokenized orders.
- Create a trust layer with cryptographic verifiability and on-chain records.

## 3) Actors

- Retailer: discovers products, joins campaigns, commits demand, and monitors orders and settlements.
- Supplier: creates and manages campaigns/pools, monitors aggregated demand, and manages financial lifecycle/compliance states.
- Platform operator: defines policies, monitors system health, and audits events.
- Blockchain infrastructure: pool management and tokenization/lifecycle smart contracts.

## 4) Functional Capabilities

### 4.1 Identity and Access

- Email/password and Google signup/login.
- JWT for API sessions.
- Role-based authorization guard.
- Automatic wallet provisioning per user in backend.
- Secure private key custody (encrypted, never exposed in frontend).

### 4.2 Collaborative Procurement

- Product catalog by vertical/category.
- Creation of permissioned campaigns/pools.
- Allowed participant list per pool.
- Commitment registration per retailer (quantity, price, SKU).
- Merchant verification before operating in pools.

### 4.3 Order Aggregation Engine

- Commitment consolidation by pool.
- Aggregated metric calculation:
  - total quantity
  - weighted unit price
  - total notional
  - participating retailers
- Structured order generation as a financial unit.

### 4.4 Tokenization and Financial Lifecycle

- Aggregated order tokenization.
- On-chain metadata registration:
  - tx hash
  - valid explorer URL
  - event timestamp
- Lifecycle states:
  - collecting
  - structured
  - tokenized
  - funded
  - settled
  - in_repayment
  - repaid
- Bridge preparation support when applicable.

### 4.5 Observability and Auditability

- Structured business event logging.
- Aggregated system status endpoint.
- Role-based order and transaction history.
- End-to-end traceability: UI <-> API <-> Blockchain.

### 4.6 User Experience

- Retailer dashboard with full sections:
  - overview
  - create pool / execute flow
  - history
  - profile (includes public wallet data)
- Supplier dashboard with full sections:
  - overview
  - create pool
  - history/lifecycle
  - profile (includes public wallet data)
- Wallet information is not shown in login; only in profile.

## 5) Technical Architecture

## 5.1 Frontend (aleph-front)

- Next.js App Router + TypeScript.
- Generated OpenAPI client for strong typing.
- Role-based views with direct backend API consumption.
- tx hash and explorer link rendering with safe validation/fallback.

## 5.2 Backend (aleph-back)

- NestJS modular:
  - auth
  - rwa
  - agent
- Domain services for:
  - merchant verification
  - payload encryption
  - procurement/lifecycle orchestration
  - L1 contract integration
- Swagger/OpenAPI for integration and API governance.

## 5.3 Blockchain

- Dedicated contracts:
  - Pool Manager
  - Tokenization / Lifecycle
- Execution of transactions signed by an authorized backend signer.
- Fuji compatibility for testing and target network by deployment environment.

## 6) End-to-End Operational Flow

1. User signs up/logs in.
2. Backend creates/loads profile and public wallet.
3. Supplier defines a campaign and creates a permissioned pool.
4. Verified retailers submit commitments.
5. System aggregates commitments and structures the order.
6. Order is tokenized on-chain.
7. Financing/settlement/repayment events are registered.
8. Dashboards display status, history, and verifiable transactions.

## 7) Security and Compliance

- Backend private key encryption.
- Sensitive material is never exposed in frontend.
- Strict CORS by allowed domains.
- Environment separation (local, staging, prod).
- Blockchain config validation to prevent execution on invalid endpoints.
- Operational traceability and auditability.

## 8) Environments and Deployment

### 8.1 Base Configuration

- Backend: see `aleph-back/.env.fuji.example`.
- Frontend: see `aleph-front/.env.example`.

### 8.2 Critical Production Variables

- `PRIVATE_L1_RPC_URL`
- `PRIVATE_L1_SIGNER_PK`
- `POOL_MANAGER_CONTRACT`
- `TOKENIZATION_CONTRACT`
- `PRIVATE_L1_EXPLORER_TX_BASE_URL`
- `CORS_ORIGIN` (final frontend domains)
- `GOOGLE_CLIENT_ID` (if Google login is enabled)

### 8.3 Final Operational Readiness Criteria

The system is considered final and fully functional when:

- Auth and role-based profiles run in production.
- Pool, commitments, aggregate, and tokenize flows execute on real on-chain infrastructure.
- History and lifecycle states remain consistent between API and blockchain.
- Explorer links are valid and verifiable.
- Monitoring and alerts cover key operational failures.

## 9) Repository Structure

- `aleph-back`: API, domain logic, contracts, and technical docs.
- `aleph-front`: web experience for retailers and suppliers.

## 10) Evolution Roadmap (Post Go-Live)

- Risk engine and scoring for dynamic financing.
- Integration with more liquidity providers.
- Advanced compliance/KYC rules by jurisdiction.
- Predictive demand and pricing analytics.
- ERP/POS integrations for automated data ingestion.

---

For implementation details by module:

- Backend: `aleph-back/README.md`
- Frontend: `aleph-front/README.md`
- ABI/contracts architecture: `aleph-back/docs/contract-abi-architecture.md`

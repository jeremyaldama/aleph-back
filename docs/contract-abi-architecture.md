# Contract ABI Integration Architecture

This document describes how the backend integrates two deployed contracts (Pool Manager and Tokenization) on your private Avalanche L1 using configurable ABIs.

## Goals

- Keep contract addresses and ABIs outside code when possible.
- Support hot replacement of ABI files between environments.
- Preserve a safe fallback mode for local development.
- Avoid code changes when contract interfaces evolve.

## High-Level Design

1. `RwaProcurementService` orchestrates business operations.
2. `PrivateL1ContractsService` acts as blockchain gateway.
3. `PrivateL1ContractsService` resolves ABIs from configuration in this order:
   - `*_ABI_JSON` environment variable
   - `*_ABI_PATH` file path
   - default embedded ABI fallback
4. Resolved ABI + deployed address are used to instantiate `ethers.Contract`.
5. Business operations call gateway methods:
   - `createPermissionedPool`
   - `tokenizeAggregatedOrder`
   - `settleOrder`
   - `recordRepayment`
   - `prepareBridge`

## Contract Inputs

Required:

- `PRIVATE_L1_RPC_URL`
- `PRIVATE_L1_SIGNER_PK`
- `POOL_MANAGER_CONTRACT`
- `TOKENIZATION_CONTRACT`

ABI options:

- `POOL_MANAGER_ABI_PATH`
- `TOKENIZATION_ABI_PATH`
- `POOL_MANAGER_ABI_JSON`
- `TOKENIZATION_ABI_JSON`

## Recommended Production Setup

1. Store addresses and signer key in secret manager.
2. Package ABI JSON files with deployment artifacts.
3. Point `*_ABI_PATH` to those artifact files.
4. Keep fallback ABI only for local development.
5. Add CI check to verify function signatures used by backend exist in ABI.

## Docker Compose Integration

- `docker-compose.yml` mounts `./abis` to `/app/abis` (read-only).
- App environment points to:
  - `/app/abis/pool-manager.abi.json`
  - `/app/abis/tokenization.abi.json`

## Migration Playbook for New Contract Version

1. Deploy new contract version.
2. Update contract address env variable.
3. Update ABI file in `abis/`.
4. Restart backend.
5. Run smoke tests against Swagger endpoints.

## Failure Modes

- Missing address or signer or RPC: gateway falls back to mock mode.
- Invalid ABI JSON/path: gateway falls back to default embedded ABI.
- Signature mismatch at runtime: contract call throws and the API returns an error.

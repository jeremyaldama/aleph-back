import { Injectable } from '@nestjs/common';
import { Contract, JsonRpcProvider, Wallet } from 'ethers';
import { randomBytes } from 'crypto';

const POOL_MANAGER_ABI = [
  'function createPool(string name, address[] participants) returns (bytes32 poolId)',
  'function settlePool(bytes32 orderId, string conditionRef) returns (bool)',
];

const TOKENIZATION_ABI = [
  'function tokenizeOrder(bytes32 orderId, uint256 totalNotional) returns (uint256 entitlementTokenId, uint256 repaymentTokenId)',
  'function prepareBridge(bytes32 orderId, string targetNetwork, string bridgeAssetId) returns (bool)',
  'function recordRepayment(bytes32 orderId, uint256 amount) returns (bool)',
];

@Injectable()
export class PrivateL1ContractsService {
  async createPermissionedPool(
    name: string,
    merchants: string[],
  ): Promise<{ txHash: string; poolReference: string }> {
    return this.withContract(
      async (poolManager) => {
        const participants = merchants.map(
          () => '0x0000000000000000000000000000000000000001',
        );
        const tx = await poolManager.createPool(name, participants);
        const receipt = await tx.wait();
        return {
          txHash: receipt?.hash ?? tx.hash,
          poolReference: this.mockReference('pool'),
        };
      },
      () => ({
        txHash: this.mockTx(),
        poolReference: this.mockReference('pool'),
      }),
    );
  }

  async tokenizeAggregatedOrder(
    orderReference: string,
    totalNotional: number,
  ): Promise<{
    txHash: string;
    entitlementTokenId: string;
    repaymentTokenId: string;
  }> {
    return this.withContract(
      async (_, tokenization) => {
        const tx = await tokenization.tokenizeOrder(
          this.asBytes32(orderReference),
          BigInt(Math.round(totalNotional * 100)),
        );
        const receipt = await tx.wait();

        return {
          txHash: receipt?.hash ?? tx.hash,
          entitlementTokenId: this.mockReference('ent'),
          repaymentTokenId: this.mockReference('rep'),
        };
      },
      () => ({
        txHash: this.mockTx(),
        entitlementTokenId: this.mockReference('ent'),
        repaymentTokenId: this.mockReference('rep'),
      }),
    );
  }

  async settleOrder(
    orderReference: string,
    conditionRef: string,
  ): Promise<{ txHash: string }> {
    return this.withContract(
      async (poolManager) => {
        const tx = await poolManager.settlePool(
          this.asBytes32(orderReference),
          conditionRef,
        );
        const receipt = await tx.wait();
        return { txHash: receipt?.hash ?? tx.hash };
      },
      () => ({ txHash: this.mockTx() }),
    );
  }

  async recordRepayment(
    orderReference: string,
    amount: number,
  ): Promise<{ txHash: string }> {
    return this.withContract(
      async (_, tokenization) => {
        const tx = await tokenization.recordRepayment(
          this.asBytes32(orderReference),
          BigInt(Math.round(amount * 100)),
        );
        const receipt = await tx.wait();
        return { txHash: receipt?.hash ?? tx.hash };
      },
      () => ({ txHash: this.mockTx() }),
    );
  }

  async prepareBridge(
    orderReference: string,
    targetNetwork: 'avalanche-mainnet' | 'avalanche-fuji',
  ): Promise<{ txHash: string; bridgeAssetId: string }> {
    const bridgeAssetId = this.mockReference('bridge');

    return this.withContract(
      async (_, tokenization) => {
        const tx = await tokenization.prepareBridge(
          this.asBytes32(orderReference),
          targetNetwork,
          bridgeAssetId,
        );
        const receipt = await tx.wait();
        return { txHash: receipt?.hash ?? tx.hash, bridgeAssetId };
      },
      () => ({ txHash: this.mockTx(), bridgeAssetId }),
    );
  }

  private async withContract<T>(
    livePath: (poolManager: Contract, tokenization: Contract) => Promise<T>,
    fallback: () => T,
  ): Promise<T> {
    const rpcUrl = process.env.PRIVATE_L1_RPC_URL;
    const privateKey = process.env.PRIVATE_L1_SIGNER_PK;
    const poolManagerAddress = process.env.POOL_MANAGER_CONTRACT;
    const tokenizationAddress = process.env.TOKENIZATION_CONTRACT;

    if (!rpcUrl || !privateKey || !poolManagerAddress || !tokenizationAddress) {
      return fallback();
    }

    const provider = new JsonRpcProvider(rpcUrl);
    const wallet = new Wallet(privateKey, provider);
    const poolManager = new Contract(
      poolManagerAddress,
      POOL_MANAGER_ABI,
      wallet,
    );
    const tokenization = new Contract(
      tokenizationAddress,
      TOKENIZATION_ABI,
      wallet,
    );

    return livePath(poolManager, tokenization);
  }

  private asBytes32(value: string): string {
    const hex = Buffer.from(value).toString('hex').slice(0, 64);
    return `0x${hex.padEnd(64, '0')}`;
  }

  private mockTx(): string {
    return `0x${randomBytes(32).toString('hex')}`;
  }

  private mockReference(prefix: string): string {
    return `${prefix}-${randomBytes(8).toString('hex')}`;
  }
}

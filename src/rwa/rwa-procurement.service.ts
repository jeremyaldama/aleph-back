import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { MerchantVerificationService } from './merchant-verification.service';
import { OrderEncryptionService } from './order-encryption.service';
import { PrivateL1ContractsService } from './private-l1-contracts.service';
import { RwaLogService } from './rwa-log.service';
import type { UserRole } from '../auth/auth.types';
import type {
  AggregatedOrder,
  MerchantOrderCommitment,
  MerchantProfile,
  PurchasePool,
  RepaymentRecord,
  PoolProgress,
  RetailerDashboardProducts,
  RwaLifecycleStatus,
  RwaLogEntry,
} from './rwa.types';
import type {
  AggregateOrderDto,
  CommitOrderDto,
  CreatePoolDto,
  FinanceOrderDto,
  PrepareBridgeDto,
  RecordRepaymentDto,
  SeedMockCommitmentsDto,
  TokenizeOrderDto,
  TriggerSettlementDto,
  VerifyMerchantDto,
} from './dto/rwa.dto';

@Injectable()
export class RwaProcurementService {
  private readonly merchants = new Map<string, MerchantProfile>();
  private readonly pools = new Map<string, PurchasePool>();
  private readonly commitments = new Map<string, MerchantOrderCommitment>();
  private readonly orders = new Map<string, AggregatedOrder>();

  constructor(
    private readonly merchantVerificationService: MerchantVerificationService,
    private readonly encryptionService: OrderEncryptionService,
    private readonly contractsService: PrivateL1ContractsService,
    private readonly logService: RwaLogService,
  ) {}

  getRetailerDashboardProducts(
    retailerId: string,
    role: UserRole,
  ): RetailerDashboardProducts {
    if (role !== 'retailer') {
      throw new ForbiddenException(
        'Only retailer accounts can access retailer dashboard products',
      );
    }

    const now = new Date().toISOString();
    const products = [
      {
        sku: 'cooking-oil-5l',
        name: 'Cooking Oil 5L',
        category: 'Essential Groceries',
        supplierName: 'Andes Wholesale Supply',
        unit: 'container',
        unitPrice: 18.75,
        minimumOrderQuantity: 20,
        availableQuantity: 1400,
        imageUrl: 'https://images.example.com/products/cooking-oil-5l.png',
        tags: ['high-turnover', 'price-protected'],
        updatedAt: now,
      },
      {
        sku: 'rice-25kg-premium',
        name: 'Premium Rice 25kg',
        category: 'Dry Goods',
        supplierName: 'Pacific Grain Partners',
        unit: 'bag',
        unitPrice: 27.4,
        minimumOrderQuantity: 12,
        availableQuantity: 920,
        imageUrl: 'https://images.example.com/products/rice-25kg-premium.png',
        tags: ['bulk-discount', 'stable-demand'],
        updatedAt: now,
      },
      {
        sku: 'sugar-50kg',
        name: 'Refined Sugar 50kg',
        category: 'Dry Goods',
        supplierName: 'Sierra Food Distributors',
        unit: 'sack',
        unitPrice: 34.1,
        minimumOrderQuantity: 10,
        availableQuantity: 600,
        imageUrl: 'https://images.example.com/products/sugar-50kg.png',
        tags: ['seasonal', 'margin-sensitive'],
        updatedAt: now,
      },
      {
        sku: 'milk-uht-1l-box',
        name: 'UHT Milk 1L (Box of 12)',
        category: 'Dairy & Beverages',
        supplierName: 'Valle Cold Chain',
        unit: 'box',
        unitPrice: 13.95,
        minimumOrderQuantity: 15,
        availableQuantity: 1180,
        imageUrl: 'https://images.example.com/products/milk-uht-1l-box.png',
        tags: ['fast-moving', 'weekly-restock'],
        updatedAt: now,
      },
    ];

    this.logService.emit('info', 'retailer.dashboard.products.viewed', {
      retailerId,
      products: products.length,
      mocked: true,
    });

    return {
      retailerId,
      currency: 'USD',
      products,
      generatedAt: now,
      mocked: true,
    };
  }

  async createPool(dto: CreatePoolDto): Promise<PurchasePool> {
    const poolId = this.makeId('pool');
    const onChain = await this.contractsService.createPermissionedPool(
      dto.name,
      dto.allowedMerchants,
    );

    const pool: PurchasePool = {
      poolId,
      name: dto.name,
      thresholdQuantity: dto.thresholdQuantity ?? 1,
      permissioned: true,
      allowedMerchants: dto.allowedMerchants,
      createdAt: new Date().toISOString(),
      chainPoolAddress: onChain.poolReference,
      status: 'open',
    };

    this.pools.set(poolId, pool);
    this.logService.emit('info', 'pool.created', {
      poolId,
      txHash: onChain.txHash,
      allowedMerchants: dto.allowedMerchants.length,
    });

    return pool;
  }

  verifyMerchant(dto: VerifyMerchantDto): MerchantProfile {
    const profile = this.merchantVerificationService.verify(
      dto.merchantId,
      dto.legalName,
      dto.jurisdiction,
      dto.metadata,
    );

    this.merchants.set(profile.merchantId, profile);
    this.logService.emit(
      profile.status === 'verified' ? 'info' : 'warn',
      'merchant.verified',
      {
        merchantId: profile.merchantId,
        status: profile.status,
      },
    );

    return profile;
  }

  commitOrder(dto: CommitOrderDto): MerchantOrderCommitment {
    const pool = this.mustPool(dto.poolId);
    if (!dto.merchantId) {
      throw new Error('merchantId is required for commitment submissions');
    }

    let merchant = this.merchants.get(dto.merchantId);
    if (!merchant) {
      merchant = this.merchantVerificationService.verify(
        dto.merchantId,
        `Merchant ${dto.merchantId}`,
        'UNSPECIFIED',
        { source: 'auto-bootstrap-on-commit' },
      );
      this.merchants.set(merchant.merchantId, merchant);
      this.logService.emit('info', 'merchant.auto_bootstrapped', {
        merchantId: merchant.merchantId,
        status: merchant.status,
      });
    }

    if (merchant.status !== 'verified') {
      throw new Error(`Merchant ${merchant.merchantId} is not verified`);
    }

    if (!pool.allowedMerchants.includes(dto.merchantId)) {
      throw new Error(
        `Merchant ${dto.merchantId} is not allowed in pool ${pool.poolId}`,
      );
    }

    const { encryptedPayload, hash } = this.encryptionService.encrypt({
      poolId: dto.poolId,
      merchantId: dto.merchantId,
      sku: dto.sku,
      quantity: dto.quantity,
      unitPrice: dto.unitPrice,
      notes: dto.notes,
    });

    const commitment: MerchantOrderCommitment = {
      commitmentId: this.makeId('commitment'),
      poolId: dto.poolId,
      merchantId: dto.merchantId,
      sku: dto.sku,
      quantity: dto.quantity,
      unitPrice: dto.unitPrice,
      encryptedPayload,
      hash,
      committedAt: new Date().toISOString(),
    };

    this.commitments.set(commitment.commitmentId, commitment);
    this.logService.emit('info', 'order.commitment.recorded', {
      commitmentId: commitment.commitmentId,
      poolId: commitment.poolId,
      merchantId: commitment.merchantId,
    });

    return commitment;
  }

  aggregateDemand(dto: AggregateOrderDto): AggregatedOrder {
    const pool = this.mustPool(dto.poolId);
    const progress = this.getPoolProgress(dto.poolId);
    const poolCommitments = Array.from(this.commitments.values()).filter(
      (commitment) => commitment.poolId === dto.poolId,
    );

    if (!poolCommitments.length) {
      throw new Error(`No commitments found for pool ${dto.poolId}`);
    }

    if (!progress.canAggregate) {
      throw new BadRequestException({
        code: 'threshold_not_met',
        message: `Pool ${dto.poolId} has not met minimum quantity threshold`,
        poolId: dto.poolId,
        thresholdQuantity: progress.thresholdQuantity,
        committedQuantity: progress.committedQuantity,
        missingQuantity: progress.missingQuantity,
      });
    }

    const totalQuantity = poolCommitments.reduce(
      (sum, commitment) => sum + commitment.quantity,
      0,
    );
    const totalNotional = poolCommitments.reduce(
      (sum, commitment) => sum + commitment.quantity * commitment.unitPrice,
      0,
    );

    const order: AggregatedOrder = {
      orderId: this.makeId('order'),
      poolId: pool.poolId,
      totalQuantity,
      weightedUnitPrice: Number((totalNotional / totalQuantity).toFixed(2)),
      totalNotional: Number(totalNotional.toFixed(2)),
      participatingMerchants: new Set(poolCommitments.map((c) => c.merchantId))
        .size,
      commitmentIds: poolCommitments.map(
        (commitment) => commitment.commitmentId,
      ),
      status: 'structured',
      createdAt: new Date().toISOString(),
      repayments: [],
    };

    this.orders.set(order.orderId, order);
    this.logService.emit('info', 'order.aggregated', {
      orderId: order.orderId,
      poolId: order.poolId,
      totalNotional: order.totalNotional,
      thresholdQuantity: pool.thresholdQuantity,
    });

    return order;
  }

  getPoolProgress(poolId: string): PoolProgress {
    const pool = this.mustPool(poolId);
    const poolCommitments = Array.from(this.commitments.values()).filter(
      (commitment) => commitment.poolId === poolId,
    );
    const committedQuantity = poolCommitments.reduce(
      (sum, commitment) => sum + commitment.quantity,
      0,
    );
    const participatingMerchants = new Set(
      poolCommitments.map((commitment) => commitment.merchantId),
    ).size;
    const missingQuantity = Math.max(
      0,
      pool.thresholdQuantity - committedQuantity,
    );

    return {
      poolId,
      thresholdQuantity: pool.thresholdQuantity,
      committedQuantity,
      participatingMerchants,
      canAggregate: committedQuantity >= pool.thresholdQuantity,
      missingQuantity,
    };
  }

  seedMockCommitmentsForPool(
    poolId: string,
    dto: SeedMockCommitmentsDto,
  ): MerchantOrderCommitment[] {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException(
        'Mock commitment seeding is disabled in production',
      );
    }

    const pool = this.mustPool(poolId);
    const merchantIds = dto.merchantIds?.length
      ? dto.merchantIds
      : pool.allowedMerchants;

    if (!merchantIds.length) {
      throw new BadRequestException(
        'No merchants available to seed commitments',
      );
    }

    const quantity = dto.quantity ?? 120;
    const unitPrice = dto.unitPrice ?? 18.5;
    const seeded = merchantIds.map((merchantId, index) =>
      this.commitOrder({
        poolId,
        merchantId,
        sku: `seeded-sku-${index + 1}`,
        quantity,
        unitPrice,
        notes: 'generated-by-dev-seed-endpoint',
      }),
    );

    this.logService.emit('warn', 'pool.commitments.seeded.mock', {
      poolId,
      commitments: seeded.length,
      quantity,
      unitPrice,
    });

    return seeded;
  }

  async tokenize(dto: TokenizeOrderDto): Promise<AggregatedOrder> {
    const order = this.mustOrder(dto.orderId);
    const onChain = await this.contractsService.tokenizeAggregatedOrder(
      order.orderId,
      order.totalNotional,
    );

    order.tokenization = {
      entitlementTokenId: onChain.entitlementTokenId,
      repaymentTokenId: onChain.repaymentTokenId,
      txHash: onChain.txHash,
      tokenizedAt: new Date().toISOString(),
    };
    order.status = 'tokenized';

    this.logService.emit('info', 'order.tokenized', {
      orderId: order.orderId,
      txHash: onChain.txHash,
    });

    return order;
  }

  finance(dto: FinanceOrderDto): AggregatedOrder {
    const order = this.mustOrder(dto.orderId);

    order.financing = {
      financierId: dto.financierId,
      amount: dto.amount,
      annualizedRateBps: dto.annualizedRateBps,
      tenorDays: dto.tenorDays,
      txHash: this.makeTx(),
      fundedAt: new Date().toISOString(),
    };
    order.status = 'funded';

    this.logService.emit('info', 'order.financed', {
      orderId: order.orderId,
      financierId: dto.financierId,
      amount: dto.amount,
    });

    return order;
  }

  async settle(dto: TriggerSettlementDto): Promise<AggregatedOrder> {
    const order = this.mustOrder(dto.orderId);
    const onChain = await this.contractsService.settleOrder(
      order.orderId,
      dto.conditionRef,
    );

    order.settlement = {
      conditionRef: dto.conditionRef,
      txHash: onChain.txHash,
      settledAt: new Date().toISOString(),
    };
    order.status = 'settled';

    this.logService.emit('info', 'order.settled', {
      orderId: order.orderId,
      txHash: onChain.txHash,
    });

    return order;
  }

  async recordRepayment(dto: RecordRepaymentDto): Promise<AggregatedOrder> {
    const order = this.mustOrder(dto.orderId);
    const onChain = await this.contractsService.recordRepayment(
      order.orderId,
      dto.amount,
    );

    const repayment: RepaymentRecord = {
      repaymentId: this.makeId('repayment'),
      amount: dto.amount,
      txHash: onChain.txHash,
      paidAt: new Date().toISOString(),
    };

    order.repayments.push(repayment);
    order.status = 'in_repayment';

    const repaidAmount = order.repayments.reduce(
      (sum, item) => sum + item.amount,
      0,
    );
    if (order.financing && repaidAmount >= order.financing.amount) {
      order.status = 'repaid';
    }

    this.logService.emit('info', 'order.repayment.recorded', {
      orderId: order.orderId,
      repaymentId: repayment.repaymentId,
      amount: dto.amount,
      cumulativeRepaid: Number(repaidAmount.toFixed(2)),
    });

    return order;
  }

  async prepareBridge(dto: PrepareBridgeDto): Promise<AggregatedOrder> {
    const order = this.mustOrder(dto.orderId);
    const onChain = await this.contractsService.prepareBridge(
      order.orderId,
      dto.targetNetwork,
    );

    order.bridgePreparation = {
      targetNetwork: dto.targetNetwork,
      bridgeAssetId: onChain.bridgeAssetId,
      txHash: onChain.txHash,
      preparedAt: new Date().toISOString(),
      metadata: dto.metadata,
    };

    this.logService.emit('info', 'order.bridge.prepared', {
      orderId: order.orderId,
      targetNetwork: dto.targetNetwork,
      bridgeAssetId: onChain.bridgeAssetId,
      txHash: onChain.txHash,
    });

    return order;
  }

  getLifecycleStatus(): RwaLifecycleStatus {
    const orders = Array.from(this.orders.values());
    const verifiedMerchants = Array.from(this.merchants.values()).filter(
      (merchant) => merchant.status === 'verified',
    ).length;

    return {
      pools: this.pools.size,
      verifiedMerchants,
      aggregatedOrders: orders.length,
      fundedOrders: orders.filter((order) => order.status === 'funded').length,
      settledOrders: orders.filter((order) => order.status === 'settled')
        .length,
      repaidOrders: orders.filter((order) => order.status === 'repaid').length,
    };
  }

  getPool(poolId: string): PurchasePool {
    return this.mustPool(poolId);
  }

  getOrder(orderId: string): AggregatedOrder {
    return this.mustOrder(orderId);
  }

  listOrders(): AggregatedOrder[] {
    return Array.from(this.orders.values());
  }

  getLogs(limit = 200): RwaLogEntry[] {
    return this.logService.getRecent(limit);
  }

  streamLogs(): Observable<{ data: RwaLogEntry }> {
    return this.logService.stream().pipe(map((entry) => ({ data: entry })));
  }

  private mustPool(poolId: string): PurchasePool {
    const pool = this.pools.get(poolId);
    if (!pool) {
      throw new NotFoundException(`Pool ${poolId} not found`);
    }

    return pool;
  }

  private mustMerchant(merchantId: string): MerchantProfile {
    const merchant = this.merchants.get(merchantId);
    if (!merchant) {
      throw new NotFoundException(`Merchant ${merchantId} not found`);
    }

    return merchant;
  }

  private mustOrder(orderId: string): AggregatedOrder {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    return order;
  }

  private makeId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private makeTx(): string {
    return `0x${Math.random().toString(16).slice(2).padEnd(64, '0').slice(0, 64)}`;
  }
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TokenizationRecordDto {
  @ApiProperty({ example: 'ent-18f9a35a476f8575' })
  entitlementTokenId!: string;

  @ApiProperty({ example: 'rep-74ba5732ba6f2a2d' })
  repaymentTokenId!: string;

  @ApiProperty({
    example:
      '0x8e78a1f07a66d4a18e2d2ff1f97f6fdb8bd38c302618b81ee497df396a0508f1',
  })
  txHash!: string;

  @ApiProperty({ example: '2026-03-21T21:19:25.000Z' })
  tokenizedAt!: string;
}

export class FinancingRecordDto {
  @ApiProperty({ example: 'supplier-credit-desk-01' })
  financierId!: string;

  @ApiProperty({ example: 125000.5 })
  amount!: number;

  @ApiProperty({ example: 1450 })
  annualizedRateBps!: number;

  @ApiProperty({ example: 45 })
  tenorDays!: number;

  @ApiProperty({
    example:
      '0x5f8e4b5dc9e845f7f73b0b8a43c77b4f5f604f5078b25d7f8114bf3f4a26e0a2',
  })
  txHash!: string;

  @ApiProperty({ example: '2026-03-21T21:30:12.000Z' })
  fundedAt!: string;
}

export class SettlementRecordDto {
  @ApiProperty({ example: 'delivery-confirmed-and-invoice-matched' })
  conditionRef!: string;

  @ApiProperty({
    example:
      '0x816f43c1f8bb99f7d99e50b8ce8c341e09d11fffd947cc10fef571f782244177',
  })
  txHash!: string;

  @ApiProperty({ example: '2026-03-21T22:10:50.000Z' })
  settledAt!: string;
}

export class RepaymentRecordDto {
  @ApiProperty({ example: 'repayment-1711033443000-51d2j0m2' })
  repaymentId!: string;

  @ApiProperty({ example: 25000 })
  amount!: number;

  @ApiProperty({
    example:
      '0x9c02f0410ec6ca65535ff82011be2f66a8495f07d6203ebca342b266e7d7beec',
  })
  txHash!: string;

  @ApiProperty({ example: '2026-03-22T08:20:10.000Z' })
  paidAt!: string;
}

export class BridgePreparationDto {
  @ApiProperty({
    enum: ['avalanche-mainnet', 'avalanche-fuji'],
    example: 'avalanche-fuji',
  })
  targetNetwork!: 'avalanche-mainnet' | 'avalanche-fuji';

  @ApiProperty({ example: 'bridge-7ffb4a20f3702b1b' })
  bridgeAssetId!: string;

  @ApiProperty({
    example:
      '0x260c7ef0eef0c8dbe65ea76190f8ec816f9efe8dca8e0e08df6f13f2c87f5f18',
  })
  txHash!: string;

  @ApiProperty({ example: '2026-03-22T10:14:32.000Z' })
  preparedAt!: string;

  @ApiPropertyOptional({ type: Object })
  metadata?: Record<string, unknown>;
}

export class MerchantProfileResponseDto {
  @ApiProperty({ example: 'merchant-001' })
  merchantId!: string;

  @ApiProperty({ example: 'Retailer ABC Ltd.' })
  legalName!: string;

  @ApiProperty({ example: 'MX' })
  jurisdiction!: string;

  @ApiProperty({
    enum: ['pending', 'verified', 'rejected'],
    example: 'verified',
  })
  status!: 'pending' | 'verified' | 'rejected';

  @ApiPropertyOptional({ example: '2026-03-21T19:10:30.000Z' })
  verifiedAt?: string;

  @ApiPropertyOptional({ type: Object })
  metadata?: Record<string, unknown>;
}

export class PurchasePoolResponseDto {
  @ApiProperty({ example: 'pool-1711032191000-q9s9p2mz' })
  poolId!: string;

  @ApiProperty({ example: 'North Zone Q2 Procurement Pool' })
  name!: string;

  @ApiProperty({ example: true })
  permissioned!: boolean;

  @ApiProperty({ type: [String], example: ['merchant-001', 'merchant-002'] })
  allowedMerchants!: string[];

  @ApiProperty({ example: '2026-03-21T20:05:11.000Z' })
  createdAt!: string;

  @ApiPropertyOptional({ example: 'pool-44d8ca89d2b19b8a' })
  chainPoolAddress?: string;

  @ApiProperty({
    enum: ['draft', 'open', 'committed', 'funded', 'settled'],
    example: 'open',
  })
  status!: 'draft' | 'open' | 'committed' | 'funded' | 'settled';

  @ApiProperty({ example: 500 })
  thresholdQuantity!: number;
}

export class PoolProgressResponseDto {
  @ApiProperty({ example: 'pool-1711032191000-q9s9p2mz' })
  poolId!: string;

  @ApiProperty({ example: 500 })
  thresholdQuantity!: number;

  @ApiProperty({ example: 360 })
  committedQuantity!: number;

  @ApiProperty({ example: 3 })
  participatingMerchants!: number;

  @ApiProperty({ example: false })
  canAggregate!: boolean;

  @ApiProperty({ example: 140 })
  missingQuantity!: number;
}

export class MerchantOrderCommitmentResponseDto {
  @ApiProperty({ example: 'commitment-1711032287440-v3g2f8qk' })
  commitmentId!: string;

  @ApiProperty({ example: 'pool-1711032191000-q9s9p2mz' })
  poolId!: string;

  @ApiProperty({ example: 'merchant-001' })
  merchantId!: string;

  @ApiProperty({ example: 'cooking-oil-5l' })
  sku!: string;

  @ApiProperty({ example: 120 })
  quantity!: number;

  @ApiProperty({ example: 18.75 })
  unitPrice!: number;

  @ApiProperty({ example: 'AQQ4oB6h4NbcY2U...' })
  encryptedPayload!: string;

  @ApiProperty({
    example: 'a5850f2e6c11f99d8b4f91fb8fcb4e74cc4385dc323f928456fca2d2b49d53ab',
  })
  hash!: string;

  @ApiProperty({ example: '2026-03-21T20:12:00.000Z' })
  committedAt!: string;
}

export class AggregatedOrderResponseDto {
  @ApiProperty({ example: 'order-1711033191000-y2d4l8pr' })
  orderId!: string;

  @ApiProperty({ example: 'pool-1711032191000-q9s9p2mz' })
  poolId!: string;

  @ApiProperty({ example: 860 })
  totalQuantity!: number;

  @ApiProperty({ example: 19.2 })
  weightedUnitPrice!: number;

  @ApiProperty({ example: 16512 })
  totalNotional!: number;

  @ApiProperty({ example: 4 })
  participatingMerchants!: number;

  @ApiProperty({ type: [String], example: ['commitment-1', 'commitment-2'] })
  commitmentIds!: string[];

  @ApiProperty({
    enum: [
      'collecting',
      'structured',
      'tokenized',
      'funded',
      'settled',
      'in_repayment',
      'repaid',
    ],
    example: 'structured',
  })
  status!:
    | 'collecting'
    | 'structured'
    | 'tokenized'
    | 'funded'
    | 'settled'
    | 'in_repayment'
    | 'repaid';

  @ApiProperty({ example: '2026-03-21T20:25:00.000Z' })
  createdAt!: string;

  @ApiPropertyOptional({ type: () => TokenizationRecordDto })
  tokenization?: TokenizationRecordDto;

  @ApiPropertyOptional({ type: () => FinancingRecordDto })
  financing?: FinancingRecordDto;

  @ApiPropertyOptional({ type: () => SettlementRecordDto })
  settlement?: SettlementRecordDto;

  @ApiProperty({ type: () => [RepaymentRecordDto] })
  repayments!: RepaymentRecordDto[];

  @ApiPropertyOptional({ type: () => BridgePreparationDto })
  bridgePreparation?: BridgePreparationDto;
}

export class RwaLifecycleStatusResponseDto {
  @ApiProperty({ example: 2 })
  pools!: number;

  @ApiProperty({ example: 8 })
  verifiedMerchants!: number;

  @ApiProperty({ example: 4 })
  aggregatedOrders!: number;

  @ApiProperty({ example: 3 })
  fundedOrders!: number;

  @ApiProperty({ example: 2 })
  settledOrders!: number;

  @ApiProperty({ example: 1 })
  repaidOrders!: number;
}

export class RetailerDashboardProductResponseDto {
  @ApiProperty({ example: 'cooking-oil-5l' })
  sku!: string;

  @ApiProperty({ example: 'Cooking Oil 5L' })
  name!: string;

  @ApiProperty({ example: 'Essential Groceries' })
  category!: string;

  @ApiProperty({ example: 'Andes Wholesale Supply' })
  supplierName!: string;

  @ApiProperty({ example: 'container' })
  unit!: string;

  @ApiProperty({ example: 18.75 })
  unitPrice!: number;

  @ApiProperty({ example: 20 })
  minimumOrderQuantity!: number;

  @ApiProperty({ example: 1400 })
  availableQuantity!: number;

  @ApiProperty({
    example: 'https://images.example.com/products/cooking-oil-5l.png',
  })
  imageUrl!: string;

  @ApiProperty({
    type: [String],
    example: ['high-turnover', 'price-protected'],
  })
  tags!: string[];

  @ApiProperty({ example: '2026-03-22T11:35:00.000Z' })
  updatedAt!: string;
}

export class RetailerDashboardProductsResponseDto {
  @ApiProperty({ example: 'usr-4f9b4n2z' })
  retailerId!: string;

  @ApiProperty({ example: 'USD' })
  currency!: string;

  @ApiProperty({ type: () => [RetailerDashboardProductResponseDto] })
  products!: RetailerDashboardProductResponseDto[];

  @ApiProperty({ example: '2026-03-22T11:35:02.000Z' })
  generatedAt!: string;

  @ApiProperty({ example: true })
  mocked!: true;
}

export class RwaLogEntryResponseDto {
  @ApiProperty({ example: '1711034077842-yg91n4wz' })
  id!: string;

  @ApiProperty({ example: '2026-03-22T10:18:35.842Z' })
  at!: string;

  @ApiProperty({ enum: ['info', 'warn', 'error'], example: 'info' })
  level!: 'info' | 'warn' | 'error';

  @ApiProperty({ example: 'order.bridge.prepared' })
  event!: string;

  @ApiPropertyOptional({ type: Object })
  context?: Record<string, unknown>;
}

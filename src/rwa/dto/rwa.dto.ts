import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TargetNetwork {
  AVALANCHE_MAINNET = 'avalanche-mainnet',
  AVALANCHE_FUJI = 'avalanche-fuji',
}

export class CreatePoolDto {
  @ApiProperty({ example: 'North Zone Q2 Procurement Pool' })
  name!: string;

  @ApiProperty({
    type: [String],
    example: ['merchant-001', 'merchant-002'],
    description: 'Permissioned merchant IDs allowed to participate in the pool',
  })
  allowedMerchants!: string[];
}

export class VerifyMerchantDto {
  @ApiProperty({ example: 'merchant-001' })
  merchantId!: string;

  @ApiProperty({ example: 'Retailer ABC Ltd.' })
  legalName!: string;

  @ApiProperty({ example: 'MX' })
  jurisdiction!: string;

  @ApiPropertyOptional({
    type: Object,
    example: { taxId: 'ABCD123', businessType: 'grocery' },
  })
  metadata?: Record<string, unknown>;
}

export class CommitOrderDto {
  @ApiProperty({ example: 'pool-1711032191000-q9s9p2mz' })
  poolId!: string;

  @ApiPropertyOptional({
    example: 'merchant-001',
    description:
      'Optional merchant ID override. If omitted, backend uses authenticated user id.',
  })
  merchantId?: string;

  @ApiProperty({ example: 'cooking-oil-5l' })
  sku!: string;

  @ApiProperty({ example: 120 })
  quantity!: number;

  @ApiProperty({ example: 18.75 })
  unitPrice!: number;

  @ApiPropertyOptional({ example: 'Need delivery before next Friday' })
  notes?: string;
}

export class AggregateOrderDto {
  @ApiProperty({ example: 'pool-1711032191000-q9s9p2mz' })
  poolId!: string;
}

export class TokenizeOrderDto {
  @ApiProperty({ example: 'order-1711033191000-y2d4l8pr' })
  orderId!: string;
}

export class FinanceOrderDto {
  @ApiProperty({ example: 'order-1711033191000-y2d4l8pr' })
  orderId!: string;

  @ApiProperty({ example: 'supplier-credit-desk-01' })
  financierId!: string;

  @ApiProperty({ example: 125000.5 })
  amount!: number;

  @ApiProperty({
    example: 1450,
    description: 'Annualized financing rate in basis points',
  })
  annualizedRateBps!: number;

  @ApiProperty({ example: 45 })
  tenorDays!: number;
}

export class TriggerSettlementDto {
  @ApiProperty({ example: 'order-1711033191000-y2d4l8pr' })
  orderId!: string;

  @ApiProperty({ example: 'delivery-confirmed-and-invoice-matched' })
  conditionRef!: string;
}

export class RecordRepaymentDto {
  @ApiProperty({ example: 'order-1711033191000-y2d4l8pr' })
  orderId!: string;

  @ApiProperty({ example: 25000 })
  amount!: number;
}

export class PrepareBridgeDto {
  @ApiProperty({ example: 'order-1711033191000-y2d4l8pr' })
  orderId!: string;

  @ApiProperty({ enum: TargetNetwork, example: TargetNetwork.AVALANCHE_FUJI })
  targetNetwork!: TargetNetwork;

  @ApiPropertyOptional({
    type: Object,
    example: { purpose: 'external-liquidity-window', tranche: 'A' },
  })
  metadata?: Record<string, unknown>;
}

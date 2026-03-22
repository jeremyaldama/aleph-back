export class CreatePoolDto {
  name!: string;
  allowedMerchants!: string[];
}

export class VerifyMerchantDto {
  merchantId!: string;
  legalName!: string;
  jurisdiction!: string;
  metadata?: Record<string, unknown>;
}

export class CommitOrderDto {
  poolId!: string;
  merchantId!: string;
  sku!: string;
  quantity!: number;
  unitPrice!: number;
  notes?: string;
}

export class AggregateOrderDto {
  poolId!: string;
}

export class TokenizeOrderDto {
  orderId!: string;
}

export class FinanceOrderDto {
  orderId!: string;
  financierId!: string;
  amount!: number;
  annualizedRateBps!: number;
  tenorDays!: number;
}

export class TriggerSettlementDto {
  orderId!: string;
  conditionRef!: string;
}

export class RecordRepaymentDto {
  orderId!: string;
  amount!: number;
}

export class PrepareBridgeDto {
  orderId!: string;
  targetNetwork!: 'avalanche-mainnet' | 'avalanche-fuji';
  metadata?: Record<string, unknown>;
}

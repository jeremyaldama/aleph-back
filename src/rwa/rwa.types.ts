export type MerchantVerificationStatus = 'pending' | 'verified' | 'rejected';

export type PoolStatus = 'draft' | 'open' | 'committed' | 'funded' | 'settled';

export type AggregatedOrderStatus =
  | 'collecting'
  | 'structured'
  | 'tokenized'
  | 'funded'
  | 'settled'
  | 'in_repayment'
  | 'repaid';

export interface MerchantProfile {
  merchantId: string;
  legalName: string;
  jurisdiction: string;
  status: MerchantVerificationStatus;
  verifiedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface PurchasePool {
  poolId: string;
  name: string;
  permissioned: boolean;
  allowedMerchants: string[];
  createdAt: string;
  chainPoolAddress?: string;
  status: PoolStatus;
}

export interface MerchantOrderCommitment {
  commitmentId: string;
  poolId: string;
  merchantId: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  encryptedPayload: string;
  hash: string;
  committedAt: string;
}

export interface AggregatedOrder {
  orderId: string;
  poolId: string;
  totalQuantity: number;
  weightedUnitPrice: number;
  totalNotional: number;
  participatingMerchants: number;
  commitmentIds: string[];
  status: AggregatedOrderStatus;
  createdAt: string;
  tokenization?: TokenizationRecord;
  financing?: FinancingRecord;
  settlement?: SettlementRecord;
  repayments: RepaymentRecord[];
  bridgePreparation?: BridgePreparation;
}

export interface TokenizationRecord {
  entitlementTokenId: string;
  repaymentTokenId: string;
  txHash: string;
  tokenizedAt: string;
}

export interface FinancingRecord {
  financierId: string;
  amount: number;
  annualizedRateBps: number;
  tenorDays: number;
  txHash: string;
  fundedAt: string;
}

export interface SettlementRecord {
  conditionRef: string;
  txHash: string;
  settledAt: string;
}

export interface RepaymentRecord {
  repaymentId: string;
  amount: number;
  txHash: string;
  paidAt: string;
}

export interface BridgePreparation {
  targetNetwork: 'avalanche-mainnet' | 'avalanche-fuji';
  bridgeAssetId: string;
  txHash: string;
  preparedAt: string;
  metadata?: Record<string, unknown>;
}

export interface RwaLifecycleStatus {
  pools: number;
  verifiedMerchants: number;
  aggregatedOrders: number;
  fundedOrders: number;
  settledOrders: number;
  repaidOrders: number;
}

export interface RetailerDashboardProduct {
  sku: string;
  name: string;
  category: string;
  supplierName: string;
  unit: string;
  unitPrice: number;
  minimumOrderQuantity: number;
  availableQuantity: number;
  imageUrl: string;
  tags: string[];
  updatedAt: string;
}

export interface RetailerDashboardProducts {
  retailerId: string;
  currency: string;
  products: RetailerDashboardProduct[];
  generatedAt: string;
  mocked: true;
}

export type RwaLogLevel = 'info' | 'warn' | 'error';

export interface RwaLogEntry {
  id: string;
  at: string;
  level: RwaLogLevel;
  event: string;
  context?: Record<string, unknown>;
}

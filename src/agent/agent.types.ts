export interface ServiceProvider {
  id: string;
  name: string;
  endpoint: string;
  price: number;
  qualityScore: number;
  timeoutMs?: number;
  headers?: Record<string, string>;
}

export interface AgentStartOptions {
  cycleIntervalMs?: number;
  requestPayload?: Record<string, unknown>;
  providers?: ServiceProvider[];
}

export interface ProviderScore {
  provider: ServiceProvider;
  score: number;
  expectedLatencyMs: number;
}

export interface X402PaymentRequest {
  amountWei: string;
  recipient: string;
  tokenAddress?: string;
  endpointId?: string;
  nonce?: string;
}

export interface PaymentProof {
  txHash: string;
  proof: string;
  chainId: number;
  paidAt: string;
}

export interface ProviderRequestResult {
  status: 'success' | 'payment_required';
  payload?: unknown;
  paymentRequest?: X402PaymentRequest;
  latencyMs: number;
}

export type AgentLogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface AgentLogEntry {
  id: string;
  level: AgentLogLevel;
  at: string;
  message: string;
  context?: Record<string, unknown>;
}

export interface AgentStatus {
  running: boolean;
  cycleIntervalMs: number;
  cycleCount: number;
  lastProviderId?: string;
  lastSuccessAt?: string;
  lastError?: string;
  providersConfigured: number;
}

import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { AvalanchePaymentService } from './avalanche-payment.service';
import { AgentLogService } from './agent-log.service';
import {
  AgentLogEntry,
  AgentStartOptions,
  AgentStatus,
  ProviderScore,
  ServiceProvider,
} from './agent.types';
import { X402ClientService } from './x402-client.service';

const DEFAULT_CYCLE_MS = 10_000;
const MIN_CYCLE_MS = 1_000;

const DEFAULT_PROVIDERS: ServiceProvider[] = [
  {
    id: 'provider-alpha',
    name: 'Provider Alpha',
    endpoint: 'http://localhost:4001/x402/service',
    price: 0.12,
    qualityScore: 0.92,
    timeoutMs: 10_000,
  },
  {
    id: 'provider-beta',
    name: 'Provider Beta',
    endpoint: 'http://localhost:4002/x402/service',
    price: 0.09,
    qualityScore: 0.87,
    timeoutMs: 10_000,
  },
];

@Injectable()
export class AutonomousAgentService implements OnModuleDestroy {
  private running = false;
  private timer: NodeJS.Timeout | null = null;
  private cycleIntervalMs = DEFAULT_CYCLE_MS;
  private cycleCount = 0;
  private providers: ServiceProvider[] = [...DEFAULT_PROVIDERS];
  private requestPayload: Record<string, unknown> = { prompt: 'health-check' };
  private providerLatency = new Map<string, number>();
  private lastProviderId?: string;
  private lastSuccessAt?: string;
  private lastError?: string;

  constructor(
    private readonly x402Client: X402ClientService,
    private readonly paymentService: AvalanchePaymentService,
    private readonly logService: AgentLogService,
  ) {}

  start(options: AgentStartOptions = {}): AgentStatus {
    if (options.providers?.length) {
      this.providers = options.providers;
    }

    if (options.requestPayload) {
      this.requestPayload = options.requestPayload;
    }

    if (options.cycleIntervalMs) {
      this.cycleIntervalMs = Math.max(options.cycleIntervalMs, MIN_CYCLE_MS);
    }

    if (this.running) {
      return this.getStatus();
    }

    this.running = true;
    this.logService.log('info', 'Agent started', {
      cycleIntervalMs: this.cycleIntervalMs,
      providersConfigured: this.providers.length,
    });

    this.scheduleLoop();
    return this.getStatus();
  }

  stop(): AgentStatus {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    this.running = false;
    this.logService.log('info', 'Agent stopped');
    return this.getStatus();
  }

  async runSingleCycle(): Promise<void> {
    if (!this.providers.length) {
      throw new Error('No providers configured for autonomous agent');
    }

    this.cycleCount += 1;
    this.logService.log('debug', 'Starting cycle', { cycle: this.cycleCount });

    const ranking = this.rankProviders();
    const selected = ranking[0];

    this.lastProviderId = selected.provider.id;
    this.logService.log('info', 'Provider selected', {
      cycle: this.cycleCount,
      providerId: selected.provider.id,
      score: Number(selected.score.toFixed(4)),
      expectedLatencyMs: selected.expectedLatencyMs,
    });

    try {
      const initial = await this.x402Client.callProvider(
        selected.provider,
        this.requestPayload,
      );

      this.providerLatency.set(selected.provider.id, initial.latencyMs);

      if (initial.status === 'success') {
        this.lastSuccessAt = new Date().toISOString();
        this.lastError = undefined;
        this.logService.log('info', 'Provider response success', {
          cycle: this.cycleCount,
          providerId: selected.provider.id,
          latencyMs: initial.latencyMs,
          payload: initial.payload,
        });
        return;
      }

      const paymentProof = await this.paymentService.payForRequest(
        initial.paymentRequest!,
        selected.provider.id,
      );

      this.logService.log('info', 'Payment settled on-chain', {
        cycle: this.cycleCount,
        providerId: selected.provider.id,
        txHash: paymentProof.txHash,
        chainId: paymentProof.chainId,
      });

      const retried = await this.x402Client.callProvider(
        selected.provider,
        this.requestPayload,
        paymentProof.proof,
      );

      this.providerLatency.set(selected.provider.id, retried.latencyMs);

      if (retried.status !== 'success') {
        throw new Error('Retry still returned 402 after on-chain payment');
      }

      this.lastSuccessAt = new Date().toISOString();
      this.lastError = undefined;
      this.logService.log('info', 'Paid request completed', {
        cycle: this.cycleCount,
        providerId: selected.provider.id,
        latencyMs: retried.latencyMs,
        payload: retried.payload,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown cycle error';
      this.lastError = message;
      this.logService.log('error', 'Cycle failed', {
        cycle: this.cycleCount,
        providerId: selected.provider.id,
        error: message,
      });
    }
  }

  getStatus(): AgentStatus {
    return {
      running: this.running,
      cycleIntervalMs: this.cycleIntervalMs,
      cycleCount: this.cycleCount,
      lastProviderId: this.lastProviderId,
      lastSuccessAt: this.lastSuccessAt,
      lastError: this.lastError,
      providersConfigured: this.providers.length,
    };
  }

  getLogs(limit = 200): AgentLogEntry[] {
    return this.logService.getRecent(limit);
  }

  getLogsStream(): Observable<{ data: AgentLogEntry }> {
    return this.logService.getStream().pipe(map((entry) => ({ data: entry })));
  }

  onModuleDestroy(): void {
    this.stop();
  }

  private scheduleLoop(): void {
    this.runSingleCycle().catch((error) => {
      const message =
        error instanceof Error ? error.message : 'Unexpected loop failure';
      this.logService.log('error', 'First cycle failed', { error: message });
    });

    this.timer = setInterval(() => {
      void this.runSingleCycle();
    }, this.cycleIntervalMs);
  }

  private rankProviders(): ProviderScore[] {
    const prices = this.providers.map((provider) => provider.price);
    const latencies = this.providers.map(
      (provider) =>
        this.providerLatency.get(provider.id) ?? provider.timeoutMs ?? 15_000,
    );
    const quality = this.providers.map((provider) => provider.qualityScore);

    const priceRange = this.range(prices);
    const latencyRange = this.range(latencies);
    const qualityRange = this.range(quality);

    return this.providers
      .map((provider): ProviderScore => {
        const currentLatency =
          this.providerLatency.get(provider.id) ?? provider.timeoutMs ?? 15_000;

        const normalizedPrice =
          priceRange === 0
            ? 1
            : (Math.max(...prices) - provider.price) / priceRange;

        const normalizedLatency =
          latencyRange === 0
            ? 1
            : (Math.max(...latencies) - currentLatency) / latencyRange;

        const normalizedQuality =
          qualityRange === 0
            ? 1
            : (provider.qualityScore - Math.min(...quality)) / qualityRange;

        const score =
          normalizedPrice * 0.45 +
          normalizedLatency * 0.35 +
          normalizedQuality * 0.2;

        return {
          provider,
          score,
          expectedLatencyMs: currentLatency,
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  private range(values: number[]): number {
    return Math.max(...values) - Math.min(...values);
  }
}

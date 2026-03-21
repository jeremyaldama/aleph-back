import { Injectable } from '@nestjs/common';
import {
  ProviderRequestResult,
  ServiceProvider,
  X402PaymentRequest,
} from './agent.types';

@Injectable()
export class X402ClientService {
  async callProvider(
    provider: ServiceProvider,
    payload: Record<string, unknown>,
    paymentProof?: string,
  ): Promise<ProviderRequestResult> {
    const startedAt = Date.now();
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      ...(provider.headers ?? {}),
    };

    if (paymentProof) {
      headers['x-payment-proof'] = paymentProof;
    }

    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(provider.timeoutMs ?? 15_000),
    });

    const latencyMs = Date.now() - startedAt;

    if (response.status === 402) {
      const paymentRequest = await this.parsePaymentRequest(response);

      return {
        status: 'payment_required',
        paymentRequest,
        latencyMs,
      };
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Provider ${provider.id} failed with status ${response.status}: ${text}`,
      );
    }

    const payloadData = await this.readBody(response);

    return {
      status: 'success',
      payload: payloadData,
      latencyMs,
    };
  }

  private async parsePaymentRequest(
    response: Response,
  ): Promise<X402PaymentRequest> {
    const body = await this.readBody(response);
    const fallbackAmountWei =
      response.headers.get('x402-amount-wei') ?? '1000000000000000';
    const fallbackRecipient =
      response.headers.get('x402-recipient') ??
      '0x0000000000000000000000000000000000000000';

    if (this.isRecord(body)) {
      return {
        amountWei: this.asString(body.amountWei) ?? fallbackAmountWei,
        recipient: this.asString(body.recipient) ?? fallbackRecipient,
        tokenAddress: this.asString(body.tokenAddress),
        endpointId: this.asString(body.endpointId),
        nonce: this.asString(body.nonce),
      };
    }

    return {
      amountWei: fallbackAmountWei,
      recipient: fallbackRecipient,
      endpointId: response.headers.get('x402-endpoint-id') ?? undefined,
      nonce: response.headers.get('x402-nonce') ?? undefined,
    };
  }

  private async readBody(response: Response): Promise<unknown> {
    const contentType =
      response.headers.get('content-type')?.toLowerCase() ?? '';
    if (contentType.includes('application/json')) {
      return response.json();
    }

    const text = await response.text();
    return text.length ? text : null;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private asString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
  }
}

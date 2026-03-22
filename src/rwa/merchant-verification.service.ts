import { Injectable } from '@nestjs/common';
import type { MerchantProfile } from './rwa.types';

@Injectable()
export class MerchantVerificationService {
  private readonly allowlist = new Set(
    (process.env.PERMISSIONED_MERCHANTS ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  );

  verify(
    merchantId: string,
    legalName: string,
    jurisdiction: string,
    metadata?: Record<string, unknown>,
  ): MerchantProfile {
    const isAllowlistEmpty = this.allowlist.size === 0;
    const isUserBackedMerchant = merchantId.startsWith('usr-');
    const isAllowed =
      isAllowlistEmpty ||
      this.allowlist.has(merchantId) ||
      isUserBackedMerchant;

    return {
      merchantId,
      legalName,
      jurisdiction,
      status: isAllowed ? 'verified' : 'rejected',
      verifiedAt: isAllowed ? new Date().toISOString() : undefined,
      metadata,
    };
  }
}

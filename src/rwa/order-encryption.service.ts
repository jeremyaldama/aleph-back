import { createCipheriv, createHash, randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OrderEncryptionService {
  encrypt(payload: Record<string, unknown>): {
    encryptedPayload: string;
    hash: string;
  } {
    const key = this.readKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);

    const plaintext = JSON.stringify(payload);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    const encryptedPayload = Buffer.concat([iv, authTag, encrypted]).toString(
      'base64url',
    );
    const hash = createHash('sha256').update(plaintext).digest('hex');

    return { encryptedPayload, hash };
  }

  private readKey(): Buffer {
    const raw = process.env.ORDER_ENCRYPTION_KEY;
    if (!raw) {
      // Deterministic local key for development environments without secrets.
      return createHash('sha256')
        .update('dev-only-rwa-encryption-key')
        .digest();
    }

    if (raw.length === 64) {
      return Buffer.from(raw, 'hex');
    }

    return createHash('sha256').update(raw).digest();
  }
}

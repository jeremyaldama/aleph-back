import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash, compare } from 'bcryptjs';
import { createCipheriv, createHash, randomBytes } from 'crypto';
import { Wallet } from 'ethers';
import { OAuth2Client } from 'google-auth-library';
import {
  LoginEmailDto,
  LoginGoogleDto,
  SignupEmailDto,
  SignupGoogleDto,
} from './dto/auth.dto';
import { AuthStoreService } from './auth-store.service';
import type {
  AuthTokenPayload,
  AuthUser,
  UserRole,
  WalletRecord,
} from './auth.types';

const FUJI_CHAIN_ID = 43113;
const DEFAULT_FUJI_RPC = 'https://api.avax-test.network/ext/bc/C/rpc';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authStore: AuthStoreService,
  ) {}

  async signupEmail(dto: SignupEmailDto) {
    const email = dto.email.trim().toLowerCase();
    if (!email || !dto.password || !dto.fullName.trim()) {
      throw new BadRequestException(
        'Email, full name and password are required',
      );
    }

    if (await this.authStore.findByEmail(email)) {
      throw new BadRequestException('User already exists for this email');
    }

    const passwordHash = await hash(dto.password, 10);
    const user = this.createUserRecord({
      email,
      fullName: dto.fullName.trim(),
      role: dto.role as UserRole,
      provider: 'email',
      passwordHash,
    });

    await this.authStore.save(user);
    return this.createAuthResponse(user);
  }

  async loginEmail(dto: LoginEmailDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.authStore.findByEmail(email);

    if (!user || user.provider !== 'email' || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.createAuthResponse(user);
  }

  async signupGoogle(dto: SignupGoogleDto) {
    const profile = await this.verifyGoogleToken(dto.idToken);
    const email = profile.email.toLowerCase();

    if (await this.authStore.findByEmail(email)) {
      throw new BadRequestException('User already exists for this email');
    }

    const user = this.createUserRecord({
      email,
      fullName: profile.fullName,
      role: dto.role as UserRole,
      provider: 'google',
      googleSubject: profile.subject,
    });

    await this.authStore.save(user);
    return this.createAuthResponse(user);
  }

  async loginGoogle(dto: LoginGoogleDto) {
    const profile = await this.verifyGoogleToken(dto.idToken);
    const email = profile.email.toLowerCase();
    const user = await this.authStore.findByEmail(email);

    if (!user || user.provider !== 'google') {
      throw new UnauthorizedException('Google account not registered');
    }

    return this.createAuthResponse(user);
  }

  async getProfile(userId: string) {
    const user = await this.authStore.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.publicUser(user);
  }

  async verifyToken(token: string): Promise<AuthTokenPayload> {
    try {
      return await this.jwtService.verifyAsync<AuthTokenPayload>(token, {
        secret: process.env.JWT_SECRET ?? 'dev-jwt-secret-change-me',
      });
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private async verifyGoogleToken(
    idToken: string,
  ): Promise<{ email: string; fullName: string; subject: string }> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new BadRequestException(
        'GOOGLE_CLIENT_ID is not configured on backend',
      );
    }

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload?.email || !payload.sub) {
      throw new UnauthorizedException('Invalid Google token payload');
    }

    return {
      email: payload.email,
      fullName: payload.name ?? payload.email,
      subject: payload.sub,
    };
  }

  private createUserRecord(input: {
    email: string;
    fullName: string;
    role: UserRole;
    provider: 'email' | 'google';
    passwordHash?: string;
    googleSubject?: string;
  }): AuthUser {
    const walletRecord = this.createFujiWallet();

    return {
      id: `usr-${Math.random().toString(36).slice(2, 10)}`,
      email: input.email,
      fullName: input.fullName,
      role: input.role,
      provider: input.provider,
      passwordHash: input.passwordHash,
      googleSubject: input.googleSubject,
      wallet: walletRecord,
      createdAt: new Date().toISOString(),
    };
  }

  private createFujiWallet(): WalletRecord {
    const wallet = Wallet.createRandom();
    const key = this.readWalletEncryptionKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);

    const encrypted = Buffer.concat([
      cipher.update(wallet.privateKey, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    const encryptedPrivateKey = Buffer.concat([
      iv,
      authTag,
      encrypted,
    ]).toString('base64url');

    return {
      network: 'fuji',
      chainId: FUJI_CHAIN_ID,
      rpcUrl: process.env.FUJI_RPC_URL ?? DEFAULT_FUJI_RPC,
      address: wallet.address,
      publicKey: wallet.signingKey.publicKey,
      encryptedPrivateKey,
    };
  }

  private readWalletEncryptionKey(): Buffer {
    const raw = process.env.WALLET_ENCRYPTION_KEY;
    if (!raw) {
      return createHash('sha256').update('dev-wallet-encryption-key').digest();
    }

    if (raw.length === 64) {
      return Buffer.from(raw, 'hex');
    }

    return createHash('sha256').update(raw).digest();
  }

  private createAuthResponse(user: AuthUser) {
    const payload: AuthTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const expiresIn = process.env.JWT_EXPIRES_IN ?? '2h';

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET ?? 'dev-jwt-secret-change-me',
      expiresIn: expiresIn as never,
    });

    return {
      accessToken,
      user: this.publicUser(user),
    };
  }

  private publicUser(user: AuthUser) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      provider: user.provider,
      wallet: {
        network: user.wallet.network,
        chainId: user.wallet.chainId,
        rpcUrl: user.wallet.rpcUrl,
        address: user.wallet.address,
        publicKey: user.wallet.publicKey,
      },
      createdAt: user.createdAt,
    };
  }
}

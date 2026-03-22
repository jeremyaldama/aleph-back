export type UserRole = 'retailer' | 'supplier';
export type AuthProvider = 'email' | 'google';

export interface WalletRecord {
  network: 'fuji';
  chainId: number;
  rpcUrl: string;
  address: string;
  publicKey: string;
  encryptedPrivateKey: string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  provider: AuthProvider;
  passwordHash?: string;
  googleSubject?: string;
  wallet: WalletRecord;
  createdAt: string;
}

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

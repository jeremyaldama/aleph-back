import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import type { AuthUser } from './auth.types';

interface AuthUserRow {
  id: string;
  email: string;
  full_name: string;
  role: 'retailer' | 'supplier';
  provider: 'email' | 'google';
  password_hash: string | null;
  google_subject: string | null;
  wallet_json: unknown;
  created_at: Date;
}

@Injectable()
export class AuthStoreService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool | null = null;
  private readonly usersByEmail = new Map<string, AuthUser>();
  private readonly usersById = new Map<string, AuthUser>();

  async onModuleInit(): Promise<void> {
    if (!this.isPostgresEnabled()) {
      return;
    }

    this.pool = new Pool(this.buildPgConfig());

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS auth_users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL,
        provider TEXT NOT NULL,
        password_hash TEXT,
        google_subject TEXT UNIQUE,
        wallet_json JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL
      )
    `);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  async findByEmail(email: string): Promise<AuthUser | undefined> {
    if (!this.pool) {
      return this.usersByEmail.get(email);
    }

    const result = await this.pool.query<AuthUserRow>(
      'SELECT * FROM auth_users WHERE email = $1 LIMIT 1',
      [email],
    );

    if (!result.rows[0]) {
      return undefined;
    }

    return this.rowToUser(result.rows[0]);
  }

  async findById(id: string): Promise<AuthUser | undefined> {
    if (!this.pool) {
      return this.usersById.get(id);
    }

    const result = await this.pool.query<AuthUserRow>(
      'SELECT * FROM auth_users WHERE id = $1 LIMIT 1',
      [id],
    );

    if (!result.rows[0]) {
      return undefined;
    }

    return this.rowToUser(result.rows[0]);
  }

  async save(user: AuthUser): Promise<void> {
    if (!this.pool) {
      this.usersByEmail.set(user.email, user);
      this.usersById.set(user.id, user);
      return;
    }

    await this.pool.query(
      `
      INSERT INTO auth_users (
        id,
        email,
        full_name,
        role,
        provider,
        password_hash,
        google_subject,
        wallet_json,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        provider = EXCLUDED.provider,
        password_hash = EXCLUDED.password_hash,
        google_subject = EXCLUDED.google_subject,
        wallet_json = EXCLUDED.wallet_json,
        created_at = EXCLUDED.created_at
    `,
      [
        user.id,
        user.email,
        user.fullName,
        user.role,
        user.provider,
        user.passwordHash ?? null,
        user.googleSubject ?? null,
        JSON.stringify(user.wallet),
        user.createdAt,
      ],
    );
  }

  private rowToUser(row: AuthUserRow): AuthUser {
    return {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      role: row.role,
      provider: row.provider,
      passwordHash: row.password_hash ?? undefined,
      googleSubject: row.google_subject ?? undefined,
      wallet: row.wallet_json as AuthUser['wallet'],
      createdAt: row.created_at.toISOString(),
    };
  }

  private isPostgresEnabled(): boolean {
    return (
      process.env.AUTH_STORAGE === 'postgres' ||
      !!process.env.DATABASE_URL ||
      !!process.env.POSTGRES_HOST
    );
  }

  private buildPgConfig(): {
    connectionString?: string;
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
  } {
    if (process.env.DATABASE_URL) {
      return { connectionString: process.env.DATABASE_URL };
    }

    return {
      host: process.env.POSTGRES_HOST ?? 'localhost',
      port: Number(process.env.POSTGRES_PORT ?? 5432),
      user: process.env.POSTGRES_USER ?? 'aleph',
      password: process.env.POSTGRES_PASSWORD ?? 'aleph',
      database: process.env.POSTGRES_DB ?? 'aleph_auth',
    };
  }
}

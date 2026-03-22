import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
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
  private readonly logger = new Logger(AuthStoreService.name);
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
      !!process.env.POSTGRES_HOST ||
      !!process.env.PGHOST
    );
  }

  private buildPgConfig(): {
    connectionString?: string;
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
    ssl?: { rejectUnauthorized: boolean };
  } {
    const connectionString = process.env.DATABASE_URL;
    const sslEnabled = this.isSslEnabled();
    const host = process.env.POSTGRES_HOST ?? process.env.PGHOST;
    const port = Number(
      process.env.POSTGRES_PORT ?? process.env.PGPORT ?? 5432,
    );
    const user = process.env.POSTGRES_USER ?? process.env.PGUSER;
    const password = process.env.POSTGRES_PASSWORD ?? process.env.PGPASSWORD;
    const database = process.env.POSTGRES_DB ?? process.env.PGDATABASE;

    const urlHost = this.readConnectionStringHost(connectionString);
    const effectiveHost = connectionString ? urlHost : (host ?? 'missing');
    const source = connectionString ? 'DATABASE_URL' : 'host/port variables';

    this.logger.log(
      `Postgres config source: ${source}, DATABASE_URL=${connectionString ? 'set' : 'missing'}, effectiveHost=${effectiveHost}, port=${port}, user=${user ? 'set' : 'missing'}, database=${database ?? 'missing'}`,
    );

    if (connectionString) {
      if (
        process.env.NODE_ENV === 'production' &&
        ['localhost', '127.0.0.1', '::1'].includes(urlHost)
      ) {
        throw new Error(
          `DATABASE_URL points to local host (${urlHost}) in production. Use your Render Postgres internal connection string.`,
        );
      }

      return {
        connectionString,
        ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
      };
    }

    if (!host || !user || !database) {
      throw new Error(
        'Postgres auth storage is enabled but database connection variables are missing. Set DATABASE_URL or POSTGRES_/PG* variables in your Render service.',
      );
    }

    return {
      host: host ?? 'localhost',
      port,
      user: user ?? 'aleph',
      password: password ?? 'aleph',
      database: database ?? 'aleph_auth',
      ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
    };
  }

  private isSslEnabled(): boolean {
    const mode = (process.env.PGSSLMODE ?? '').toLowerCase();
    const explicitSsl = (process.env.DATABASE_SSL ?? '').toLowerCase();

    if (explicitSsl === 'true') {
      return true;
    }

    return (
      mode === 'require' ||
      mode === 'prefer' ||
      process.env.NODE_ENV === 'production'
    );
  }

  private readConnectionStringHost(connectionString?: string): string {
    if (!connectionString) {
      return 'missing';
    }

    try {
      return new URL(connectionString).hostname || 'missing';
    } catch {
      return 'invalid-url';
    }
  }
}

import { existsSync } from 'node:fs';
import path from 'node:path';

const ENV_FILE = path.resolve(process.cwd(), '.env');
if (existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE);

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name} (see .env.example)`);
  return value;
}

const DEFAULT_FAKER_SEED = 20260101;

export const env = {
  get baseUrl(): string {
    const url = required('BASE_URL');
    if (!url.startsWith('https://')) throw new Error(`BASE_URL must be https://, got ${url}`);
    return url;
  },
  get userEmail(): string {
    return required('USER_EMAIL');
  },
  get userPassword(): string {
    return required('USER_PASSWORD');
  },
  get adminEmail(): string {
    return required('ADMIN_EMAIL');
  },
  get adminPassword(): string {
    return required('ADMIN_PASSWORD');
  },
  get fakerSeed(): number {
    const raw = process.env.FAKER_SEED;
    if (raw === undefined || raw === '') return DEFAULT_FAKER_SEED;
    const seed = Number(raw);
    if (!Number.isInteger(seed)) throw new Error(`FAKER_SEED must be an integer, got ${raw}`);
    return seed;
  },
  get isCi(): boolean {
    return Boolean(process.env.CI);
  },
};

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import dotenv from 'dotenv';

const LOCAL_API_CORS_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8080',
];

const PRODUCTION_API_CORS_ORIGINS = [
  'https://openstaff.eu',
  'https://backoffice.openstaff.eu',
  'https://api.openstaff.eu',
];

const LOCAL_ENV_FILES = ['.env.local', '.env'];
export const PRODUCTION_SECRETS = [
  'FIREBASE_SERVICE_ACCOUNT_KEY',
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'STRIPE_WEBHOOK_SECRET',
  'GEMINI_API_KEY',
];

export function getApiCorsOrigins(env: NodeJS.ProcessEnv = process.env) {
  const isProduction = env.NODE_ENV === 'production';
  const configuredOrigins = [
    ...(env.CORS_ORIGIN?.split(',') ?? []),
    env.FRONTEND_URL,
    env.ADMIN_URL,
    env.PUBLIC_WEB_URL,
    env.ADMIN_WEB_URL,
  ]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .filter((value) => {
      if (!isProduction) {
        return true;
      }

      return (
        value.startsWith('https://') &&
        !value.includes('localhost') &&
        !value.includes('.run.app')
      );
    });

  const defaults = isProduction
    ? PRODUCTION_API_CORS_ORIGINS
    : [...LOCAL_API_CORS_ORIGINS, ...PRODUCTION_API_CORS_ORIGINS];

  return Array.from(new Set([...defaults, ...configuredOrigins]));
}

export async function loadSecrets() {
  const isProduction = process.env.NODE_ENV === 'production';
  const projectId =
    process.env.GCP_PROJECT_ID ?? process.env.GOOGLE_CLOUD_PROJECT ?? '';

  if (!isProduction) {
    for (const fileName of LOCAL_ENV_FILES) {
      const envPath = resolve(process.cwd(), fileName);

      if (existsSync(envPath)) {
        dotenv.config({ path: envPath, override: false });
      }
    }

    return;
  }

  if (!projectId) {
    console.warn(
      '[OpenStaff API] GCP_PROJECT_ID is missing in production, skipping Secret Manager bootstrap.',
    );
    return;
  }

  try {
    const { SecretManagerServiceClient } = await import('@google-cloud/secret-manager');
    const client = new SecretManagerServiceClient();

    for (const secretName of PRODUCTION_SECRETS) {
      if (process.env[secretName]) {
        continue;
      }

      try {
        const [version] = await client.accessSecretVersion({
          name: `projects/${projectId}/secrets/${secretName}/versions/latest`,
        });
        const value = version.payload?.data?.toString();

        if (value) {
          process.env[secretName] = value;
          continue;
        }

        console.warn(
          `[OpenStaff API] Secret ${secretName} is empty or unavailable; continuing startup without it.`,
        );
      } catch (error) {
        console.warn(
          `[OpenStaff API] Secret ${secretName} is not available yet; continuing startup without it.`,
          error,
        );
      }
    }
  } catch (error) {
    console.warn(
      '[OpenStaff API] Secret Manager bootstrap is unavailable; continuing startup without managed secrets.',
      error,
    );
  }
}

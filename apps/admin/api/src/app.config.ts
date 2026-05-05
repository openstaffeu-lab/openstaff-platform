import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import dotenv from 'dotenv';

export const API_CORS_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8080',
  'https://openstaff.eu',
  'https://admin.openstaff.eu',
  'https://api.openstaff.eu',
  'https://openstaff-admin-854602406741.europe-west1.run.app',
  'https://openstaff-api-854602406741.europe-west1.run.app',
];

const LOCAL_ENV_FILES = ['.env.local', '.env'];
const PRODUCTION_SECRETS = [
  'FIREBASE_SERVICE_ACCOUNT_KEY',
  'DATABASE_URL',
  'JWT_SECRET',
];

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

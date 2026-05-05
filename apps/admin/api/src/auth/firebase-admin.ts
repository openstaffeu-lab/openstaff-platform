import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { App, applicationDefault, cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { Auth, getAuth } from 'firebase-admin/auth';

let firebaseApp: App | null = null;

function buildFirebaseApp() {
  const inlineKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (inlineKey) {
    try {
      return initializeApp({
        credential: cert(JSON.parse(inlineKey)),
      });
    } catch (error) {
      throw new Error(`Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON: ${(error as Error).message}`);
    }
  }

  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (keyPath) {
    const resolvedPath = resolve(process.cwd(), keyPath);

    if (existsSync(resolvedPath)) {
      try {
        return initializeApp({
          credential: cert(JSON.parse(readFileSync(resolvedPath, 'utf8'))),
        });
      } catch (error) {
        throw new Error(`Invalid Firebase service account file: ${(error as Error).message}`);
      }
    }
  }

  return initializeApp({
    credential: applicationDefault(),
  });
}

export function getFirebaseAdminAuth(): Auth {
  if (!firebaseApp) {
    firebaseApp = getApps().length ? getApp() : buildFirebaseApp();
  }

  return getAuth(firebaseApp);
}

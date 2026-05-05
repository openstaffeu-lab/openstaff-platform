import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";

type FirebaseClientConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

let emulatorConnected = false;

function readFirebaseConfig(): FirebaseClientConfig {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  };
}

export function isFirebaseConfigured() {
  return Object.values(readFirebaseConfig()).every(Boolean);
}

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) {
    return null;
  }

  return getApps().length > 0 ? getApp() : initializeApp(readFirebaseConfig());
}

export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();

  if (!app) {
    return null;
  }

  const auth = getAuth(app);

  if (
    !emulatorConnected &&
    process.env.NEXT_PUBLIC_USE_EMULATORS === "true" &&
    typeof window !== "undefined"
  ) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", {
      disableWarnings: true,
    });
    emulatorConnected = true;
  }

  return auth;
}

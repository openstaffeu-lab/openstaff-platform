# Firebase Service Account Setup

## Pasi
1. Open `https://console.firebase.google.com` and choose the OpenStaff Firebase project.
2. Go to `Project settings` -> `Service accounts`.
3. Click `Generate new private key` and download the JSON file.
4. Save the file as `apps/admin/api/firebase-service-account.json`.
   This file is ignored by Git and must never be committed.

## Configurare .env

Path local:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

JSON inline, useful for Secret Manager or CI:

```env
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}
```

## Variabile frontend

`apps/admin/web/.env.local`

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_USE_EMULATORS=false
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Note

- In Cloud Run production, Firebase Admin can also use Application Default Credentials.
- For local API smoke tests without Firebase setup, `SKIP_FIREBASE_AUTH=true` is supported in development only.

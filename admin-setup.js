const admin = require("firebase-admin");
const fs = require("node:fs");

const serviceAccountPath =
  process.env.FIREBASE_ADMIN_SA_PATH ||
  "C:/Users/admin/Downloads/openstaff-platform-firebase-adminsdk-fbsvc-53c3113a41.json";

const targetEmail = process.env.OPENSTAFF_ADMIN_EMAIL || "openstaff.eu@gmail.com";

function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim()) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  }

  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(
      `Firebase service account not found. Set FIREBASE_SERVICE_ACCOUNT_KEY or provide FIREBASE_ADMIN_SA_PATH (${serviceAccountPath}).`,
    );
  }

  return JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
}

const serviceAccount = loadServiceAccount();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function run() {
  const user = await admin.auth().getUserByEmail(targetEmail);

  await admin.auth().setCustomUserClaims(user.uid, {
    admin: true,
    role: "SUPERADMIN",
  });

  console.log(`Claims set for ${user.email} (${user.uid})`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

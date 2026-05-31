import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function readServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY 환경변수가 없습니다.");
  }

  const parsed = JSON.parse(raw);
  return {
    projectId: parsed.project_id,
    clientEmail: parsed.client_email,
    privateKey: String(parsed.private_key).replace(/\\n/g, "\n"),
  };
}

export function getServerFirestoreDb() {
  if (!getApps().length) {
    initializeApp({
      credential: cert(readServiceAccount()),
    });
  }

  return getFirestore();
}

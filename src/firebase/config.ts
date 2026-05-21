import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

function readFirebaseEnv(name: string): string | undefined {
  const value = process.env[name];
  if (!value) return undefined;
  return value.trim().replace(/^["']|["'],?$/g, "").replace(/,$/, "");
}

const fallbackFirebaseConfig = {
  apiKey: "AIzaSyCQz15M3t3GxPMjNL9kJsU69EAAJZF5wW0",
  authDomain: "thousand-nyang.firebaseapp.com",
  projectId: "thousand-nyang",
  storageBucket: "thousand-nyang.firebasestorage.app",
  messagingSenderId: "842206630912",
  appId: "1:842206630912:web:de87b006da9512a7f734e5",
};

const firebaseConfig = {
  apiKey:
    readFirebaseEnv("NEXT_PUBLIC_FIREBASE_API_KEY") ??
    fallbackFirebaseConfig.apiKey,
  authDomain:
    readFirebaseEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN") ??
    fallbackFirebaseConfig.authDomain,
  projectId:
    readFirebaseEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID") ??
    fallbackFirebaseConfig.projectId,
  storageBucket:
    readFirebaseEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET") ??
    fallbackFirebaseConfig.storageBucket,
  messagingSenderId:
    readFirebaseEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID") ??
    fallbackFirebaseConfig.messagingSenderId,
  appId:
    readFirebaseEnv("NEXT_PUBLIC_FIREBASE_APP_ID") ??
    fallbackFirebaseConfig.appId,
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.storageBucket &&
      firebaseConfig.messagingSenderId &&
      firebaseConfig.appId,
  );
}

export function getFirebaseApp(): FirebaseApp | undefined {
  if (typeof window === "undefined") return undefined;
  if (!isFirebaseConfigured()) return undefined;
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
  return getApps()[0];
}

export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();
  return app ? getAuth(app) : null;
}

export function getFirestoreDb(): Firestore | null {
  const app = getFirebaseApp();
  return app ? getFirestore(app) : null;
}

export function getFirebaseStorage(): FirebaseStorage | null {
  const app = getFirebaseApp();
  return app ? getStorage(app) : null;
}

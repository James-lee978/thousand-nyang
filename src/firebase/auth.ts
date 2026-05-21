import {
  getRedirectResult,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "./config";

function getGoogleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

function isLocalHost() {
  if (typeof window === "undefined") return false;
  return ["localhost", "127.0.0.1"].includes(window.location.hostname);
}

function shouldRetryWithRedirect(error: unknown) {
  return (
    error instanceof Error &&
    "code" in error &&
    [
      "auth/popup-blocked",
      "auth/popup-closed-by-user",
      "auth/cancelled-popup-request",
    ].includes(String(error.code))
  );
}

function getAuthOrThrow() {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error(
      "Firebase 설정이 비어 있습니다. .env.local 또는 Vercel Environment Variables를 확인해 주세요.",
    );
  }
  return auth;
}

export async function loginWithGoogle(): Promise<User | null> {
  const auth = getAuthOrThrow();
  const provider = getGoogleProvider();

  if (!isLocalHost()) {
    await signInWithRedirect(auth, provider);
    return null;
  }

  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    if (shouldRetryWithRedirect(error)) {
      await signInWithRedirect(auth, provider);
      return null;
    }
    throw error;
  }
}

export async function getGoogleRedirectUser(): Promise<User | null> {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  const result = await getRedirectResult(auth);
  return result?.user ?? null;
}

import {
  GoogleAuthProvider,
  signInWithPopup,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "./config";

function getGoogleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
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

  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    if (error instanceof Error && "code" in error) {
      const code = String(error.code);
      if (code === "auth/popup-blocked") {
        throw new Error(
          "브라우저가 Google 로그인 팝업을 차단했습니다. 팝업 허용 후 다시 시도해 주세요.",
        );
      }
      if (code === "auth/popup-closed-by-user") {
        throw new Error("Google 로그인 창이 닫혔습니다. 다시 시도해 주세요.");
      }
    }
    throw error;
  }
}

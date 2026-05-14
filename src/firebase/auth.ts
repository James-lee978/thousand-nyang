import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirebaseAuth } from "./config";

export async function loginWithGoogle() {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error(
      "Firebase가 설정되지 않았습니다. .env.local에 공개 키를 입력하세요.",
    );
  }
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

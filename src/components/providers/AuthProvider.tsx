"use client";

import { getFirebaseAuth } from "@/firebase/config";
import { getUserProfile } from "@/firebase/firestore";
import type { User as FirebaseUser } from "firebase/auth";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import type { User } from "@/types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AuthState = {
  user: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  // Firebase 설정이 없으면(= auth 인스턴스를 만들 수 없으면) 처음부터 로딩이 끝난 상태로 둡니다.
  // eslint 규칙(react-hooks/set-state-in-effect) 때문에 effect 본문에서 동기 setState를 피합니다.
  const [loading, setLoading] = useState(() => Boolean(getFirebaseAuth()));

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
      
      // 사용자 프로필 가져오기
      if (u) {
        const profile = await getUserProfile(u.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
    });
    return () => unsub();
  }, []);

  const signOut = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (auth) await firebaseSignOut(auth);
  }, []);

  const value = useMemo(
    () => ({ user, userProfile, loading, signOut }),
    [user, userProfile, loading, signOut],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

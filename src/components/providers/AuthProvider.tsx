"use client";

import { getFirebaseAuth } from "@/firebase/config";
import { ensureUserDocument, getUserProfile } from "@/firebase/firestore";
import type { User } from "@/types";
import type { User as FirebaseUser } from "firebase/auth";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
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
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => Boolean(getFirebaseAuth()));

  const loadProfile = useCallback(async (firebaseUser: FirebaseUser | null) => {
    if (!firebaseUser) {
      setUserProfile(null);
      return;
    }

    await ensureUserDocument(firebaseUser);
    const profile = await getUserProfile(firebaseUser.uid);
    setUserProfile(profile);
  }, []);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return;

    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setLoading(true);
      setUser(nextUser);
      try {
        await loadProfile(nextUser);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    const auth = getFirebaseAuth();
    await loadProfile(auth?.currentUser ?? null);
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (auth) await firebaseSignOut(auth);
  }, []);

  const value = useMemo(
    () => ({ user, userProfile, loading, refreshProfile, signOut }),
    [user, userProfile, loading, refreshProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

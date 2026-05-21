"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { loginWithGoogle } from "@/firebase/auth";
import { isFirebaseConfigured } from "@/firebase/config";
import { ensureUserDocument, getUserProfile } from "@/firebase/firestore";
import type { User } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const { user, userProfile, loading, refreshProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const ready = isFirebaseConfigured();

  const finishLogin = useCallback(
    async (user: User) => {
      await ensureUserDocument(user);
      const profile = await getUserProfile(user.uid);
      if (!profile?.role) {
        router.push("/role");
        return;
      }
      router.push(profile.role === "host" ? "/host" : "/guest");
    },
    [router],
  );

  useEffect(() => {
    if (!ready || loading || !user) return;
    if (!userProfile?.role) {
      router.replace("/role");
      return;
    }
    router.replace(userProfile.role === "host" ? "/host" : "/guest");
  }, [loading, ready, router, user, userProfile]);

  const handleGoogle = async () => {
    setError(null);
    setPending(true);
    try {
      const user = await loginWithGoogle();
      if (user) {
        await finishLogin(user);
        await refreshProfile();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "로그인에 실패했습니다.");
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-16">
      <h1 className="text-4xl font-semibold">로그인</h1>
      <p className="mt-3 text-sm text-zinc-400">
        Google 계정으로 전시회를 만들거나 관람할 수 있습니다.
      </p>

      {!ready && (
        <p className="mt-6 rounded-2xl border border-amber-800/60 bg-amber-950/40 p-4 text-sm text-amber-100">
          Firebase 환경변수가 비어 있습니다. 프로젝트 루트의{" "}
          <code className="text-amber-50">.env.local</code> 또는 Vercel
          Environment Variables를 확인해 주세요.
        </p>
      )}

      {error && (
        <p className="mt-6 rounded-2xl border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-100">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={!ready || pending}
        onClick={handleGoogle}
        className="mt-8 w-full rounded-2xl bg-white py-4 text-sm font-semibold text-black transition enabled:hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? "연결 중..." : "Google로 계속하기"}
      </button>

      <Link
        href="/"
        className="mt-6 text-center text-sm text-zinc-500 hover:text-zinc-300"
      >
        메인으로
      </Link>
    </main>
  );
}

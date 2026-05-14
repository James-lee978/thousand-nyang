"use client";

import { loginWithGoogle } from "@/firebase/auth";
import { ensureUserDocument, getUserProfile } from "@/firebase/firestore";
import { isFirebaseConfigured } from "@/firebase/config";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const ready = isFirebaseConfigured();

  const handleGoogle = async () => {
    setError(null);
    setPending(true);
    try {
      const user = await loginWithGoogle();
      await ensureUserDocument(user);
      const profile = await getUserProfile(user.uid);
      if (!profile?.role) {
        router.push("/role");
        return;
      }
      router.push(profile.role === "host" ? "/host" : "/guest");
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
        MVP에서는 Google 로그인만 제공합니다.
      </p>

      {!ready && (
        <p className="mt-6 rounded-2xl border border-amber-800/60 bg-amber-950/40 p-4 text-sm text-amber-100">
          Firebase 환경변수가 비어 있습니다. 프로젝트 루트에{" "}
          <code className="text-amber-50">.env.local</code>을 만들고{" "}
          <code className="text-amber-50">.env.example</code> 값을 채운 뒤 개발
          서버를 다시 실행하세요.
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
        {pending ? "연결 중…" : "Google로 계속하기"}
      </button>

      <Link
        href="/"
        className="mt-6 text-center text-sm text-zinc-500 hover:text-zinc-300"
      >
        ← 메인으로
      </Link>
    </main>
  );
}

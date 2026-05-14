"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { setUserRole } from "@/firebase/firestore";
import { isFirebaseConfigured } from "@/firebase/config";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RolePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!isFirebaseConfigured()) return;
    if (!user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  const choose = async (role: "host" | "guest") => {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      await setUserRole(user.uid, role);
      router.push(role === "host" ? "/host" : "/guest");
    } catch (e) {
      setError(e instanceof Error ? e.message : "역할 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (!isFirebaseConfigured()) {
    return (
      <main className="mx-auto max-w-3xl flex-1 px-6 py-16">
        <p className="text-zinc-400">
          Firebase 설정 후 이용할 수 있습니다.{" "}
          <Link className="text-white underline" href="/login">
            로그인 페이지
          </Link>
          에서 안내를 확인하세요.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-1 flex-col justify-center px-6 py-16">
      <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">로그인 완료</p>
      <h1 className="mt-4 text-4xl font-semibold">당신은?</h1>
      <p className="mt-3 max-w-2xl text-zinc-400">
        역할은 나중에 관리자 요청으로 변경할 수 있도록 확장할 수 있습니다. MVP에서는
        한 번 선택한 값이 프로필에 저장됩니다.
      </p>

      {error && (
        <p className="mt-6 rounded-2xl border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-100">
          {error}
        </p>
      )}

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <button
          type="button"
          disabled={saving || !user}
          onClick={() => choose("host")}
          className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8 text-left transition hover:border-zinc-600 disabled:opacity-40"
        >
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">HOST</p>
          <h2 className="mt-4 text-2xl font-semibold">전시회를 열고 싶어요</h2>
          <p className="mt-3 text-sm text-zinc-400">
            전시를 기획하고 작품을 업로드합니다.
          </p>
        </button>
        <button
          type="button"
          disabled={saving || !user}
          onClick={() => choose("guest")}
          className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8 text-left transition hover:border-zinc-600 disabled:opacity-40"
        >
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">GUEST</p>
          <h2 className="mt-4 text-2xl font-semibold">전시를 감상하고 싶어요</h2>
          <p className="mt-3 text-sm text-zinc-400">
            큐레이션된 전시를 둘러보고 관람권을 구매합니다.
          </p>
        </button>
      </div>
    </main>
  );
}

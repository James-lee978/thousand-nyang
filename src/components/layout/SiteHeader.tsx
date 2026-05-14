"use client";

import { isFirebaseConfigured } from "@/firebase/config";
import { getTotalUserCount } from "@/firebase/firestore";
import Link from "next/link";
import { useAuth } from "../providers/AuthProvider";
import { useEffect, useState } from "react";

export function SiteHeader() {
  const { user, loading, signOut } = useAuth();
  const firebaseOn = isFirebaseConfigured();
  const [totalUsers, setTotalUsers] = useState<number | null>(null);

  useEffect(() => {
    if (!firebaseOn) return;
    getTotalUserCount().then(setTotalUsers).catch(() => setTotalUsers(0));
  }, [firebaseOn]);

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-white">
          1000냥 전시회
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm text-zinc-300">
          <Link href="/exhibition/create" className="hover:text-white">
            전시 만들기
          </Link>
          <Link href="/guest" className="hover:text-white">
            GUEST
          </Link>
          <Link href="/host" className="hover:text-white">
            HOST
          </Link>
          {!firebaseOn && (
            <span className="rounded-full border border-amber-700/60 px-2 py-0.5 text-xs text-amber-200">
              Firebase 미설정
            </span>
          )}
          {totalUsers !== null && (
            <span className="rounded-full border border-zinc-700 px-3 py-1 text-zinc-300">
              가입자 {totalUsers}명
            </span>
          )}
          {loading ? (
            <span className="text-zinc-500">…</span>
          ) : user ? (
            <button
              type="button"
              onClick={() => signOut()}
              className="rounded-full border border-zinc-700 px-3 py-1 text-zinc-200 hover:border-zinc-500 hover:text-white"
            >
              로그아웃
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-white px-3 py-1 font-medium text-black hover:bg-zinc-200"
            >
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

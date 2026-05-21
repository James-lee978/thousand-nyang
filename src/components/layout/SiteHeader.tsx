"use client";

import { isFirebaseConfigured } from "@/firebase/config";
import { subscribeToUserCount } from "@/firebase/firestore";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../providers/AuthProvider";

export function SiteHeader() {
  const { user, userProfile, loading, signOut } = useAuth();
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const firebaseOn = isFirebaseConfigured();

  useEffect(() => {
    if (!firebaseOn) return;

    return subscribeToUserCount(
      (count) => {
        setTotalUsers(count);
      },
      () => {
        setTotalUsers(user ? 1 : 0);
      },
    );
  }, [firebaseOn, user]);

  const displayUserCount = useMemo(() => {
    if (totalUsers === null) return null;
    return Math.max(totalUsers, user ? 1 : 0);
  }, [totalUsers, user]);

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-white"
        >
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
          {displayUserCount !== null && (
            <span className="rounded-full border border-zinc-700 px-3 py-1 text-zinc-300">
              가입자 {displayUserCount}명
            </span>
          )}
          {userProfile && (
            <span className="rounded-full border border-zinc-600 px-3 py-1 text-zinc-200">
              내 닉네임: {userProfile.nickname}
            </span>
          )}
          {loading ? (
            <span className="text-zinc-500">확인 중...</span>
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

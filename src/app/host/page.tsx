"use client";

import { ExhibitionCard } from "@/components/exhibition/ExhibitionCard";
import { useAuth } from "@/components/providers/AuthProvider";
import { listExhibitionsByHost } from "@/firebase/firestore";
import { isFirebaseConfigured } from "@/firebase/config";
import type { Exhibition } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HostPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mine, setMine] = useState<Exhibition[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!isFirebaseConfigured()) return;
    if (!user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user || !isFirebaseConfigured()) return;
      const rows = await listExhibitionsByHost(user.uid);
      if (!cancelled) setMine(rows);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">HOST</p>
          <h1 className="mt-2 text-4xl font-semibold">전시 스튜디오</h1>
          <p className="mt-3 max-w-2xl text-sm text-zinc-400">
            전시를 만들고 링크로 공유하세요. 역할은{" "}
            <Link href="/role" className="text-white underline">
              역할 선택
            </Link>
            에서 언제든지 다시 고를 수 있습니다.
          </p>
        </div>
        <Link
          href="/exhibition/create"
          className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-zinc-200"
        >
          새 전시 만들기
        </Link>
      </div>

      {!isFirebaseConfigured() && (
        <p className="mt-8 rounded-2xl border border-amber-800/50 bg-amber-950/30 p-4 text-sm text-amber-100">
          Firebase 설정이 필요합니다. 설정 전에는 전시를 저장할 수 없습니다.
        </p>
      )}

      <section className="mt-12">
        <h2 className="text-xl font-medium text-zinc-200">내 전시</h2>
        {mine.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">
            아직 등록된 전시가 없습니다. 첫 전시를 만들어보세요.
          </p>
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {mine.map((item) => (
              <div key={item.id} className="space-y-3">
                <ExhibitionCard exhibition={item} />
                <Link
                  href={`/exhibition/${item.id}/edit`}
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-zinc-800 py-3 text-sm text-zinc-200 hover:border-zinc-600"
                >
                  전시 수정하기
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

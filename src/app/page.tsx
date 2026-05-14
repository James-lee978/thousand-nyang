"use client";

import { ExhibitionCard } from "@/components/exhibition/ExhibitionCard";
import { listExhibitions } from "@/firebase/firestore";
import { isFirebaseConfigured } from "@/firebase/config";
import { CATEGORIES } from "@/lib/categories";
import { MOCK_EXHIBITIONS } from "@/lib/mock-exhibitions";
import type { Exhibition } from "@/types";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function mergeCatalog(remote: Exhibition[]): Exhibition[] {
  const map = new Map<string, Exhibition>();
  MOCK_EXHIBITIONS.forEach((e) => map.set(e.id, e));
  remote.forEach((e) => map.set(e.id, e));
  return [...map.values()].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1,
  );
}

export default function HomePage() {
  const [remote, setRemote] = useState<Exhibition[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isFirebaseConfigured()) {
        setLoaded(true);
        return;
      }
      try {
        const rows = await listExhibitions();
        if (!cancelled) setRemote(rows);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const catalog = useMemo(() => mergeCatalog(remote), [remote]);
  const today = catalog[0];
  const popular = useMemo(
    () => [...catalog].sort((a, b) => b.price - a.price),
    [catalog],
  );
  const byCategory = useMemo(() => {
    const map = new Map<string, Exhibition[]>();
    CATEGORIES.forEach((c) => map.set(c, []));
    catalog.forEach((e) => {
      const bucket = map.get(e.category) ?? [];
      bucket.push(e);
      map.set(e.category, bucket);
    });
    return map;
  }, [catalog]);

  return (
    <main className="flex-1 bg-black text-white">
      <section className="flex min-h-[80vh] flex-col items-center justify-center px-6 py-24 text-center">
        <p className="mb-4 text-xs uppercase tracking-[0.35em] text-zinc-500">
          온라인 아카이브
        </p>
        <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
          1000냥 전시회
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-zinc-400">
          전공에서 발견한 예술을 전시하다.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/host"
            className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            HOST 시작하기
          </Link>
          <Link
            href="/guest"
            className="rounded-full border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500"
          >
            GUEST 입장하기
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-zinc-800 px-6 py-3 text-sm text-zinc-300 transition hover:border-zinc-600"
          >
            로그인
          </Link>
        </div>
        {!loaded && (
          <p className="mt-8 text-sm text-zinc-500">전시 데이터를 불러오는 중…</p>
        )}
      </section>

      {today && (
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-semibold">오늘의 전시</h2>
              <p className="mt-2 text-sm text-zinc-500">
                큐레이터가 고른 오늘의 한 작품.
              </p>
            </div>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            <ExhibitionCard exhibition={today} />
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="mb-8 text-3xl font-semibold">인기 전시</h2>
        <div className="grid gap-8 md:grid-cols-2">
          {popular.slice(0, 4).map((item) => (
            <ExhibitionCard key={item.id} exhibition={item} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="mb-8 text-3xl font-semibold">최신 전시</h2>
        <div className="grid gap-8 md:grid-cols-2">
          {catalog.slice(0, 4).map((item) => (
            <ExhibitionCard key={`latest-${item.id}`} exhibition={item} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="mb-8 text-3xl font-semibold">분야별 탐색</h2>
        <div className="space-y-12">
          {CATEGORIES.map((category) => {
            const items = byCategory.get(category) ?? [];
            if (!items.length) return null;
            return (
              <div key={category} id={encodeURIComponent(category)}>
                <h3 className="mb-4 text-xl font-medium text-zinc-200">
                  {category}
                </h3>
                <div className="grid gap-6 md:grid-cols-2">
                  {items.map((item) => (
                    <ExhibitionCard key={item.id} exhibition={item} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

"use client";

import { FadeIn, ScrollTransition } from "@/components/effects/ScrollTransition";
import { ExhibitionCard } from "@/components/exhibition/ExhibitionCard";
import { isFirebaseConfigured } from "@/firebase/config";
import { subscribeToExhibitions } from "@/firebase/firestore";
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

function popularityScore(exhibition: Exhibition) {
  return (
    (exhibition.likes ?? 0) +
    (exhibition.dislikes ?? 0) +
    (exhibition.commentCount ?? 0) +
    (exhibition.commentReactionCount ?? 0)
  );
}

export default function HomePage() {
  const [remote, setRemote] = useState<Exhibition[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      queueMicrotask(() => setLoaded(true));
      return;
    }

    return subscribeToExhibitions((exhibitions) => {
      setRemote(exhibitions);
      setLoaded(true);
    });
  }, []);

  const catalog = useMemo(() => mergeCatalog(remote), [remote]);
  const today = catalog[0];
  const popular = useMemo(
    () =>
      [...catalog].sort(
        (a, b) =>
          popularityScore(b) - popularityScore(a) ||
          (a.createdAt < b.createdAt ? 1 : -1),
      ),
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
      <section className="relative flex min-h-screen items-center justify-center px-6">
        <div className="max-w-4xl space-y-12 text-center">
          <FadeIn delay={0.2}>
            <p className="text-[10px] uppercase tracking-[0.5em] text-zinc-500">
              Online Exhibition Archive
            </p>
          </FadeIn>
          <FadeIn delay={0.4}>
            <h1 className="text-6xl font-light tracking-tight sm:text-8xl md:text-9xl">
              1000냥
            </h1>
          </FadeIn>
          <FadeIn delay={0.6}>
            <p className="mx-auto max-w-xl text-sm leading-relaxed text-zinc-400">
              전공에서 발견한 예술을 전시하는 디지털 공간
            </p>
          </FadeIn>
          <FadeIn delay={0.8}>
            <div className="flex flex-wrap justify-center gap-6 pt-8">
              <Link
                href="/host"
                className="border border-white/30 px-8 py-3 text-xs uppercase tracking-[0.2em] text-white transition-all duration-500 hover:bg-white hover:text-black"
              >
                Host
              </Link>
              <Link
                href="/guest"
                className="px-8 py-3 text-xs uppercase tracking-[0.2em] text-zinc-400 transition-all duration-500 hover:text-white"
              >
                Guest
              </Link>
              <Link
                href="/login"
                className="px-8 py-3 text-xs uppercase tracking-[0.2em] text-zinc-500 transition-all duration-500 hover:text-zinc-300"
              >
                Login
              </Link>
            </div>
          </FadeIn>
        </div>
        {!loaded && (
          <p className="absolute bottom-12 left-1/2 -translate-x-1/2 text-xs text-zinc-600">
            Loading exhibitions...
          </p>
        )}
      </section>

      {today && (
        <section className="px-6 py-32">
          <ScrollTransition direction="up" delay={0.2}>
            <div className="mx-auto max-w-7xl">
              <div className="mb-16 space-y-4">
                <p className="text-[10px] uppercase tracking-[0.5em] text-zinc-500">
                  Featured
                </p>
                <h2 className="text-4xl font-light tracking-tight">
                  오늘의 전시
                </h2>
              </div>
              <div className="grid gap-16 md:grid-cols-2">
                <ExhibitionCard exhibition={today} />
              </div>
            </div>
          </ScrollTransition>
        </section>
      )}

      <section className="px-6 py-32">
        <ScrollTransition direction="up" delay={0.2}>
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 space-y-4">
              <p className="text-[10px] uppercase tracking-[0.5em] text-zinc-500">
                Live Ranking
              </p>
              <h2 className="text-4xl font-light tracking-tight">
                실시간 인기 전시
              </h2>
              <p className="max-w-2xl text-sm text-zinc-500">
                좋아요, 싫어요, 댓글 수를 합산해서 상위 3개만 보여줍니다.
              </p>
            </div>
            <div className="grid gap-16 md:grid-cols-2 lg:grid-cols-3">
              {popular.slice(0, 3).map((item, index) => (
                <div key={item.id} className="space-y-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-amber-200/70">
                    Rank {index + 1} · Score {popularityScore(item)}
                  </p>
                  <ExhibitionCard exhibition={item} />
                </div>
              ))}
            </div>
          </div>
        </ScrollTransition>
      </section>

      <section className="px-6 py-32">
        <ScrollTransition direction="up" delay={0.2}>
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 space-y-4">
              <p className="text-[10px] uppercase tracking-[0.5em] text-zinc-500">
                Latest
              </p>
              <h2 className="text-4xl font-light tracking-tight">최신 전시</h2>
            </div>
            <div className="grid gap-16 md:grid-cols-2 lg:grid-cols-3">
              {catalog.slice(0, 6).map((item) => (
                <ExhibitionCard key={`latest-${item.id}`} exhibition={item} />
              ))}
            </div>
          </div>
        </ScrollTransition>
      </section>

      <section className="px-6 py-32 pb-48">
        <ScrollTransition direction="up" delay={0.2}>
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 space-y-4">
              <p className="text-[10px] uppercase tracking-[0.5em] text-zinc-500">
                Explore
              </p>
              <h2 className="text-4xl font-light tracking-tight">분야별 탐색</h2>
            </div>
            <div className="space-y-32">
              {CATEGORIES.map((category) => {
                const items = byCategory.get(category) ?? [];
                if (!items.length) return null;
                return (
                  <ScrollTransition key={category} direction="up" delay={0.1}>
                    <div id={encodeURIComponent(category)} className="space-y-12">
                      <div className="flex items-center space-x-6">
                        <div className="h-px flex-1 bg-zinc-800" />
                        <h3 className="text-2xl font-light tracking-wide text-zinc-300">
                          {category}
                        </h3>
                        <div className="h-px flex-1 bg-zinc-800" />
                      </div>
                      <div className="grid gap-16 md:grid-cols-2 lg:grid-cols-3">
                        {items.map((item) => (
                          <ExhibitionCard key={item.id} exhibition={item} />
                        ))}
                      </div>
                    </div>
                  </ScrollTransition>
                );
              })}
            </div>
          </div>
        </ScrollTransition>
      </section>
    </main>
  );
}

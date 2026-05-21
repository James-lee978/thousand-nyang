"use client";

import { ExhibitionCard } from "@/components/exhibition/ExhibitionCard";
import { subscribeToExhibitions } from "@/firebase/firestore";
import { isFirebaseConfigured } from "@/firebase/config";
import { CATEGORIES } from "@/lib/categories";
import { MOCK_EXHIBITIONS } from "@/lib/mock-exhibitions";
import { ScrollTransition, FadeIn } from "@/components/effects/ScrollTransition";
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
    if (!isFirebaseConfigured()) {
      setLoaded(true);
      return;
    }
    
    const unsubscribe = subscribeToExhibitions((exhibitions) => {
      setRemote(exhibitions);
      setLoaded(true);
    });
    
    return () => {
      unsubscribe();
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
      {/* Hero Section - Immersive Gallery Entrance */}
      <section className="relative min-h-screen flex items-center justify-center px-6">
        <div className="max-w-4xl text-center space-y-12">
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
            <p className="text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
              전공에서 발견한 예술을 전시하는 디지털 공간
            </p>
          </FadeIn>
          <FadeIn delay={0.8}>
            <div className="flex flex-wrap justify-center gap-6 pt-8">
              <Link
                href="/host"
                className="px-8 py-3 text-xs uppercase tracking-[0.2em] text-white border border-white/30 hover:bg-white hover:text-black transition-all duration-500"
              >
                Host
              </Link>
              <Link
                href="/guest"
                className="px-8 py-3 text-xs uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-all duration-500"
              >
                Guest
              </Link>
              <Link
                href="/login"
                className="px-8 py-3 text-xs uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-300 transition-all duration-500"
              >
                Login
              </Link>
            </div>
          </FadeIn>
        </div>
        {!loaded && (
          <p className="absolute bottom-12 left-1/2 -translate-x-1/2 text-xs text-zinc-600">
            Loading exhibitions…
          </p>
        )}
      </section>

      {/* Today's Exhibition - Featured */}
      {today && (
        <section className="py-32 px-6">
          <ScrollTransition direction="up" delay={0.2}>
            <div className="max-w-7xl mx-auto">
              <div className="mb-16 space-y-4">
                <p className="text-[10px] uppercase tracking-[0.5em] text-zinc-500">
                  Featured
                </p>
                <h2 className="text-4xl font-light tracking-tight">오늘의 전시</h2>
              </div>
              <div className="grid gap-16 md:grid-cols-2">
                <ExhibitionCard exhibition={today} />
              </div>
            </div>
          </ScrollTransition>
        </section>
      )}

      {/* Popular Exhibitions */}
      <section className="py-32 px-6">
        <ScrollTransition direction="up" delay={0.2}>
          <div className="max-w-7xl mx-auto">
            <div className="mb-16 space-y-4">
              <p className="text-[10px] uppercase tracking-[0.5em] text-zinc-500">
                Popular
              </p>
              <h2 className="text-4xl font-light tracking-tight">인기 전시</h2>
            </div>
            <div className="grid gap-16 md:grid-cols-2 lg:grid-cols-3">
              {popular.slice(0, 6).map((item, index) => (
                <ExhibitionCard key={item.id} exhibition={item} />
              ))}
            </div>
          </div>
        </ScrollTransition>
      </section>

      {/* Latest Exhibitions */}
      <section className="py-32 px-6">
        <ScrollTransition direction="up" delay={0.2}>
          <div className="max-w-7xl mx-auto">
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

      {/* Category Exploration */}
      <section className="py-32 px-6 pb-48">
        <ScrollTransition direction="up" delay={0.2}>
          <div className="max-w-7xl mx-auto">
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

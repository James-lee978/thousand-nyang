"use client";

import { getExhibition } from "@/firebase/firestore";
import { isFirebaseConfigured } from "@/firebase/config";
import { MOCK_EXHIBITIONS } from "@/lib/mock-exhibitions";
import type { Exhibition } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ExhibitionDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const [data, setData] = useState<Exhibition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mock = MOCK_EXHIBITIONS.find((m) => m.id === id) ?? null;
      if (!isFirebaseConfigured()) {
        setData(mock);
        setLoading(false);
        return;
      }
      const remote = await getExhibition(id);
      if (!cancelled) {
        setData(remote ?? mock);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center text-sm text-zinc-500">
        불러오는 중…
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-3xl flex-1 px-6 py-16 text-zinc-400">
        전시를 찾을 수 없습니다.{" "}
        <Link href="/" className="text-white underline">
          메인으로
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl border border-zinc-900">
        <Image
          src={data.thumbnail}
          alt={data.title}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      </div>

      <div className="mt-10 space-y-4">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
          {data.category}
        </p>
        <h1 className="text-4xl font-semibold sm:text-5xl">{data.title}</h1>
        <p className="text-sm text-zinc-400">{data.hostName}</p>
        <p className="text-base text-zinc-300">{data.description}</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`/guest/pay/${data.id}`}
          className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-zinc-200"
        >
          관람권 (Mock)
        </Link>
        <Link
          href="/guest"
          className="rounded-full border border-zinc-800 px-5 py-2 text-sm text-zinc-200 hover:border-zinc-600"
        >
          다른 전시 보기
        </Link>
      </div>

      <section className="mt-16 space-y-12">
        <h2 className="text-2xl font-semibold">작품</h2>
        {data.artworks.map((art) => (
          <article
            key={art.id}
            className="space-y-4 rounded-3xl border border-zinc-900 bg-zinc-950/60 p-6"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-zinc-900">
              <Image
                src={art.imageUrl}
                alt={art.title}
                fill
                className="object-cover"
                sizes="100vw"
              />
            </div>
            <h3 className="text-2xl font-semibold">{art.title}</h3>
            <p className="text-sm text-zinc-400">{art.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

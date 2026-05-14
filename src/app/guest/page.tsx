"use client";

import { ExhibitionCard } from "@/components/exhibition/ExhibitionCard";
import { listExhibitions } from "@/firebase/firestore";
import { isFirebaseConfigured } from "@/firebase/config";
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

export default function GuestPage() {
  const [remote, setRemote] = useState<Exhibition[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isFirebaseConfigured()) return;
      const rows = await listExhibitions();
      if (!cancelled) setRemote(rows);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const catalog = useMemo(() => mergeCatalog(remote), [remote]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-12">
      <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">GUEST</p>
      <h1 className="mt-2 text-4xl font-semibold">전시 둘러보기</h1>
      <p className="mt-3 max-w-2xl text-sm text-zinc-400">
        관람권은 각 전시 상세 페이지에서 구매할 수 있습니다. MVP에서는 결제가 Mock
        처리됩니다.
      </p>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        {catalog.map((item) => (
          <div key={item.id} className="space-y-4">
            <ExhibitionCard exhibition={item} />
            <Link
              href={`/guest/pay/${item.id}`}
              className="inline-flex w-full items-center justify-center rounded-2xl border border-zinc-800 py-3 text-sm text-zinc-200 hover:border-zinc-600"
            >
              관람권 (Mock 결제)
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}

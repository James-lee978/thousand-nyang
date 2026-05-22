"use client";

import { ExhibitionCard } from "@/components/exhibition/ExhibitionCard";
import { isFirebaseConfigured } from "@/firebase/config";
import { listExhibitions } from "@/firebase/firestore";
import { MOCK_EXHIBITIONS } from "@/lib/mock-exhibitions";
import type { Exhibition } from "@/types";
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
        전시를 선택하면 액자형 관람 화면에서 작품과 설명을 감상할 수 있습니다.
      </p>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        {catalog.map((item) => (
          <ExhibitionCard key={item.id} exhibition={item} />
        ))}
      </div>
    </main>
  );
}

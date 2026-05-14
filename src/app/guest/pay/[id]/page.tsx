"use client";

import { getExhibition } from "@/firebase/firestore";
import { isFirebaseConfigured } from "@/firebase/config";
import { MOCK_EXHIBITIONS } from "@/lib/mock-exhibitions";
import type { Exhibition } from "@/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function GuestPayPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const [exhibition, setExhibition] = useState<Exhibition | null>(null);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mock = MOCK_EXHIBITIONS.find((m) => m.id === id) ?? null;
      if (!isFirebaseConfigured()) {
        if (!cancelled) setExhibition(mock);
        return;
      }
      const remote = await getExhibition(id);
      if (!cancelled) setExhibition(remote ?? mock);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleMockPay = () => {
    const paidSuccess = true;
    if (paidSuccess) setPaid(true);
  };

  if (!exhibition) {
    return (
      <main className="mx-auto max-w-xl flex-1 px-6 py-16 text-zinc-400">
        전시를 찾을 수 없습니다.
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-6 py-16">
      <Link href="/guest" className="text-sm text-zinc-500 hover:text-zinc-300">
        ← GUEST 목록
      </Link>
      <h1 className="mt-6 text-3xl font-semibold">관람권 결제 (Mock)</h1>
      <p className="mt-3 text-sm text-zinc-400">
        실제 과금은 발생하지 않습니다. Toss Payments 연동은 추후 단계에서
        붙입니다.
      </p>

      <div className="mt-8 rounded-3xl border border-zinc-900 bg-zinc-950/70 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">선택한 전시</p>
        <h2 className="mt-3 text-2xl font-semibold">{exhibition.title}</h2>
        <p className="mt-2 text-sm text-zinc-400">{exhibition.hostName}</p>
        <p className="mt-6 text-4xl font-semibold">
          {exhibition.price.toLocaleString("ko-KR")}
          <span className="text-base font-normal text-zinc-500"> 냥</span>
        </p>
      </div>

      {paid ? (
        <div className="mt-8 rounded-2xl border border-emerald-800/60 bg-emerald-950/40 p-4 text-sm text-emerald-100">
          결제가 완료되었습니다. 이제 전시 상세 페이지에서 작품을 감상하세요.
        </div>
      ) : (
        <button
          type="button"
          onClick={handleMockPay}
          className="mt-8 w-full rounded-2xl bg-white py-4 text-sm font-semibold text-black hover:bg-zinc-200"
        >
          Mock 결제 완료하기
        </button>
      )}

      <Link
        href={`/exhibition/${exhibition.id}`}
        className="mt-6 text-center text-sm text-zinc-400 underline decoration-zinc-600"
      >
        전시 상세로 이동
      </Link>
    </main>
  );
}

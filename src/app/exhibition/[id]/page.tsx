"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { isFirebaseConfigured } from "@/firebase/config";
import { getExhibition, reactToExhibition } from "@/firebase/firestore";
import { MOCK_EXHIBITIONS } from "@/lib/mock-exhibitions";
import type { Artwork, Exhibition } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function OrnateFrame({
  children,
  variant = "wide",
}: {
  children: React.ReactNode;
  variant?: "wide" | "art";
}) {
  const aspect = variant === "wide" ? "aspect-[16/10]" : "aspect-[4/3]";

  return (
    <div className="relative rounded-[18px] bg-[linear-gradient(135deg,#fff3c4_0%,#b88321_18%,#fff7d8_34%,#6e4312_52%,#f8d979_70%,#8f5a18_100%)] p-[18px] shadow-[0_35px_100px_rgba(0,0,0,0.65),inset_0_0_22px_rgba(255,255,255,0.55)]">
      <div className="pointer-events-none absolute -left-3 -top-3 h-20 w-20 rounded-br-[42px] rounded-tl-[18px] border-l-[10px] border-t-[10px] border-yellow-200/90 shadow-[-5px_-5px_0_rgba(107,63,12,0.9),inset_8px_8px_16px_rgba(255,255,255,0.55)]" />
      <div className="pointer-events-none absolute -right-3 -top-3 h-20 w-20 rounded-bl-[42px] rounded-tr-[18px] border-r-[10px] border-t-[10px] border-yellow-200/90 shadow-[5px_-5px_0_rgba(107,63,12,0.9),inset_-8px_8px_16px_rgba(255,255,255,0.55)]" />
      <div className="pointer-events-none absolute -bottom-3 -left-3 h-20 w-20 rounded-bl-[18px] rounded-tr-[42px] border-b-[10px] border-l-[10px] border-yellow-200/90 shadow-[-5px_5px_0_rgba(107,63,12,0.9),inset_8px_-8px_16px_rgba(255,255,255,0.55)]" />
      <div className="pointer-events-none absolute -bottom-3 -right-3 h-20 w-20 rounded-br-[18px] rounded-tl-[42px] border-b-[10px] border-r-[10px] border-yellow-200/90 shadow-[5px_5px_0_rgba(107,63,12,0.9),inset_-8px_-8px_16px_rgba(255,255,255,0.55)]" />
      <div className="rounded-[10px] bg-[linear-gradient(135deg,#5d3510,#120b06_45%,#5d3510)] p-4 shadow-[inset_0_0_24px_rgba(255,236,169,0.35)]">
        <div className="rounded-[4px] bg-zinc-950 p-3 shadow-[inset_0_0_45px_rgba(0,0,0,0.95)]">
          <div className={`relative ${aspect} w-full overflow-hidden bg-black`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function FramedArtwork({
  art,
  active,
  delay,
}: {
  art: Artwork;
  active: boolean;
  delay: number;
}) {
  return (
    <article
      className={`mx-auto max-w-4xl ${
        active
          ? "animate-[galleryReveal_1.3s_ease-out_forwards]"
          : "opacity-0 translate-y-12 blur-sm"
      }`}
      style={active ? { animationDelay: `${delay}ms` } : undefined}
    >
      <OrnateFrame variant="art">
        <Image
          src={art.imageUrl}
          alt={art.title}
          fill
          unoptimized={art.imageUrl.startsWith("data:")}
          className="object-contain"
          sizes="100vw"
        />
      </OrnateFrame>
      <div className="mx-auto mt-7 max-w-xl border border-yellow-100/20 bg-black/70 px-5 py-4 text-center shadow-[0_18px_50px_rgba(0,0,0,0.4)]">
        <h3 className="text-xl font-semibold text-zinc-100">{art.title}</h3>
        {art.description && (
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            {art.description}
          </p>
        )}
      </div>
    </article>
  );
}

export default function ExhibitionDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const { user } = useAuth();
  const [data, setData] = useState<Exhibition | null>(null);
  const [loading, setLoading] = useState(true);
  const [reacting, setReacting] = useState(false);
  const [reactionError, setReactionError] = useState<string | null>(null);
  const [galleryEntered, setGalleryEntered] = useState(false);

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

  const myReaction = useMemo(() => {
    if (!user || !data?.reactions) return null;
    return data.reactions[user.uid] ?? null;
  }, [data, user]);

  const chooseReaction = async (reaction: "like" | "dislike") => {
    if (!user) {
      setReactionError("로그인 후 공감할 수 있습니다.");
      return;
    }
    if (!data || !isFirebaseConfigured()) return;

    setReactionError(null);
    setReacting(true);
    try {
      const updated = await reactToExhibition(data.id, user.uid, reaction);
      if (updated) setData(updated);
    } catch (error) {
      setReactionError(
        error instanceof Error ? error.message : "반응을 저장하지 못했습니다.",
      );
    } finally {
      setReacting(false);
    }
  };

  const enterGallery = () => {
    setGalleryEntered(true);
    window.setTimeout(() => {
      document
        .getElementById("gallery-room")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center text-sm text-zinc-500">
        전시를 불러오는 중...
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
    <main className="min-h-screen flex-1 scroll-smooth bg-[radial-gradient(circle_at_top,#211714_0,#070707_44%,#000_100%)] px-6 py-12">
      <style jsx global>{`
        @keyframes galleryReveal {
          from {
            opacity: 0;
            transform: translateY(56px) scale(0.985);
            filter: blur(12px) brightness(0.65);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0) brightness(1);
          }
        }

        @keyframes curtainOpen {
          from {
            opacity: 1;
            transform: scaleX(1);
          }
          to {
            opacity: 0;
            transform: scaleX(0.08);
          }
        }
      `}</style>

      <div className="mx-auto w-full max-w-6xl">
        <Link href="/guest" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← 다른 전시 보기
        </Link>

        <section className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <OrnateFrame variant="wide">
            <Image
              src={data.thumbnail}
              alt={data.title}
              fill
              unoptimized={data.thumbnail.startsWith("data:")}
              className="object-contain"
              priority
              sizes="100vw"
            />
          </OrnateFrame>

          <div className="space-y-5">
            <p className="text-xs uppercase tracking-[0.35em] text-amber-200/60">
              {data.category}
            </p>
            <h1 className="text-4xl font-semibold text-white sm:text-6xl">
              {data.title}
            </h1>
            <p className="text-sm text-zinc-400">curated by {data.hostName}</p>
            <p className="max-w-xl text-base leading-8 text-zinc-300">
              {data.description}
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                disabled={reacting}
                onClick={() => chooseReaction("like")}
                className={`rounded-full border px-5 py-2 text-sm transition disabled:opacity-50 ${
                  myReaction === "like"
                    ? "border-emerald-300 bg-emerald-300 text-black"
                    : "border-zinc-700 text-zinc-200 hover:border-amber-200"
                }`}
              >
                좋아요 {data.likes ?? 0}
              </button>
              <button
                type="button"
                disabled={reacting}
                onClick={() => chooseReaction("dislike")}
                className={`rounded-full border px-5 py-2 text-sm transition disabled:opacity-50 ${
                  myReaction === "dislike"
                    ? "border-rose-300 bg-rose-300 text-black"
                    : "border-zinc-700 text-zinc-200 hover:border-amber-200"
                }`}
              >
                싫어요 {data.dislikes ?? 0}
              </button>
              <button
                type="button"
                onClick={enterGallery}
                className="rounded-full border border-amber-200/50 px-5 py-2 text-sm text-amber-100 transition hover:bg-amber-100 hover:text-black"
              >
                본 전시 입장
              </button>
            </div>
            {reactionError && (
              <p className="text-sm text-amber-200">{reactionError}</p>
            )}
          </div>
        </section>

        <section
          id="gallery-room"
          className="relative mt-28 space-y-20 overflow-hidden rounded-t-[42px] border-t border-amber-100/15 bg-[linear-gradient(180deg,rgba(255,221,154,0.08),rgba(0,0,0,0)_260px)] px-2 py-20"
        >
          <div
            className={`pointer-events-none absolute inset-y-0 left-0 w-1/2 origin-left bg-gradient-to-r from-black via-red-950/70 to-transparent ${
              galleryEntered
                ? "animate-[curtainOpen_1.8s_ease-in-out_0.25s_forwards]"
                : ""
            }`}
          />
          <div
            className={`pointer-events-none absolute inset-y-0 right-0 w-1/2 origin-right bg-gradient-to-l from-black via-red-950/70 to-transparent ${
              galleryEntered
                ? "animate-[curtainOpen_1.8s_ease-in-out_0.25s_forwards]"
                : ""
            }`}
          />
          <div
            className={`relative text-center ${
              galleryEntered
                ? "animate-[galleryReveal_1.4s_ease-out_0.45s_forwards]"
                : "opacity-0 translate-y-10 blur-sm"
            }`}
          >
            <p className="text-xs uppercase tracking-[0.35em] text-amber-200/50">
              Gallery Room
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white">본 전시</h2>
          </div>
          <div className="relative space-y-24">
            {data.artworks.map((art, index) => (
              <FramedArtwork
                key={art.id}
                art={art}
                active={galleryEntered}
                delay={850 + index * 180}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

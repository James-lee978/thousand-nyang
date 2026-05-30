"use client";

import { ExhibitionCard } from "@/components/exhibition/ExhibitionCard";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  getUserProfile,
  listExhibitionsByHost,
  subscribeToFollowState,
  subscribeToUserProfile,
  toggleFollowCurator,
} from "@/firebase/firestore";
import type { Exhibition, User } from "@/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function CuratorPage() {
  const params = useParams();
  const curatorId = String(params.id ?? "");
  const { user } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!curatorId) return;

    let cancelled = false;
    (async () => {
      const [nextProfile, rows] = await Promise.all([
        getUserProfile(curatorId),
        listExhibitionsByHost(curatorId),
      ]);
      if (!cancelled) {
        setProfile(nextProfile);
        setExhibitions(
          rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [curatorId]);

  useEffect(() => {
    if (!curatorId) return;
    return subscribeToUserProfile(curatorId, setProfile);
  }, [curatorId]);

  useEffect(() => {
    if (!curatorId) return;
    return subscribeToFollowState(user?.uid, curatorId, setFollowing);
  }, [curatorId, user?.uid]);

  const toggleFollow = async () => {
    if (!user) {
      setError("로그인 후 팔로우할 수 있습니다.");
      return;
    }
    if (user.uid === curatorId) return;

    setError(null);
    setFollowLoading(true);
    try {
      const next = await toggleFollowCurator(user.uid, curatorId);
      setFollowing(next);
    } catch (event) {
      setError(event instanceof Error ? event.message : "팔로우 상태를 저장하지 못했습니다.");
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-12">
      <Link href="/guest" className="text-sm text-zinc-500 hover:text-zinc-300">
        ← 전시 목록으로
      </Link>

      <section className="mt-8 rounded-3xl border border-zinc-900 bg-zinc-950/70 p-7">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
          Curator
        </p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="text-4xl font-semibold text-white">
              {profile?.nickname ?? "Curator"}
            </h1>
            <p className="mt-3 text-sm text-zinc-400">
              팔로워 {profile?.followerCount ?? 0}명 · 전시 {exhibitions.length}개
            </p>
          </div>

          {user?.uid !== curatorId && (
            <button
              type="button"
              disabled={followLoading}
              onClick={toggleFollow}
              className={`rounded-full border px-5 py-2 text-sm font-semibold transition disabled:opacity-50 ${
                following
                  ? "border-amber-200 bg-amber-200 text-black"
                  : "border-zinc-700 text-zinc-200 hover:border-amber-200"
              }`}
            >
              {following ? "팔로잉" : "팔로우"}
            </button>
          )}
        </div>
        {error && <p className="mt-4 text-sm text-amber-200">{error}</p>}
      </section>

      <section className="mt-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">이 curator의 전시</h2>
        </div>

        {exhibitions.length === 0 ? (
          <p className="rounded-2xl border border-zinc-900 bg-zinc-950/60 p-6 text-sm text-zinc-500">
            아직 공개된 전시가 없습니다.
          </p>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {exhibitions.map((item) => (
              <ExhibitionCard key={item.id} exhibition={item} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

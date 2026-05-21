"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { createExhibition } from "@/firebase/firestore";
import { uploadImage } from "@/firebase/storage";
import { isFirebaseConfigured } from "@/firebase/config";
import { CATEGORIES } from "@/lib/categories";
import type { Artwork, ExhibitionInput } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ArtworkForm = {
  title: string;
  description: string;
  file: File | null;
};

const emptyArtwork = (): ArtworkForm => ({
  title: "",
  description: "",
  file: null,
});

export default function CreateExhibitionPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [price, setPrice] = useState(1000);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [artworks, setArtworks] = useState<ArtworkForm[]>([
    emptyArtwork(),
    emptyArtwork(),
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!isFirebaseConfigured()) return;
    if (!user) router.replace("/login");
  }, [loading, router, user]);

  const addRow = () => {
    if (artworks.length >= 5) return;
    setArtworks((prev) => [...prev, emptyArtwork()]);
  };

  const updateRow = (index: number, patch: Partial<ArtworkForm>) => {
    setArtworks((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  };

  const handleSubmit = async () => {
    setError(null);
    if (!userProfile) {
      setError("사용자 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    if (!title.trim()) {
      setError("전시 제목을 입력하세요.");
      return;
    }
    if (!thumbFile) {
      setError("대표 이미지를 선택하세요.");
      return;
    }
    const filled = artworks.filter((a) => a.title.trim() && a.file);
    if (!filled.length) {
      setError("최소 한 작품의 제목과 이미지를 입력하세요.");
      return;
    }
    
    setSubmitting(true);
    try {
      const exhibitionDraftId = crypto.randomUUID();
      const basePath = `users/${userProfile.uid}/exhibitions/${exhibitionDraftId}`;
      const thumbnail = await uploadImage(thumbFile, `${basePath}/thumbnail`);
      
      const builtArtworks: Artwork[] = [];
      for (const row of filled) {
        if (!row.file) continue;
        const artworkId = crypto.randomUUID();
        const imageUrl = await uploadImage(row.file, `${basePath}/artworks`);
        builtArtworks.push({
          id: artworkId,
          title: row.title.trim(),
          description: row.description.trim(),
          imageUrl,
        });
      }
      
      const payload: ExhibitionInput = {
        title: title.trim(),
        description: description.trim(),
        thumbnail,
        hostId: userProfile.uid, // 사용자 UID 사용
        hostName: userProfile.nickname, // Firestore에 저장된 닉네임 사용
        category,
        createdAt: new Date().toISOString(),
        price,
        artworks: builtArtworks,
      };
      
      await createExhibition(payload);
      alert("전시가 등록되었습니다!");
      router.push("/host");
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "이미지 업로드에 실패했습니다.";
      setError(errorMessage + "\n\nFirebase Storage가 제대로 설정되었는지 확인해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isFirebaseConfigured()) {
    return (
      <main className="mx-auto max-w-3xl flex-1 px-6 py-16">
        <p className="text-zinc-400">
          Firebase와 Storage 설정이 필요합니다.{" "}
          <Link className="text-white underline" href="/login">
            로그인 안내
          </Link>
          를 참고하세요.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <Link href="/host" className="text-sm text-zinc-500 hover:text-zinc-300">
        ← HOST로 돌아가기
      </Link>
      <h1 className="mt-6 text-4xl font-semibold">전시 만들기</h1>
      <p className="mt-3 text-sm text-zinc-400">
        작품은 최대 5개까지 등록할 수 있습니다.
      </p>

      {error && (
        <p className="mt-6 rounded-2xl border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-100">
          {error}
        </p>
      )}

      <div className="mt-10 space-y-6">
        <label className="block space-y-2 text-sm">
          <span className="text-zinc-400">전시 제목</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-zinc-500"
            placeholder="예: Grain Boundary"
          />
        </label>

        <label className="block space-y-2 text-sm">
          <span className="text-zinc-400">대표 이미지</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setThumbFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-zinc-300 file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black"
          />
        </label>

        <label className="block space-y-2 text-sm">
          <span className="text-zinc-400">설명</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-36 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-zinc-500"
            placeholder="전시의 톤과 영감을 적어주세요."
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2 text-sm">
            <span className="text-zinc-400">카테고리</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-zinc-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-2 text-sm">
            <span className="text-zinc-400">가격 (냥)</span>
            <input
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-zinc-500"
            />
          </label>
        </div>
      </div>

      <section className="mt-12 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">작품</h2>
          <button
            type="button"
            onClick={addRow}
            disabled={artworks.length >= 5}
            className="text-sm text-zinc-400 underline decoration-zinc-600 disabled:opacity-30"
          >
            작품 추가
          </button>
        </div>

        {artworks.map((row, index) => (
          <div
            key={index}
            className="space-y-4 rounded-3xl border border-zinc-900 bg-zinc-950/60 p-6"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">
              작품 {index + 1}
            </p>
            <input
              value={row.title}
              onChange={(e) => updateRow(index, { title: e.target.value })}
              placeholder="작품 제목"
              className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none focus:border-zinc-500"
            />
            <textarea
              value={row.description}
              onChange={(e) => updateRow(index, { description: e.target.value })}
              placeholder="작품 설명"
              className="h-28 w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none focus:border-zinc-500"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                updateRow(index, { file: e.target.files?.[0] ?? null })
              }
              className="w-full text-sm text-zinc-300 file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black"
            />
          </div>
        ))}
      </section>

      <button
        type="button"
        disabled={submitting}
        onClick={handleSubmit}
        className="mt-10 w-full rounded-2xl bg-white py-4 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-40"
      >
        {submitting ? "업로드 중…" : "전시 등록하기"}
      </button>
    </main>
  );
}

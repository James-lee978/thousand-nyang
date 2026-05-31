"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { MusicPreviewSelect } from "@/components/exhibition/MusicPreviewSelect";
import { getExhibition, updateExhibition } from "@/firebase/firestore";
import { prepareImageDataUrl } from "@/firebase/storage";
import { CATEGORIES } from "@/lib/categories";
import { DEFAULT_MUSIC_ID } from "@/lib/music";
import type { Artwork, Exhibition } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type DragEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

type ArtworkEdit = Artwork & {
  file: File | null;
};

function FilePreview({
  file,
  currentUrl,
}: {
  file: File | null;
  currentUrl?: string;
}) {
  const previewUrl = useMemo(() => {
    if (file) return URL.createObjectURL(file);
    return currentUrl || null;
  }, [currentUrl, file]);

  useEffect(() => {
    return () => {
      if (file && previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [file, previewUrl]);

  if (!previewUrl) return null;

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
      <Image
        src={previewUrl}
        alt="preview"
        width={960}
        height={540}
        unoptimized={previewUrl.startsWith("data:") || previewUrl.startsWith("blob:")}
        className="h-56 w-full object-cover"
      />
    </div>
  );
}

function ImageDropField({
  label,
  file,
  currentUrl,
  onFile,
}: {
  label: string;
  file: File | null;
  currentUrl?: string;
  onFile: (file: File | null) => void;
}) {
  const [dragging, setDragging] = useState(false);

  const pickFile = (event: ChangeEvent<HTMLInputElement>) => {
    onFile(event.target.files?.[0] ?? null);
  };

  const dropFile = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    const dropped = [...event.dataTransfer.files].find((f) =>
      f.type.startsWith("image/"),
    );
    if (dropped) onFile(dropped);
  };

  return (
    <div className="space-y-2 text-sm">
      <span className="text-zinc-400">{label}</span>
      <label
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={dropFile}
        className={`flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-7 text-center transition ${
          dragging
            ? "border-white bg-white/10 text-white"
            : "border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-500"
        }`}
      >
        <input type="file" accept="image/*" onChange={pickFile} className="sr-only" />
        <span className="text-sm font-semibold text-zinc-100">
          {file ? file.name : "이미지를 교체하려면 선택하거나 끌어오기"}
        </span>
        <span className="mt-2 text-xs text-zinc-500">
          새 파일을 선택하지 않으면 기존 이미지를 유지합니다.
        </span>
      </label>
      <FilePreview file={file} currentUrl={currentUrl} />
    </div>
  );
}

export default function EditExhibitionPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const router = useRouter();
  const { user, loading } = useAuth();
  const [original, setOriginal] = useState<Exhibition | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [price, setPrice] = useState(1000);
  const [musicId, setMusicId] = useState(DEFAULT_MUSIC_ID);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [artworks, setArtworks] = useState<ArtworkEdit[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
  }, [loading, router, user]);

  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    (async () => {
      const exhibition = await getExhibition(id);
      if (!exhibition || cancelled) return;

      if (exhibition.hostId !== user.uid) {
        router.replace("/host");
        return;
      }

      setOriginal(exhibition);
      setTitle(exhibition.title);
      setDescription(exhibition.description);
      setCategory(exhibition.category);
      setPrice(exhibition.price);
      setMusicId(exhibition.musicId ?? DEFAULT_MUSIC_ID);
      setArtworks(exhibition.artworks.map((art) => ({ ...art, file: null })));
    })();

    return () => {
      cancelled = true;
    };
  }, [id, loading, router, user]);

  const updateArtwork = (index: number, patch: Partial<ArtworkEdit>) => {
    setArtworks((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  };

  const addArtwork = () => {
    if (artworks.length >= 5) return;
    setArtworks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: "",
        description: "",
        imageUrl: "",
        file: null,
      },
    ]);
  };

  const removeArtwork = (index: number) => {
    setArtworks((prev) => prev.filter((_, i) => i !== index));
  };

  const save = async () => {
    if (!original || !user) return;
    setError(null);

    if (!title.trim()) {
      setError("전시 제목을 입력해주세요.");
      return;
    }

    const validArtworks = artworks.filter(
      (art) => art.title.trim() && (art.file || art.imageUrl),
    );
    if (!validArtworks.length) {
      setError("최소 한 작품은 제목과 이미지가 있어야 합니다.");
      return;
    }

    setSaving(true);
    try {
      const thumbnail = thumbFile
        ? await prepareImageDataUrl(thumbFile, {
            maxSize: 520,
            quality: 0.48,
            maxBytes: 360 * 1024,
          })
        : original.thumbnail;

      const nextArtworks: Artwork[] = [];
      for (const art of validArtworks) {
        const imageUrl = art.file
          ? await prepareImageDataUrl(art.file, {
              maxSize: 900,
              quality: 0.72,
              maxBytes: 720 * 1024,
            })
          : art.imageUrl;

        nextArtworks.push({
          id: art.id || crypto.randomUUID(),
          title: art.title.trim(),
          description: art.description.trim(),
          imageUrl,
        });
      }

      await updateExhibition(original.id, {
        title: title.trim(),
        description: description.trim(),
        category,
        price,
        musicId,
        thumbnail,
        artworks: nextArtworks,
      });

      router.push("/host");
    } catch (event) {
      setError(event instanceof Error ? event.message : "전시를 수정하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (!original) {
    return (
      <main className="flex flex-1 items-center justify-center text-sm text-zinc-500">
        전시 정보를 불러오는 중...
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <Link href="/host" className="text-sm text-zinc-500 hover:text-zinc-300">
        ← HOST로 돌아가기
      </Link>
      <h1 className="mt-6 text-4xl font-semibold">전시 수정하기</h1>
      <p className="mt-3 text-sm text-zinc-400">
        기존 이미지는 유지하고, 새 파일을 선택한 항목만 교체합니다.
      </p>

      {error && (
        <p className="mt-6 whitespace-pre-line rounded-2xl border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-100">
          {error}
        </p>
      )}

      <div className="mt-10 space-y-6">
        <label className="block space-y-2 text-sm">
          <span className="text-zinc-400">전시 제목</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-zinc-500"
          />
        </label>

        <ImageDropField
          label="대표 이미지"
          file={thumbFile}
          currentUrl={original.thumbnail}
          onFile={setThumbFile}
        />

        <label className="block space-y-2 text-sm">
          <span className="text-zinc-400">설명</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="h-36 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-zinc-500"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2 text-sm">
            <span className="text-zinc-400">카테고리</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-zinc-500"
            >
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2 text-sm">
            <span className="text-zinc-400">가격(냥)</span>
            <input
              type="number"
              min={0}
              value={price}
              onChange={(event) => setPrice(Number(event.target.value))}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-zinc-500"
            />
          </label>
        </div>

        <MusicPreviewSelect value={musicId} onChange={setMusicId} />
      </div>

      <section className="mt-12 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">작품</h2>
          <button
            type="button"
            onClick={addArtwork}
            disabled={artworks.length >= 5 || saving}
            className="text-sm text-zinc-400 underline decoration-zinc-600 disabled:opacity-30"
          >
            작품 추가
          </button>
        </div>

        {artworks.map((art, index) => (
          <div
            key={art.id}
            className="space-y-4 rounded-3xl border border-zinc-900 bg-zinc-950/60 p-6"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">
                작품 {index + 1}
              </p>
              {artworks.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArtwork(index)}
                  className="text-xs text-zinc-500 hover:text-rose-200"
                >
                  삭제
                </button>
              )}
            </div>
            <input
              value={art.title}
              onChange={(event) =>
                updateArtwork(index, { title: event.target.value })
              }
              placeholder="작품 제목"
              className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none focus:border-zinc-500"
            />
            <textarea
              value={art.description}
              onChange={(event) =>
                updateArtwork(index, { description: event.target.value })
              }
              placeholder="작품 설명"
              className="h-28 w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none focus:border-zinc-500"
            />
            <ImageDropField
              label="작품 이미지"
              file={art.file}
              currentUrl={art.imageUrl}
              onFile={(file) => updateArtwork(index, { file })}
            />
          </div>
        ))}
      </section>

      <button
        type="button"
        disabled={saving}
        onClick={save}
        className="mt-10 w-full rounded-2xl bg-white py-4 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-40"
      >
        {saving ? "수정 저장 중..." : "수정 저장하기"}
      </button>
    </main>
  );
}

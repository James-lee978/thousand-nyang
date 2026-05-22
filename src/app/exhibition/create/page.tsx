"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { isFirebaseConfigured } from "@/firebase/config";
import { createExhibition } from "@/firebase/firestore";
import { prepareImageDataUrl } from "@/firebase/storage";
import { CATEGORIES } from "@/lib/categories";
import type { Artwork, ExhibitionInput } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type DragEvent,
  type ChangeEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

type ArtworkForm = {
  title: string;
  description: string;
  file: File | null;
};

type UploadStatus = {
  label: string;
  detail: string;
  progress: number;
  tone: "idle" | "working" | "success";
} | null;

const emptyArtwork = (): ArtworkForm => ({
  title: "",
  description: "",
  file: null,
});

function FilePreview({ file }: { file: File | null }) {
  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!file || !previewUrl) return null;

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
      <Image
        src={previewUrl}
        alt={file.name}
        width={960}
        height={540}
        unoptimized
        className="h-56 w-full object-cover"
      />
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-xs text-zinc-400">
        <span className="truncate">{file.name}</span>
        <span>{(file.size / 1024 / 1024).toFixed(1)}MB</span>
      </div>
    </div>
  );
}

function ImageDropField({
  label,
  file,
  onFile,
}: {
  label: string;
  file: File | null;
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
        className={`flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-8 text-center transition ${
          dragging
            ? "border-white bg-white/10 text-white"
            : "border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-500"
        }`}
      >
        <input type="file" accept="image/*" onChange={pickFile} className="sr-only" />
        <span className="text-sm font-semibold text-zinc-100">
          {file ? file.name : "이미지를 끌어다 놓거나 클릭해서 선택"}
        </span>
        <span className="mt-2 text-xs text-zinc-500">
          10MB 이하 이미지, 저장 시 자동 압축
        </span>
      </label>
      <FilePreview file={file} />
    </div>
  );
}

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
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>(null);
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
    setUploadStatus(null);

    if (!userProfile) {
      setError("사용자 정보를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    if (!title.trim()) {
      setError("전시 제목을 입력해 주세요.");
      return;
    }
    if (!thumbFile) {
      setError("대표 이미지를 선택해 주세요.");
      return;
    }

    const filled = artworks.filter((a) => a.title.trim() && a.file);
    if (!filled.length) {
      setError("최소 한 작품의 제목과 이미지를 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    setUploadStatus({
      label: "등록 준비 중",
      detail: "이미지와 전시 정보를 확인하고 있습니다.",
      progress: 8,
      tone: "working",
    });

    try {
      setUploadStatus({
        label: "대표 이미지 변환 중",
        detail: thumbFile.name,
        progress: 22,
        tone: "working",
      });
      const thumbnail = await prepareImageDataUrl(thumbFile, {
        maxSize: 520,
        quality: 0.48,
        maxBytes: 360 * 1024,
      });

      const builtArtworks: Artwork[] = [];
      for (const [index, row] of filled.entries()) {
        if (!row.file) continue;
        setUploadStatus({
          label: `작품 이미지 변환 중 (${index + 1}/${filled.length})`,
          detail: row.file.name,
          progress: 35 + Math.round(((index + 1) / filled.length) * 45),
          tone: "working",
        });
        const imageUrl = await prepareImageDataUrl(row.file, {
          maxSize: 500,
          quality: 0.45,
          maxBytes: 260 * 1024,
        });
        builtArtworks.push({
          id: crypto.randomUUID(),
          title: row.title.trim(),
          description: row.description.trim(),
          imageUrl,
        });
      }

      setUploadStatus({
        label: "전시 정보 저장 중",
        detail: "Firestore에 전시 문서를 만들고 있습니다.",
        progress: 90,
        tone: "working",
      });

      const payload: ExhibitionInput = {
        title: title.trim(),
        description: description.trim(),
        thumbnail,
        hostId: userProfile.uid,
        hostName: userProfile.nickname,
        category,
        createdAt: new Date().toISOString(),
        price,
        artworks: builtArtworks,
        likes: 0,
        dislikes: 0,
        reactions: {},
      };

      await createExhibition(payload);
      setUploadStatus({
        label: "전시 등록 완료",
        detail: "잠시 후 HOST 화면으로 이동합니다.",
        progress: 100,
        tone: "success",
      });
      await new Promise((resolve) => setTimeout(resolve, 1200));
      router.push("/host");
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : "이미지 처리에 실패했습니다.";
      setError(
        `${errorMessage}\n\n이미지를 더 작은 파일로 선택하거나 작품 수를 줄여 다시 시도해 주세요.`,
      );
      setUploadStatus(null);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isFirebaseConfigured()) {
    return (
      <main className="mx-auto max-w-3xl flex-1 px-6 py-16">
        <p className="text-zinc-400">
          Firebase와 Firestore 설정이 필요합니다.{" "}
          <Link className="text-white underline" href="/login">
            로그인 안내
          </Link>
          를 확인해 주세요.
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
        <p className="mt-6 whitespace-pre-line rounded-2xl border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-100">
          {error}
        </p>
      )}

      {uploadStatus && (
        <div
          className={`mt-6 rounded-2xl border p-4 text-sm ${
            uploadStatus.tone === "success"
              ? "border-emerald-800/70 bg-emerald-950/40 text-emerald-100"
              : "border-zinc-800 bg-zinc-950 text-zinc-200"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <strong>{uploadStatus.label}</strong>
            <span>{uploadStatus.progress}%</span>
          </div>
          <p className="mt-2 text-zinc-400">{uploadStatus.detail}</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className={`h-full rounded-full transition-all ${
                uploadStatus.tone === "success"
                  ? "bg-emerald-400"
                  : "bg-white"
              }`}
              style={{ width: `${uploadStatus.progress}%` }}
            />
          </div>
        </div>
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

        <ImageDropField
          label="대표 이미지"
          file={thumbFile}
          onFile={setThumbFile}
        />

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
            <span className="text-zinc-400">가격 (원)</span>
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
            disabled={artworks.length >= 5 || submitting}
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
              onChange={(e) =>
                updateRow(index, { description: e.target.value })
              }
              placeholder="작품 설명"
              className="h-28 w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none focus:border-zinc-500"
            />
            <ImageDropField
              label="작품 이미지"
              file={row.file}
              onFile={(file) => updateRow(index, { file })}
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
        {submitting ? uploadStatus?.label ?? "등록 중..." : "전시 등록하기"}
      </button>
    </main>
  );
}

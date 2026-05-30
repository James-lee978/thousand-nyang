"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { isFirebaseConfigured } from "@/firebase/config";
import {
  addExhibitionComment,
  addExhibitionReply,
  deleteExhibitionComment,
  deleteExhibitionReply,
  getExhibition,
  reactToComment,
  reactToExhibition,
  subscribeToComments,
  subscribeToFollowState,
  subscribeToReplies,
  subscribeToUserProfile,
  toggleFollowCurator,
  updateExhibitionComment,
  updateExhibitionReply,
} from "@/firebase/firestore";
import { MOCK_EXHIBITIONS } from "@/lib/mock-exhibitions";
import { getExhibitionMusic } from "@/lib/music";
import type {
  Artwork,
  Exhibition,
  ExhibitionComment,
  ExhibitionReply,
  User,
} from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function useClassicalPlayer(musicId?: string) {
  const track = useMemo(() => getExhibitionMusic(musicId), [musicId]);
  const contextRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const timerRef = useRef<number | null>(null);
  const stepRef = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.28);

  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.setValueAtTime(
        muted ? 0 : volume,
        contextRef.current?.currentTime ?? 0,
      );
    }
  }, [muted, volume]);

  const playTone = useCallback((frequency: number, start: number, duration: number) => {
    const context = contextRef.current;
    const gain = gainRef.current;
    if (!context || !gain) return;

    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.value = frequency;
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(0.08, start + 0.03);
    envelope.gain.exponentialRampToValueAtTime(0.001, start + duration);
    oscillator.connect(envelope);
    envelope.connect(gain);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }, []);

  const stop = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    setPlaying(false);
  }, []);

  const start = useCallback(async () => {
    if (playing) {
      stop();
      return;
    }

    const audioWindow = window as typeof window & {
      webkitAudioContext?: typeof AudioContext;
    };
    const AudioContextClass =
      audioWindow.AudioContext || audioWindow.webkitAudioContext;
    if (!AudioContextClass) return;

    const context = contextRef.current ?? new AudioContextClass();
    contextRef.current = context;
    if (context.state === "suspended") await context.resume();

    const existingGain = gainRef.current;
    const gain = existingGain ?? context.createGain();
    gain.gain.setValueAtTime(muted ? 0 : volume, context.currentTime);
    if (!existingGain) {
      gain.connect(context.destination);
      gainRef.current = gain;
    }

    stepRef.current = 0;
    setPlaying(true);
    timerRef.current = window.setInterval(() => {
      const now = context.currentTime;
      const step = stepRef.current;
      const root = track.bass[step % track.bass.length];
      playTone(root, now, 0.9);
      playTone(track.scale[(step * 2) % track.scale.length], now + 0.05, 0.45);
      playTone(track.scale[(step * 2 + 2) % track.scale.length], now + 0.28, 0.5);
      playTone(track.scale[(step * 2 + 4) % track.scale.length], now + 0.52, 0.6);
      stepRef.current += 1;
    }, track.tempo);
  }, [muted, playTone, playing, stop, track, volume]);

  useEffect(() => stop, [stop]);

  return { playing, muted, volume, track, setMuted, setVolume, start };
}

function MusicControls({ musicId }: { musicId?: string }) {
  const { playing, muted, volume, track, setMuted, setVolume, start } =
    useClassicalPlayer(musicId);

  return (
    <div className="rounded-2xl border border-amber-100/20 bg-black/40 p-4 text-sm text-zinc-300">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-amber-200/60">
            Classical BGM
          </p>
          <p className="mt-1 text-zinc-200">{track.title}</p>
          <p className="text-xs text-zinc-500">{track.mood}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={start}
            className="rounded-full border border-zinc-700 px-4 py-2 text-zinc-100 hover:border-amber-200"
          >
            {playing ? "정지" : "재생"}
          </button>
          <button
            type="button"
            onClick={() => setMuted(!muted)}
            className="rounded-full border border-zinc-700 px-4 py-2 text-zinc-100 hover:border-amber-200"
          >
            {muted ? "소리 켜기" : "음소거"}
          </button>
        </div>
      </div>
      <label className="mt-4 flex items-center gap-3">
        <span className="text-xs text-zinc-500">Volume</span>
        <input
          type="range"
          min={0}
          max={0.8}
          step={0.01}
          value={volume}
          onChange={(event) => setVolume(Number(event.target.value))}
          className="w-full accent-amber-200"
        />
      </label>
    </div>
  );
}

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

function FramedArtwork({ art, active }: { art: Artwork; active: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!active) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setIsVisible(true);
        });
      },
      { threshold: 0.3, rootMargin: "-10% 0px -10% 0px" },
    );

    const node = ref.current;
    if (node) observer.observe(node);
    return () => {
      if (node) observer.unobserve(node);
    };
  }, [active]);

  return (
    <article
      ref={ref}
      className={`mx-auto flex min-h-screen max-w-4xl items-center justify-center py-20 transition-all duration-1000 ease-out ${
        isVisible
          ? "translate-y-0 opacity-100 blur-0"
          : "translate-y-20 opacity-0 blur-sm"
      }`}
    >
      <div className="w-full">
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
      </div>
    </article>
  );
}

function RepliesPanel({
  exhibitionId,
  comment,
  user,
  nickname,
}: {
  exhibitionId: string;
  comment: ExhibitionComment;
  user: { uid: string } | null;
  nickname: string;
}) {
  const [replies, setReplies] = useState<ExhibitionReply[]>([]);
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState("");

  useEffect(() => {
    return subscribeToReplies(exhibitionId, comment.id, setReplies);
  }, [comment.id, exhibitionId]);

  const submitReply = async () => {
    if (!user || !body.trim()) return;
    await addExhibitionReply(exhibitionId, comment.id, user.uid, nickname, body.trim());
    setBody("");
  };

  const saveReply = async (replyId: string) => {
    if (!editingBody.trim()) return;
    await updateExhibitionReply(exhibitionId, comment.id, replyId, editingBody.trim());
    setEditingId(null);
    setEditingBody("");
  };

  return (
    <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
      <p className="text-xs font-semibold text-zinc-400">
        답글 {replies.length}개
      </p>
      <div className="mt-3 space-y-3">
        {replies.map((reply) => {
          const mine = user?.uid === reply.uid;
          const editing = editingId === reply.id;
          return (
            <article key={reply.id} className="border-l border-zinc-800 pl-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-zinc-200">
                  {reply.nickname}
                </p>
                {mine && (
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(reply.id);
                        setEditingBody(reply.body);
                      }}
                      className="text-zinc-500 hover:text-white"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        deleteExhibitionReply(exhibitionId, comment.id, reply.id)
                      }
                      className="text-zinc-500 hover:text-rose-200"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
              {editing ? (
                <div className="mt-2 space-y-2">
                  <textarea
                    value={editingBody}
                    onChange={(event) => setEditingBody(event.target.value)}
                    className="h-20 w-full rounded-xl border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => saveReply(reply.id)}
                    className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-black"
                  >
                    저장
                  </button>
                </div>
              ) : (
                <p className="mt-1 whitespace-pre-line text-sm leading-6 text-zinc-400">
                  {reply.body}
                </p>
              )}
            </article>
          );
        })}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={user ? "답글 추가..." : "로그인 후 답글 작성"}
          disabled={!user}
          className="min-w-0 flex-1 rounded-full border border-zinc-800 bg-black px-4 py-2 text-sm text-white outline-none disabled:opacity-50"
        />
        <button
          type="button"
          disabled={!user || !body.trim()}
          onClick={submitReply}
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
        >
          등록
        </button>
      </div>
    </div>
  );
}

function CommentsModal({
  open,
  onClose,
  exhibition,
  comments,
  user,
  nickname,
  onCommentCountChange,
}: {
  open: boolean;
  onClose: () => void;
  exhibition: Exhibition;
  comments: ExhibitionComment[];
  user: { uid: string } | null;
  nickname: string;
  onCommentCountChange: (delta: number) => void;
}) {
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);

  const submitComment = async () => {
    if (!user) {
      setCommentError("로그인 후 댓글을 작성할 수 있습니다.");
      return;
    }
    if (!body.trim()) return;
    await addExhibitionComment(exhibition.id, user.uid, nickname, body.trim());
    setBody("");
    onCommentCountChange(1);
  };

  const saveEdit = async (commentId: string) => {
    if (!editingBody.trim()) return;
    await updateExhibitionComment(exhibition.id, commentId, editingBody.trim());
    setEditingId(null);
    setEditingBody("");
  };

  const removeComment = async (comment: ExhibitionComment) => {
    await deleteExhibitionComment(exhibition.id, comment.id);
    onCommentCountChange(-1 * (1 + (comment.replyCount ?? 0)));
  };

  const chooseCommentReaction = async (
    commentId: string,
    reaction: "like" | "dislike",
  ) => {
    if (!user) {
      setCommentError("로그인 후 댓글에 반응할 수 있습니다.");
      return;
    }
    await reactToComment(exhibition.id, commentId, user.uid, reaction);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[220] flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <button
        type="button"
        aria-label="댓글 닫기"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <section className="relative flex max-h-[86vh] w-full max-w-2xl flex-col rounded-t-[28px] border border-zinc-800 bg-zinc-950 shadow-[0_-24px_80px_rgba(0,0,0,0.65)]">
        <div className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/95 px-5 py-4">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-700" />
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">
                Comments
              </p>
              <h2 className="text-xl font-semibold text-white">
                댓글 {exhibition.commentCount ?? comments.length}개
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-zinc-800 px-4 py-2 text-sm text-zinc-300"
            >
              닫기
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="space-y-3">
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={user ? "전시에 대한 감상을 남겨주세요." : "로그인 후 댓글 작성"}
              disabled={!user}
              className="h-24 w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none focus:border-amber-200 disabled:opacity-50"
            />
            <button
              type="button"
              disabled={!user || !body.trim()}
              onClick={submitComment}
              className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black disabled:opacity-40"
            >
              댓글 등록
            </button>
            {commentError && (
              <p className="text-sm text-amber-200">{commentError}</p>
            )}
          </div>

          <div className="mt-7 space-y-4">
            {comments.map((comment) => {
              const mine = user?.uid === comment.uid;
              const editing = editingId === comment.id;
              const myReaction = user ? comment.reactions?.[user.uid] : null;
              return (
                <article
                  key={comment.id}
                  className="rounded-2xl border border-zinc-800 bg-black/70 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-zinc-100">
                        {comment.nickname}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {formatDateTime(comment.createdAt)}
                        {comment.updatedAt ? " · 수정됨" : ""}
                      </p>
                    </div>
                    {mine && (
                      <div className="flex gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(comment.id);
                            setEditingBody(comment.body);
                          }}
                          className="text-zinc-400 hover:text-white"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => removeComment(comment)}
                          className="text-zinc-400 hover:text-rose-200"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>

                  {editing ? (
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={editingBody}
                        onChange={(event) => setEditingBody(event.target.value)}
                        className="h-24 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-200"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveEdit(comment.id)}
                          className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-black"
                        >
                          저장
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setEditingBody("");
                          }}
                          className="rounded-full border border-zinc-700 px-4 py-1.5 text-xs text-zinc-300"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-zinc-300">
                      {comment.body}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => chooseCommentReaction(comment.id, "like")}
                      className={`rounded-full border px-3 py-1.5 ${
                        myReaction === "like"
                          ? "border-emerald-300 bg-emerald-300 text-black"
                          : "border-zinc-800 text-zinc-400"
                      }`}
                    >
                      좋아요 {comment.likes ?? 0}
                    </button>
                    <button
                      type="button"
                      onClick={() => chooseCommentReaction(comment.id, "dislike")}
                      className={`rounded-full border px-3 py-1.5 ${
                        myReaction === "dislike"
                          ? "border-rose-300 bg-rose-300 text-black"
                          : "border-zinc-800 text-zinc-400"
                      }`}
                    >
                      싫어요 {comment.dislikes ?? 0}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(expandedId === comment.id ? null : comment.id)
                      }
                      className="rounded-full border border-zinc-800 px-3 py-1.5 text-zinc-300"
                    >
                      답글 {comment.replyCount ?? 0}개
                    </button>
                  </div>

                  {expandedId === comment.id && (
                    <RepliesPanel
                      exhibitionId={exhibition.id}
                      comment={comment}
                      user={user}
                      nickname={nickname}
                    />
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ExhibitionDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const { user, userProfile } = useAuth();
  const [data, setData] = useState<Exhibition | null>(null);
  const [comments, setComments] = useState<ExhibitionComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [reacting, setReacting] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [curatorProfile, setCuratorProfile] = useState<User | null>(null);
  const [reactionError, setReactionError] = useState<string | null>(null);
  const [galleryEntered, setGalleryEntered] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);

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

  useEffect(() => {
    if (!data || !isFirebaseConfigured()) return;
    return subscribeToComments(data.id, setComments);
  }, [data]);

  useEffect(() => {
    if (!data || !isFirebaseConfigured()) return;
    return subscribeToUserProfile(data.hostId, setCuratorProfile);
  }, [data]);

  useEffect(() => {
    if (!data || !isFirebaseConfigured()) return;
    return subscribeToFollowState(user?.uid, data.hostId, setFollowing);
  }, [data, user?.uid]);

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

  const toggleFollow = async () => {
    if (!user) {
      setReactionError("로그인 후 curator를 팔로우할 수 있습니다.");
      return;
    }
    if (!data || user.uid === data.hostId || !isFirebaseConfigured()) return;

    setReactionError(null);
    setFollowLoading(true);
    try {
      const next = await toggleFollowCurator(user.uid, data.hostId);
      setFollowing(next);
    } catch (error) {
      setReactionError(
        error instanceof Error ? error.message : "팔로우 상태를 저장하지 못했습니다.",
      );
    } finally {
      setFollowLoading(false);
    }
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

  const nickname =
    userProfile?.nickname || user?.displayName || user?.email || "익명 관람객";

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
            <div className="space-y-1 text-sm text-zinc-400">
              <div className="flex flex-wrap items-center gap-2">
                <span>curated by {curatorProfile?.nickname ?? data.hostName}</span>
                <span className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-300">
                  팔로워 {curatorProfile?.followerCount ?? 0}명
                </span>
                <Link
                  href={`/curator/${data.hostId}`}
                  className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-300 hover:border-amber-200"
                >
                  다른 전시 보기
                </Link>
                {user?.uid !== data.hostId && (
                  <button
                    type="button"
                    disabled={followLoading}
                    onClick={toggleFollow}
                    className={`rounded-full border px-3 py-1 text-xs transition disabled:opacity-50 ${
                      following
                        ? "border-amber-200 bg-amber-200 text-black"
                        : "border-zinc-800 text-zinc-300 hover:border-amber-200"
                    }`}
                  >
                    {following ? "팔로잉" : "팔로우"}
                  </button>
                )}
              </div>
              <p>업로드 {formatDateTime(data.createdAt)}</p>
            </div>
            <p className="max-w-xl text-base leading-8 text-zinc-300">
              {data.description}
            </p>

            <MusicControls musicId={data.musicId} />

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
                onClick={() => setCommentsOpen(true)}
                className="rounded-full border border-zinc-700 px-5 py-2 text-sm text-zinc-200 transition hover:border-amber-200"
              >
                댓글 {data.commentCount ?? comments.length}
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
          className="relative mt-28 space-y-0 overflow-hidden rounded-t-[42px] border-t border-amber-100/15 bg-[linear-gradient(180deg,rgba(255,221,154,0.08),rgba(0,0,0,0)_260px)] px-2 py-20"
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
                : "translate-y-10 opacity-0 blur-sm"
            }`}
          >
            <p className="text-xs uppercase tracking-[0.35em] text-amber-200/50">
              Gallery Room
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white">본 전시</h2>
          </div>
          <div className="relative space-y-0">
            {data.artworks.map((art) => (
              <FramedArtwork key={art.id} art={art} active={galleryEntered} />
            ))}
          </div>
        </section>
      </div>

      <CommentsModal
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        exhibition={data}
        comments={comments}
        user={user}
        nickname={nickname}
        onCommentCountChange={(delta) =>
          setData((prev) =>
            prev
              ? {
                  ...prev,
                  commentCount: Math.max(0, (prev.commentCount ?? 0) + delta),
                }
              : prev,
          )
        }
      />
    </main>
  );
}

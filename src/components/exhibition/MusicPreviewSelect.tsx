"use client";

import { EXHIBITION_MUSIC, getExhibitionMusic } from "@/lib/music";
import { useCallback, useEffect, useRef, useState } from "react";

function useMusicPreview() {
  const contextRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const stepRef = useRef(0);
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  const stopPreview = useCallback(() => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    intervalRef.current = null;
    timeoutRef.current = null;
    gainRef.current?.gain.setValueAtTime(0, contextRef.current?.currentTime ?? 0);
    setPreviewingId(null);
  }, []);

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

  const startPreview = useCallback(
    async (musicId: string) => {
      if (previewingId === musicId) {
        stopPreview();
        return;
      }

      stopPreview();

      const track = getExhibitionMusic(musicId);
      const audioWindow = window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      };
      const AudioContextClass =
        audioWindow.AudioContext || audioWindow.webkitAudioContext;
      if (!AudioContextClass) return;

      const context = contextRef.current ?? new AudioContextClass();
      contextRef.current = context;
      if (context.state === "suspended") await context.resume();

      const gain = gainRef.current ?? context.createGain();
      gain.gain.setValueAtTime(0.26, context.currentTime);
      if (!gainRef.current) {
        gain.connect(context.destination);
        gainRef.current = gain;
      }

      stepRef.current = 0;
      setPreviewingId(musicId);

      const playStep = () => {
        const now = context.currentTime;
        const step = stepRef.current;
        playTone(track.bass[step % track.bass.length], now, 0.75);
        playTone(track.scale[(step * 2) % track.scale.length], now + 0.05, 0.4);
        playTone(track.scale[(step * 2 + 2) % track.scale.length], now + 0.26, 0.45);
        playTone(track.scale[(step * 2 + 4) % track.scale.length], now + 0.48, 0.5);
        stepRef.current += 1;
      };

      playStep();
      intervalRef.current = window.setInterval(playStep, track.tempo);
      timeoutRef.current = window.setTimeout(stopPreview, 5000);
    },
    [playTone, previewingId, stopPreview],
  );

  useEffect(() => stopPreview, [stopPreview]);

  return { previewingId, startPreview, stopPreview };
}

export function MusicPreviewSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { previewingId, startPreview } = useMusicPreview();
  const selected = getExhibitionMusic(value);

  return (
    <div className="space-y-3">
      <label className="block space-y-2 text-sm">
        <span className="text-zinc-400">전시 음악</span>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-zinc-500"
        >
          {EXHIBITION_MUSIC.map((track) => (
            <option key={track.id} value={track.id}>
              {track.title} - {track.mood}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-900 bg-zinc-950/70 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-zinc-100">{selected.title}</p>
          <p className="text-xs text-zinc-500">{selected.mood}</p>
        </div>
        <button
          type="button"
          onClick={() => startPreview(value)}
          className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-amber-200"
        >
          {previewingId === value ? "미리듣기 중..." : "5초 미리듣기"}
        </button>
      </div>
    </div>
  );
}

import type { Exhibition } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { ScaleIn } from "@/components/effects/ScrollTransition";

type Props = { exhibition: Exhibition; href?: string };

export function ExhibitionCard({ exhibition, href }: Props) {
  const to = href ?? `/exhibition/${exhibition.id}`;
  return (
    <ScaleIn>
      <Link
        href={to}
        className="group relative block overflow-hidden"
      >
        {/* Large immersive image */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-950">
          <Image
            src={exhibition.thumbnail}
            alt={exhibition.title}
            fill
            unoptimized={exhibition.thumbnail.startsWith("data:")}
            className="object-cover transition duration-1000 group-hover:scale-105 group-hover:brightness-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Dark overlay for gallery lighting effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 transition-opacity group-hover:opacity-40" />
        </div>

        {/* Wall caption style info */}
        <div className="absolute bottom-0 left-0 right-0 p-8 space-y-3">
          <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-400">
            {exhibition.category}
          </p>
          <h3 className="text-2xl font-light tracking-tight text-white group-hover:tracking-wide transition-all duration-500">
            {exhibition.title}
          </h3>
          <div className="flex items-center space-x-3">
            <div className="h-px w-8 bg-zinc-600" />
            <p className="text-xs text-zinc-500">{exhibition.hostName}</p>
          </div>
        </div>

        {/* Hover effect border */}
        <div className="absolute inset-0 border border-transparent transition-all duration-500 group-hover:border-white/20" />
      </Link>
    </ScaleIn>
  );
}

import type { Exhibition } from "@/types";
import Image from "next/image";
import Link from "next/link";

type Props = { exhibition: Exhibition; href?: string };

export function ExhibitionCard({ exhibition, href }: Props) {
  const to = href ?? `/exhibition/${exhibition.id}`;
  return (
    <Link
      href={to}
      className="group overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 transition hover:border-zinc-600"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image
          src={exhibition.thumbnail}
          alt={exhibition.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
      <div className="space-y-2 p-6">
        <p className="text-xs uppercase tracking-widest text-zinc-500">
          {exhibition.category}
        </p>
        <h3 className="text-2xl font-semibold text-white">{exhibition.title}</h3>
        <p className="text-sm text-zinc-400">{exhibition.hostName}</p>
        <p className="line-clamp-2 text-sm text-zinc-500">{exhibition.description}</p>
      </div>
    </Link>
  );
}

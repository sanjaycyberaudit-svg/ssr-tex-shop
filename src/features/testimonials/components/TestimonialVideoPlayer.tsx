"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import {
  defaultPosterForEmbed,
  embedIframeSrc,
  parseVideoEmbed,
} from "../lib/video";

type Props = {
  videoUrl: string;
  posterUrl?: string | null;
  customerName: string;
  className?: string;
};

export function TestimonialVideoPlayer({
  videoUrl,
  posterUrl,
  customerName,
  className,
}: Props) {
  const [active, setActive] = useState(false);
  const embed = parseVideoEmbed(videoUrl);
  const poster =
    posterUrl || (embed ? defaultPosterForEmbed(embed) : null) || undefined;
  const externalPoster =
    !!poster &&
    (poster.includes("img.youtube.com") || poster.includes("vumbnail.com"));

  const onPlay = useCallback(() => setActive(true), []);

  if (!embed) {
    return (
      <div
        className={cn(
          "flex aspect-[5/3] w-full items-center justify-center bg-[#00542E] p-4 text-center text-sm text-white sm:aspect-[16/10]",
          className,
        )}
      >
        Video link could not be loaded. Check the URL in admin.
      </div>
    );
  }

  if (active) {
    return (
      <div
        className={cn(
          "relative aspect-[5/3] w-full bg-black sm:aspect-[16/10]",
          className,
        )}
      >
        {embed.provider === "direct" ? (
          <video
            className="absolute inset-0 h-full w-full object-contain"
            src={embed.src}
            controls
            playsInline
            preload="metadata"
            autoPlay
          />
        ) : (
          <iframe
            title={`Video review from ${customerName}`}
            src={embedIframeSrc(embed)}
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onPlay}
      className={cn(
        "group relative block aspect-[5/3] w-full overflow-hidden bg-[#003d22] text-left sm:aspect-[16/10]",
        className,
      )}
      aria-label={`Play video review from ${customerName}`}
    >
      {poster ? (
        <Image
          src={poster}
          alt=""
          fill
          unoptimized={externalPoster}
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 78vw, 400px"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          loading="lazy"
        />
      ) : (
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#00542E] via-[#006b3a] to-[#003d22]"
          aria-hidden
        />
      )}
      <div className="absolute inset-0 bg-black/35 transition-colors group-hover:bg-black/25" />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/90 bg-[#00542E]/90 text-white shadow-lg transition-transform group-active:scale-95 sm:h-14 sm:w-14 sm:group-hover:scale-105">
          <Play className="ml-0.5 h-5 w-5 fill-current sm:h-6 sm:w-6" />
        </span>
      </span>
      <span className="absolute bottom-2 right-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white sm:text-xs">
        Tap to play
      </span>
    </button>
  );
}

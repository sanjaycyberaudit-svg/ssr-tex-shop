"use client";

import Image from "next/image";
import { Star } from "lucide-react";
import { DocumentType } from "@/gql";
import { CarouselItem } from "@/components/ui/carousel";
import { TestimonialCardFragment } from "@/features/testimonials";
import { TestimonialVideoPlayer } from "@/features/testimonials/components/TestimonialVideoPlayer";
import { keytoUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { HomeSectionHeader } from "./HomeSectionHeader";
import { HomeCarousel, homeCarouselItemClass } from "./HomeCarousel";

type TestimonialNode = DocumentType<typeof TestimonialCardFragment>;

type Props = {
  testimonials: { node: TestimonialNode }[];
};

const cardShell =
  "flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#00542E]/15 bg-muted/40 shadow-sm";
const mediaAspect = "relative w-full aspect-[5/3] sm:aspect-[16/10]";

function TestimonialMeta({
  node,
  compact,
  onDark = true,
}: {
  node: TestimonialNode;
  compact?: boolean;
  onDark?: boolean;
}) {
  const subtitle = node.location
    ? `Verified customer · ${node.location}`
    : "Verified customer";
  const starMuted = onDark ? "text-white/40" : "text-muted-foreground/50";

  return (
    <>
      <div className="flex gap-0.5" aria-label={`${node.rating ?? 5} out of 5 stars`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-3.5 w-3.5 sm:h-4 sm:w-4",
              i < (node.rating ?? 5)
                ? "fill-[#FFD700] text-[#FFD700]"
                : cn("fill-transparent", starMuted),
            )}
          />
        ))}
      </div>
      {node.quote ? (
        <p
          className={cn(
            "mt-2 font-medium leading-snug",
            compact
              ? "line-clamp-2 text-xs sm:text-sm"
              : "line-clamp-4 text-sm sm:text-base",
            onDark ? "text-white" : "text-foreground",
          )}
        >
          &ldquo;{node.quote}&rdquo;
        </p>
      ) : null}
      <p
        className={cn(
          "mt-2 font-bold leading-tight",
          compact ? "text-sm sm:text-base" : "text-base sm:text-lg",
          onDark ? "text-white" : "text-foreground",
        )}
      >
        {node.customer_name}
      </p>
      <p
        className={cn(
          "mt-0.5 text-xs sm:text-sm",
          onDark ? "text-white/90" : "text-muted-foreground",
        )}
      >
        {subtitle}
      </p>
    </>
  );
}

function TextTestimonialCard({ node }: { node: TestimonialNode }) {
  const imageKey = node.featuredImage?.key;

  return (
    <article className={cardShell}>
      <div className={cn(mediaAspect, "shrink-0")}>
        {imageKey ? (
          <Image
            src={keytoUrl(imageKey)}
            alt={
              node.featuredImage?.alt || `Review from ${node.customer_name}`
            }
            fill
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 78vw, 400px"
            className="object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-[#00542E] via-[#006b3a] to-[#003d22]"
            aria-hidden
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />
        <div className="absolute inset-0 flex flex-col justify-end p-3 text-white sm:p-5">
          <TestimonialMeta node={node} onDark />
        </div>
      </div>
    </article>
  );
}

function VideoTestimonialCard({ node }: { node: TestimonialNode }) {
  const posterUrl = node.featuredImage?.key
    ? keytoUrl(node.featuredImage.key)
    : null;

  return (
    <article className={cardShell}>
      <TestimonialVideoPlayer
        videoUrl={node.video_url ?? ""}
        posterUrl={posterUrl}
        customerName={node.customer_name}
        className="w-full shrink-0"
      />
      <div className="shrink-0 bg-gradient-to-br from-[#00542E] to-[#003d22] p-3 text-white sm:p-4">
        <TestimonialMeta node={node} compact onDark />
      </div>
    </article>
  );
}

export function HomeTestimonialsCarousel({ testimonials }: Props) {
  if (!testimonials.length) return null;

  return (
    <section className="w-full min-w-0 py-4 sm:py-8 md:py-10">
      <HomeSectionHeader
        title="Customer"
        titleAccent="Feedback"
        showViewMore={false}
      />
      <HomeCarousel loop={testimonials.length > 1} delayMs={4000}>
        {testimonials.map(({ node }) => {
          const isVideo =
            node.kind === "video" && Boolean(node.video_url?.trim());
          return (
            <CarouselItem key={node.id} className={homeCarouselItemClass}>
              {isVideo ? (
                <VideoTestimonialCard node={node} />
              ) : (
                <TextTestimonialCard node={node} />
              )}
            </CarouselItem>
          );
        })}
      </HomeCarousel>
    </section>
  );
}

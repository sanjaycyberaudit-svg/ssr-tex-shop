"use client";

import Image from "next/image";
import { BadgeCheck, Quote, Star } from "lucide-react";
import { DocumentType } from "@/gql";
import { TestimonialCardFragment } from "@/features/testimonials";
import { TestimonialVideoPlayer } from "@/features/testimonials/components/TestimonialVideoPlayer";
import { keytoUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { HomeSectionHeader } from "./HomeSectionHeader";
import {
  HomeScrollSnapStrip,
  ScrollSnapItem,
} from "./HomeScrollSnapStrip";
import { MotionHoverLift, MotionRevealItem, MotionSection } from "./MotionSection";

type TestimonialNode = DocumentType<typeof TestimonialCardFragment>;

type Props = {
  testimonials: { node: TestimonialNode }[];
};

const scrollSnapTestimonialItemClass =
  "basis-[88%] sm:basis-[62%] md:basis-[46%] lg:basis-[34%] xl:basis-[30%]";

const scrollSnapTestimonialVideoItemClass =
  "basis-[52%] sm:basis-[38%] md:basis-[28%] lg:basis-[22%]";

function StarRating({ rating }: { rating: number }) {
  return (
    <div
      className="inline-flex items-center gap-0.5"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5 sm:h-4 sm:w-4",
            i < rating
              ? "fill-[#C5A059] text-[#C5A059]"
              : "fill-transparent text-[#C1105A]/20",
          )}
        />
      ))}
    </div>
  );
}

function CustomerAvatar({
  name,
  imageKey,
  imageAlt,
}: {
  name: string;
  imageKey?: string | null;
  imageAlt?: string | null;
}) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  if (imageKey) {
    return (
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-[#C1105A]/15 ring-offset-2 ring-offset-background">
        <Image
          src={keytoUrl(imageKey)}
          alt={imageAlt || name}
          fill
          sizes="44px"
          className="object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#C1105A] to-[#7A0E43] text-sm font-bold text-white ring-2 ring-[#C1105A]/15 ring-offset-2 ring-offset-background">
      {initials || "ST"}
    </div>
  );
}

function ModernTextTestimonialCard({ node }: { node: TestimonialNode }) {
  const imageKey = node.featuredImage?.key;

  return (
    <article className="flex h-full min-h-[260px] flex-col rounded-2xl border border-[#C1105A]/12 bg-card p-5 shadow-[0_16px_40px_-28px_rgba(193,16,90,0.45)] sm:min-h-[280px] sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <StarRating rating={node.rating ?? 5} />
        <Quote
          className="h-8 w-8 shrink-0 text-[#C1105A]/15"
          aria-hidden
        />
      </div>

      {node.quote ? (
        <blockquote className="flex-1 font-[family-name:var(--font-hero-serif)] text-base leading-relaxed text-foreground/90 sm:text-lg">
          “{node.quote}”
        </blockquote>
      ) : (
        <p className="flex-1 text-sm text-muted-foreground">
          Thank you for shopping with SRI SAI RAGHAVENDRA TEX.
        </p>
      )}

      <footer className="mt-5 flex items-center gap-3 border-t border-[#C1105A]/10 pt-4">
        <CustomerAvatar
          name={node.customer_name}
          imageKey={imageKey}
          imageAlt={node.featuredImage?.alt}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground sm:text-base">
            {node.customer_name}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[#C1105A]" />
            <span className="truncate">
              {node.location
                ? `Verified buyer · ${node.location}`
                : "Verified buyer"}
            </span>
          </p>
        </div>
      </footer>
    </article>
  );
}

function ModernVideoTestimonialCard({ node }: { node: TestimonialNode }) {
  const imageKey = node.featuredImage?.key;
  const posterUrl = imageKey ? keytoUrl(imageKey) : null;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#C1105A]/15 bg-[#5A0A33]/5 shadow-[0_16px_40px_-24px_rgba(193,16,90,0.5)]">
      <div className="relative aspect-[9/14] w-full bg-muted sm:aspect-[3/4]">
        <TestimonialVideoPlayer
          fill
          showTapHint
          videoUrl={node.video_url ?? ""}
          posterUrl={posterUrl}
          customerName={node.customer_name}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#5A0A33]/95 via-[#5A0A33]/50 to-transparent p-4 pt-16">
          <StarRating rating={node.rating ?? 5} />
          {node.quote ? (
            <p className="mt-2 line-clamp-2 text-sm font-medium leading-snug text-white">
              “{node.quote}”
            </p>
          ) : null}
          <p className="mt-2 text-base font-bold text-white">
            {node.customer_name}
          </p>
          {node.location ? (
            <p className="mt-0.5 text-xs text-white/80">{node.location}</p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function HomeTestimonialsCarousel({ testimonials }: Props) {
  if (!testimonials.length) return null;

  return (
    <MotionSection className="w-full min-w-0 py-4 sm:py-8 md:py-10">
      <HomeSectionHeader
        title="Customer"
        titleAccent="Testimonials"
        showViewMore={false}
      />
      <HomeScrollSnapStrip ariaLabel="Customer testimonials from admin">
        {testimonials.map(({ node }, index) => {
          const isVideo =
            node.kind === "video" && Boolean(node.video_url?.trim());

          return (
            <ScrollSnapItem
              key={node.id}
              className={
                isVideo
                  ? scrollSnapTestimonialVideoItemClass
                  : scrollSnapTestimonialItemClass
              }
            >
              <MotionRevealItem index={index} className="h-full">
                <MotionHoverLift className="h-full">
                  {isVideo ? (
                    <ModernVideoTestimonialCard node={node} />
                  ) : (
                    <ModernTextTestimonialCard node={node} />
                  )}
                </MotionHoverLift>
              </MotionRevealItem>
            </ScrollSnapItem>
          );
        })}
      </HomeScrollSnapStrip>
    </MotionSection>
  );
}

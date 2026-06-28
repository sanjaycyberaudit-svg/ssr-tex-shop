"use client";

import Image from "next/image";
import { Quote, Star } from "lucide-react";
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

/** Same shell as Product Categories cards */
const cardClass =
  "group block h-full overflow-hidden rounded-[1.25rem] border border-[#C1105A]/15 bg-muted/40 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#C1105A]/30 hover:shadow-[0_18px_40px_-18px_rgba(193,16,90,0.45)] active:scale-[0.99]";
const mediaClass = "relative w-full aspect-[5/3] sm:aspect-[16/10]";

function TestimonialMeta({ node }: { node: TestimonialNode }) {
  const subtitle = node.location
    ? `Verified customer · ${node.location}`
    : "Verified customer";

  return (
    <>
      <div
        className="inline-flex w-fit items-center gap-0.5 rounded-full bg-white/15 px-2 py-1 backdrop-blur-sm ring-1 ring-white/20"
        aria-label={`${node.rating ?? 5} out of 5 stars`}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-3 w-3",
              i < (node.rating ?? 5)
                ? "fill-[#FFD700] text-[#FFD700]"
                : "fill-transparent text-white/40",
            )}
          />
        ))}
      </div>
      {node.quote ? (
        <p className="mt-2 flex gap-1.5 text-sm font-medium leading-snug">
          <Quote
            className="mt-0.5 h-3.5 w-3.5 shrink-0 fill-[#FFD700] text-[#FFD700]"
            aria-hidden
          />
          <span className="line-clamp-3">{node.quote}</span>
        </p>
      ) : null}
      <p className="mt-1.5 text-base font-bold leading-tight">
        {node.customer_name}
      </p>
      <p className="mt-0.5 text-xs opacity-90">{subtitle}</p>
    </>
  );
}

function TestimonialCard({
  node,
  variant,
}: {
  node: TestimonialNode;
  variant: "text" | "video";
}) {
  const imageKey = node.featuredImage?.key;
  const posterUrl = imageKey ? keytoUrl(imageKey) : null;

  return (
    <article className={cardClass}>
      <div className={mediaClass}>
        {variant === "video" ? (
          <TestimonialVideoPlayer
            fill
            showTapHint={false}
            videoUrl={node.video_url ?? ""}
            posterUrl={posterUrl}
            customerName={node.customer_name}
          />
        ) : imageKey ? (
          <Image
            src={keytoUrl(imageKey)}
            alt={node.featuredImage?.alt || `Review from ${node.customer_name}`}
            fill
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 78vw, 400px"
            className="object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-[#C1105A] via-[#D6347E] to-[#7A0E43]"
            aria-hidden
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <div className="pointer-events-none absolute inset-0 z-[2] flex flex-col justify-end p-3 text-white sm:p-4">
          <TestimonialMeta node={node} />
        </div>
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
            <CarouselItem
              key={node.id}
              className={cn(homeCarouselItemClass, "h-full")}
            >
              <TestimonialCard
                node={node}
                variant={isVideo ? "video" : "text"}
              />
            </CarouselItem>
          );
        })}
      </HomeCarousel>
    </section>
  );
}

"use client";

import Image from "next/image";
import { Play, ShoppingBag } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DocumentType } from "@/gql";
import { ViewTransitionLink } from "@/components/ui/ViewTransitionLink";
import { TestimonialCardFragment } from "@/features/testimonials";
import {
  defaultPosterForEmbed,
  parseVideoEmbed,
} from "@/features/testimonials/lib/video";
import { HomeFeaturedProductFragment } from "./HomeFeaturedCarousel";
import { HomeSectionHeader } from "./HomeSectionHeader";
import {
  HomeScrollSnapStrip,
  ScrollSnapItem,
  scrollSnapReelItemClass,
} from "./HomeScrollSnapStrip";
import { MotionRevealItem, MotionSection } from "./MotionSection";
import { ProductPriceDisplay } from "@/features/products/components/ProductPriceDisplay";
import {
  productImageTransitionName,
  viewTransitionStyle,
} from "@/lib/view-transitions";
import { keytoUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";

type TestimonialNode = DocumentType<typeof TestimonialCardFragment>;
type ProductNode = DocumentType<typeof HomeFeaturedProductFragment>;

type ReelVideoItem = {
  kind: "video";
  id: string;
  title: string;
  subtitle?: string;
  videoUrl: string;
  posterUrl?: string | null;
  href?: string;
};

type ReelProductItem = {
  kind: "product";
  id: string;
  slug: string;
  title: string;
  product: ProductNode;
  imageUrl: string;
  imageAlt: string;
};

type ReelItem = ReelVideoItem | ReelProductItem;

type Props = {
  testimonials: { node: TestimonialNode }[];
  products: { node: ProductNode }[];
};

function reelEmbedSrc(embed: NonNullable<ReturnType<typeof parseVideoEmbed>>) {
  switch (embed.provider) {
    case "youtube":
      return `https://www.youtube-nocookie.com/embed/${embed.id}?autoplay=1&mute=1&loop=1&playlist=${embed.id}&playsinline=1&controls=0&modestbranding=1&rel=0`;
    case "vimeo":
      return `https://player.vimeo.com/video/${embed.id}?autoplay=1&muted=1&loop=1&background=1`;
    case "direct":
      return embed.src;
  }
}

function buildReelItems(
  testimonials: { node: TestimonialNode }[],
  products: { node: ProductNode }[],
): ReelItem[] {
  const videoReels: ReelVideoItem[] = testimonials
    .map(({ node }) => node)
    .filter((node) => node.kind === "video" && Boolean(node.video_url?.trim()))
    .map((node) => ({
      kind: "video" as const,
      id: node.id,
      title: node.customer_name,
      subtitle: node.location ?? "Customer review",
      videoUrl: node.video_url!.trim(),
      posterUrl: node.featuredImage?.key
        ? keytoUrl(node.featuredImage.key)
        : null,
    }));

  const productReels: ReelProductItem[] = products
    .map(({ node }) => node)
    .filter((node) => node.featuredImage?.key)
    .map((node) => ({
      kind: "product" as const,
      id: node.id,
      slug: node.slug,
      title: node.name,
      product: node,
      imageUrl: keytoUrl(node.featuredImage!.key),
      imageAlt: node.featuredImage?.alt || node.name,
    }));

  return [...videoReels, ...productReels].slice(0, 16);
}

function ReelVideoCard({ item }: { item: ReelVideoItem }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const embed = parseVideoEmbed(item.videoUrl);
  const poster =
    item.posterUrl ||
    (embed ? defaultPosterForEmbed(embed) : null) ||
    undefined;
  const externalPoster =
    !!poster &&
    (poster.includes("img.youtube.com") || poster.includes("vumbnail.com"));

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setActive(entry.isIntersecting && entry.intersectionRatio >= 0.55);
      },
      { threshold: [0, 0.55, 0.85] },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const onPlay = useCallback(() => setActive(true), []);

  const card = (
    <article
      ref={ref}
      className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl border border-[#C1105A]/20 bg-[#5A0A33] shadow-[0_16px_40px_-20px_rgba(193,16,90,0.65)]"
    >
      {embed?.provider === "direct" && active ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={embed.src}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
        />
      ) : embed && active && embed.provider !== "direct" ? (
        <iframe
          title={`Saree reel — ${item.title}`}
          src={reelEmbedSrc(embed)}
          className="absolute inset-0 h-full w-full border-0 scale-[1.02]"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={onPlay}
          className="group absolute inset-0 text-left"
          aria-label={`Play saree reel from ${item.title}`}
        >
          {poster ? (
            <Image
              src={poster}
              alt=""
              fill
              unoptimized={externalPoster}
              sizes="(max-width: 640px) 45vw, 220px"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              loading="lazy"
            />
          ) : (
            <div
              className="absolute inset-0 bg-gradient-to-br from-[#C1105A] via-[#D6347E] to-[#7A0E43]"
              aria-hidden
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/10" />
          <span className="absolute left-1/2 top-1/2 z-[1] flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/90 bg-[#C1105A]/90 text-white shadow-lg">
              <Play className="ml-0.5 h-5 w-5 fill-current" />
            </span>
          </span>
        </button>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/85 via-black/35 to-transparent p-3 pt-10">
        <p className="line-clamp-1 text-sm font-bold text-white">
          {item.title}
        </p>
        {item.subtitle ? (
          <p className="mt-0.5 line-clamp-1 text-[11px] text-white/80">
            {item.subtitle}
          </p>
        ) : null}
      </div>
    </article>
  );

  if (item.href) {
    return (
      <ViewTransitionLink href={item.href} className="block h-full">
        {card}
      </ViewTransitionLink>
    );
  }

  return card;
}

function ReelProductCard({ item }: { item: ReelProductItem }) {
  return (
    <ViewTransitionLink
      href={`/shop/${item.slug}`}
      className="group block h-full"
    >
      <article className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl border border-[#C1105A]/20 bg-muted shadow-[0_16px_40px_-20px_rgba(193,16,90,0.55)]">
        <Image
          src={item.imageUrl}
          alt={item.imageAlt}
          fill
          sizes="(max-width: 640px) 45vw, 220px"
          className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.05]"
          style={viewTransitionStyle(productImageTransitionName(item.id))}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 z-[2] p-3 pt-12">
          <p className="line-clamp-2 text-sm font-bold leading-snug text-white">
            {item.title}
          </p>
          <ProductPriceDisplay
            product={item.product}
            className="mt-1 text-white [&_span]:text-white [&_s]:text-white/70"
          />
          <span
            className={cn(
              "mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#C1105A] px-3 py-1.5 text-[11px] font-semibold text-white",
              "transition-transform duration-300 group-hover:scale-[1.03]",
            )}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Shop now
          </span>
        </div>
      </article>
    </ViewTransitionLink>
  );
}

export function HomeShoppableReels({ testimonials, products }: Props) {
  const items = buildReelItems(testimonials, products);
  if (!items.length) return null;

  return (
    <MotionSection className="w-full min-w-0 py-4 sm:py-8 md:py-10">
      <HomeSectionHeader
        title="Saree"
        titleAccent="Reels"
        href="/featured"
        viewMoreLabel="Shop featured"
      />
      <HomeScrollSnapStrip ariaLabel="Shoppable saree reels">
        {items.map((item, index) => (
          <ScrollSnapItem
            key={`${item.kind}-${item.id}`}
            className={scrollSnapReelItemClass}
          >
            <MotionRevealItem index={index} className="h-full">
              {item.kind === "video" ? (
                <ReelVideoCard item={item} />
              ) : (
                <ReelProductCard item={item} />
              )}
            </MotionRevealItem>
          </ScrollSnapItem>
        ))}
      </HomeScrollSnapStrip>
    </MotionSection>
  );
}

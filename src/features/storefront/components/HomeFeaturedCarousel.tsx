"use client";

import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { DocumentType } from "@/gql";
import {
  ProductCardFragment,
  ProductCardSkeleton,
} from "@/features/products";
import { AddToCartButton } from "@/features/carts";
import { AddToWishListButton } from "@/features/wishlists";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { keytoUrl } from "@/lib/utils";
import { HomeSectionHeader } from "./HomeSectionHeader";

type ProductNode = DocumentType<typeof ProductCardFragment>;

type Props = {
  products: { node: ProductNode }[];
};

function FeaturedSlide({ product }: { product: ProductNode }) {
  const { id, name, slug, featuredImage, badge, price } = product;

  return (
    <article className="rounded-2xl border bg-card overflow-hidden shadow-sm h-full">
      <div className="relative aspect-[4/5] sm:aspect-[3/4] w-full bg-muted">
        <Link href={`/shop/${slug}`} className="block absolute inset-0">
          <Image
            src={keytoUrl(featuredImage.key)}
            alt={featuredImage.alt || name}
            fill
            sizes="(max-width: 768px) 88vw, 480px"
            className="object-cover"
          />
        </Link>
        {badge ? (
          <Badge
            className="absolute top-3 left-1/2 -translate-x-1/2 z-10"
            variant={badge as "default"}
          >
            {badge}
          </Badge>
        ) : null}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 shadow-md">
          <Suspense
            fallback={
              <span className="h-8 w-8 rounded-full bg-muted inline-block" />
            }
          >
            <AddToWishListButton productId={id} />
          </Suspense>
          <Suspense
            fallback={
              <span className="h-8 w-8 rounded-full bg-muted inline-block" />
            }
          >
            <AddToCartButton productId={id} />
          </Suspense>
        </div>
      </div>
      <div className="p-4 md:p-5">
        <Link href={`/shop/${slug}`}>
          <h3 className="font-semibold text-base md:text-lg line-clamp-1 hover:underline">
            {name}
          </h3>
        </Link>
        <p className="mt-1 text-lg md:text-xl font-bold">₹{price}</p>
      </div>
    </article>
  );
}

export function HomeFeaturedCarousel({ products }: Props) {
  if (!products.length) return null;

  return (
    <section className="py-6 md:py-10">
      <HomeSectionHeader title="Featured" titleAccent="Products" href="/shop" />
      <Carousel
        opts={{ align: "start", loop: products.length > 1 }}
        plugins={[
          Autoplay({
            delay: 2000,
            stopOnInteraction: true,
            stopOnMouseEnter: true,
          }),
        ]}
        className="w-full"
      >
        <CarouselContent className="-ml-3 md:-ml-4">
          {products.map(({ node }) => (
            <CarouselItem
              key={node.id}
              className="pl-3 md:pl-4 basis-[88%] sm:basis-[75%] md:basis-[52%] lg:basis-[38%]"
            >
              <FeaturedSlide product={node} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
}

export function HomeFeaturedCarouselSkeleton() {
  return (
    <section className="py-6">
      <div className="h-8 w-48 bg-muted rounded mb-4 animate-pulse" />
      <ProductCardSkeleton />
    </section>
  );
}

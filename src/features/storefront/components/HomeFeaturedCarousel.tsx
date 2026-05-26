"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { DocumentType, gql } from "@/gql";
import { ProductCardSkeleton } from "@/features/products";
import { AddToCartButton } from "@/features/carts";
import { AddToWishListButton } from "@/features/wishlists";
import { CarouselItem } from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { keytoUrl } from "@/lib/utils";
import { HomeSectionHeader } from "./HomeSectionHeader";
import { HomeCarousel, homeFeaturedItemClass } from "./HomeCarousel";

export const HomeFeaturedProductFragment = gql(/* GraphQL */ `
  fragment HomeFeaturedProductFragment on products {
    id
    name
    slug
    badge
    price
    featuredImage: medias {
      id
      key
      alt
    }
  }
`);

type ProductNode = DocumentType<typeof HomeFeaturedProductFragment>;

type Props = {
  products: { node: ProductNode }[];
};

function FeaturedSlide({ product }: { product: ProductNode }) {
  const { id, name, slug, featuredImage, badge, price } = product;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="relative w-full aspect-[3/4] max-h-[min(70vh,420px)] sm:max-h-[480px] bg-muted">
        <Link href={`/shop/${slug}`} className="absolute inset-0">
          <Image
            src={keytoUrl(featuredImage?.key)}
            alt={featuredImage?.alt || name}
            fill
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 85vw, 480px"
            className="object-cover object-center"
            priority={false}
          />
        </Link>
        {badge ? (
          <Badge
            className="absolute top-3 left-3 z-10"
            variant={badge as "default"}
          >
            {badge}
          </Badge>
        ) : null}
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full border bg-white/95 px-3 py-1.5 shadow-md">
          <Suspense fallback={<span className="inline-block h-9 w-9" />}>
            <AddToWishListButton productId={id} />
          </Suspense>
          <Suspense fallback={<span className="inline-block h-9 w-9" />}>
            <AddToCartButton productId={id} />
          </Suspense>
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-center p-3 sm:p-4">
        <Link href={`/shop/${slug}`}>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug sm:text-base hover:underline">
            {name}
          </h3>
        </Link>
        <p className="mt-1 text-base font-bold sm:text-lg">₹{price}</p>
      </div>
    </article>
  );
}

export function HomeFeaturedCarousel({ products }: Props) {
  if (!products.length) return null;

  return (
    <section className="w-full min-w-0 py-4 sm:py-8 md:py-10">
      <HomeSectionHeader
        title="Featured"
        titleAccent="Products"
        href="/featured"
      />
      <HomeCarousel loop={products.length > 1}>
        {products.map(({ node }) => (
          <CarouselItem key={node.id} className={homeFeaturedItemClass}>
            <FeaturedSlide product={node} />
          </CarouselItem>
        ))}
      </HomeCarousel>
    </section>
  );
}

export function HomeFeaturedCarouselSkeleton() {
  return (
    <section className="py-6">
      <div className="mb-4 h-8 w-48 animate-pulse rounded bg-muted" />
      <ProductCardSkeleton />
    </section>
  );
}

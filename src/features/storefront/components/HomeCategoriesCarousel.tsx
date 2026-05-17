"use client";

import Image from "next/image";
import Link from "next/link";
import { DocumentType } from "@/gql";
import { CollectionCardFragment } from "@/features/collections";
import { CarouselItem } from "@/components/ui/carousel";
import { keytoUrl } from "@/lib/utils";
import { HomeSectionHeader } from "./HomeSectionHeader";
import {
  HomeCarousel,
  homeCarouselItemClass,
} from "./HomeCarousel";

type CollectionNode = DocumentType<typeof CollectionCardFragment>;

type Props = {
  collections: { node: CollectionNode }[];
};

export function HomeCategoriesCarousel({ collections }: Props) {
  if (!collections.length) return null;

  return (
    <section className="w-full min-w-0 py-4 sm:py-8 md:py-10">
      <HomeSectionHeader
        title="Product"
        titleAccent="Categories"
        href="/shop"
      />
      <HomeCarousel loop={collections.length > 1}>
        {collections.map(({ node }) => (
          <CarouselItem key={node.id} className={homeCarouselItemClass}>
            <Link
              href={`/collections/${node.slug}`}
              className="block h-full rounded-2xl overflow-hidden border bg-muted/40 shadow-sm active:scale-[0.99] transition-transform"
            >
              <div className="relative w-full aspect-[5/3] sm:aspect-[16/10]">
                <Image
                  src={keytoUrl(node.featuredImage.key)}
                  alt={node.featuredImage.alt || node.label}
                  fill
                  sizes="(max-width: 640px) 92vw, (max-width: 1024px) 78vw, 400px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5 text-white">
                  <p className="text-base sm:text-lg font-bold leading-tight">
                    {node.label}
                  </p>
                  <p className="text-xs sm:text-sm opacity-90 mt-0.5">
                    Explore collection
                  </p>
                </div>
              </div>
            </Link>
          </CarouselItem>
        ))}
      </HomeCarousel>
    </section>
  );
}

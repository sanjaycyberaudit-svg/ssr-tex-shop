"use client";

import Link from "next/link";
import { DocumentType } from "@/gql";
import { CollectionCardFragment } from "@/features/collections";
import { CollectionCardSurface } from "@/features/collections/components/CollectionCardSurface";
import { CarouselItem } from "@/components/ui/carousel";
import { keytoUrl } from "@/lib/utils";
import { HomeSectionHeader } from "./HomeSectionHeader";
import { HomeCarousel, homeCarouselItemClass } from "./HomeCarousel";

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
        href="/collections"
      />
      <HomeCarousel loop={collections.length > 1}>
        {collections.map(({ node }) => (
          <CarouselItem key={node.id} className={homeCarouselItemClass}>
            <Link
              href={`/collections/${node.slug}`}
              className="group block h-full overflow-hidden rounded-[1.25rem] border border-[#C1105A]/15 bg-muted/30 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#C1105A]/30 hover:shadow-[0_18px_40px_-18px_rgba(193,16,90,0.45)] active:scale-[0.99]"
            >
              <CollectionCardSurface
                label={node.label}
                imageSrc={keytoUrl(node.featuredImage.key)}
                imageAlt={node.featuredImage.alt || node.label}
                aspectClass="aspect-[5/3] sm:aspect-[16/10]"
                sizes="(max-width: 640px) 92vw, (max-width: 1024px) 78vw, 400px"
              />
            </Link>
          </CarouselItem>
        ))}
      </HomeCarousel>
    </section>
  );
}

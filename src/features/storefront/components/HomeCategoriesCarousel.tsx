"use client";

import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { DocumentType } from "@/gql";
import { CollectionCardFragment } from "@/features/collections";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { keytoUrl } from "@/lib/utils";
import { HomeSectionHeader } from "./HomeSectionHeader";

type CollectionNode = DocumentType<typeof CollectionCardFragment>;

type Props = {
  collections: { node: CollectionNode }[];
};

export function HomeCategoriesCarousel({ collections }: Props) {
  if (!collections.length) return null;

  return (
    <section className="py-6 md:py-10">
      <HomeSectionHeader title="Product" titleAccent="Categories" href="/shop" />
      <Carousel
        opts={{ align: "start", loop: collections.length > 1 }}
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
          {collections.map(({ node }) => (
            <CarouselItem
              key={node.id}
              className="pl-3 md:pl-4 basis-[82%] sm:basis-[68%] md:basis-[46%] lg:basis-[32%]"
            >
              <Link
                href={`/collections/${node.slug}`}
                className="block rounded-2xl overflow-hidden bg-muted/80 border shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-[16/10] w-full">
                  <Image
                    src={keytoUrl(node.featuredImage.key)}
                    alt={node.featuredImage.alt || node.label}
                    fill
                    sizes="(max-width: 768px) 85vw, 400px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5 text-white">
                    <p className="text-lg md:text-xl font-bold">{node.label}</p>
                    <p className="text-sm opacity-90">Explore collection</p>
                  </div>
                </div>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
}

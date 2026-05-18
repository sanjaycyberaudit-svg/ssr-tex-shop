import React from "react";
import Image from "next/image";
import Link from "next/link";
import { gql, DocumentType } from "@/gql";

import { Skeleton } from "@/components/ui/skeleton";
import { keytoUrl } from "@/lib/utils";

export const CollectionCardFragment = gql(/* GraphQL */ `
  fragment CollectionCardFragment on collections {
    id
    label
    slug
    featuredImage: medias {
      key
      alt
    }
  }
`);

function CollectionsCard({
  collection,
}: {
  collection: DocumentType<typeof CollectionCardFragment>;
}) {
  const { slug, label, featuredImage } = collection;

  return (
    <div className="relative w-full overflow-hidden rounded-xl">
      <figure className="shrink-0">
        <Link
          href={`/collections/${slug}`}
          className="relative block overflow-hidden rounded-xl"
        >
          <Image
            src={keytoUrl(featuredImage.key)}
            height={200}
            width={350}
            className="aspect-[16/9] w-full object-cover opacity-65 transition-all duration-500 hover:scale-[1.02] hover:opacity-80"
            alt={featuredImage.alt}
          />
          <figcaption className="absolute bottom-3 left-3 text-sm md:text-lg font-medium text-foreground">
            {label}
          </figcaption>
        </Link>
      </figure>
    </div>
  );
}

export default CollectionsCard;

export const CollectionsCardSkeleton = () => (
  <Skeleton className="relative h-[200px] w-full overflow-hidden rounded-xl" />
);

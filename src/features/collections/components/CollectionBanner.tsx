import { gql, DocumentType } from "@/gql";
import { keytoUrl } from "@/lib/utils";
import Image from "next/image";
import React from "react";

const CollectionBannerFragment = gql(/* GraphQL */ `
  fragment CollectionBannerFragment on collections {
    id
    label
    slug
    featuredImage: medias {
      id
      key
      alt
    }
  }
`);

function CollectionBanner({
  collectionBannerData,
}: {
  collectionBannerData: DocumentType<typeof CollectionBannerFragment>;
}) {
  const { label, featuredImage } = collectionBannerData;
  const imageKey = featuredImage?.key;
  const imageAlt = featuredImage?.alt || label;

  return (
    <div className="relative mx-auto mb-8 h-[220px] w-full overflow-hidden md:container md:h-[280px]">
      <Image
        src={keytoUrl(imageKey)}
        alt={imageAlt}
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-[#5A0A33]/90 via-[#5A0A33]/40 to-black/20"
        aria-hidden
      />
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
        <div className="border-l-[4px] border-[#C5A059] pl-3 sm:pl-4">
          <h1 className="font-[family-name:var(--font-hero-serif)] text-2xl font-semibold leading-tight text-white drop-shadow-md md:text-5xl">
            {label}
          </h1>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#E8D5A3] sm:text-sm">
            SRI SAI RAGHAVENDRA TEX collection
          </p>
        </div>
      </div>
    </div>
  );
}

export default CollectionBanner;

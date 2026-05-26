import Header from "@/components/layouts/Header";
import { Shell } from "@/components/layouts/Shell";
import { SearchProductsGridSkeleton } from "@/features/products";
import { FeaturedProductsScroll } from "@/features/search";
import { Suspense } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Featured Products | Sakthi Textile",
  description: "Handpicked featured sarees at Sakthi Textile",
};

export default function FeaturedProductsPage() {
  return (
    <Shell>
      <Header
        heading="Featured Products"
        description="Our handpicked sarees — premium styles for festivals and weddings"
      />

      <Suspense fallback={<SearchProductsGridSkeleton />}>
        <FeaturedProductsScroll />
      </Suspense>
    </Shell>
  );
}

import { Suspense } from "react";
import Header from "@/components/layouts/Header";
import { Shell } from "@/components/layouts/Shell";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AddProductToCartForm } from "@/features/carts";
import { ProductCommentsSection } from "@/features/comments";
import {
  BuyNowButton,
  LowStockNotice,
  ProductCard,
  ProductImageShowcase,
} from "@/features/products";
import { AddToWishListButton } from "@/features/wishlists";
import { STOREFRONT_REVALIDATE_SECONDS } from "@/lib/cache/constants";
import { getProductSizeConfig } from "@/lib/products/sizeConfig";
import { getProductDetailCached } from "@/lib/storefront/product-detail";
import { formatPrice } from "@/lib/utils";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = STOREFRONT_REVALIDATE_SECONDS;

type Props = {
  params: {
    slug: string;
  };
};
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getProductDetailCached(params.slug);
  const productName = data?.productsCollection?.edges?.[0]?.node?.name;
  if (productName) {
    return {
      title: `${productName} | Sakthi Textile`,
      description: `Buy ${productName} from Sakthi Textile.`,
    };
  }
  return {
    title: "Sakthi Textile | Silk & Cotton Sarees",
    description: "Authentic silk and cotton sarees — wholesale and retail",
  };
}

async function ProductDetailPage({ params }: Props) {
  const data = await getProductDetailCached(params.slug);

  const productEdge = data?.productsCollection?.edges?.[0];
  if (!productEdge?.node) return notFound();

  const {
    id,
    name,
    description,
    price,
    stock,
    commentsCollection,
    totalComments,
  } = productEdge.node;
  const sizeConfig = await getProductSizeConfig(id);
  const hasConfiguredSizes =
    sizeConfig.enabled &&
    sizeConfig.options.some((option) => Number(option.qty ?? 0) > 0);

  const storefrontSizeLabels = sizeConfig.options
    .filter((option) => Number(option.qty ?? 0) > 0)
    .map((option) => {
      const size = String(option.size ?? "")
        .trim()
        .toUpperCase();
      if (!size) return `${option.qty}`;
      if (/^[A-Z]+$/.test(size)) return `${size} : ${option.qty}`;
      return size;
    });

  return (
    <Shell>
      <div className="grid grid-cols-12 gap-x-8">
        <div className="space-y-8 relative col-span-12 md:col-span-7">
          <ProductImageShowcase data={productEdge.node} />
        </div>

        <div className="col-span-12 md:col-span-5">
          <section className="flex justify-between items-start max-w-lg">
            <div>
              <h1 className="text-4xl font-semibold tracking-wide mb-3">
                {name}
              </h1>
              <p className="text-2xl font-semibold mb-3">
                {formatPrice(price)}
              </p>
              <LowStockNotice
                stock={stock}
                className="text-sm font-medium text-destructive"
              />
              {hasConfiguredSizes ? (
                <p className="text-sm text-muted-foreground">
                  Available sizes: {storefrontSizeLabels.join(", ")}
                </p>
              ) : null}
            </div>
            <AddToWishListButton productId={id} />
          </section>

          <section className="flex mb-8 items-end space-x-5">
            <Suspense>
              <AddProductToCartForm
                productId={id}
                stock={stock}
                sizeConfig={sizeConfig}
              />
            </Suspense>

            {!hasConfiguredSizes ? (
              <BuyNowButton productId={id} stock={stock} />
            ) : null}
          </section>

          <section>
            <p>{description}</p>

            <Accordion type="single" collapsible>
              <AccordionItem value="item-1">
                <AccordionTrigger>Is it accessible?</AccordionTrigger>
                <AccordionContent>
                  Yes. It adheres to the WAI-ARIA design pattern.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Is it accessible?</AccordionTrigger>
                <AccordionContent>
                  Yes. It adheres to the WAI-ARIA design pattern.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Ship & Returns</AccordionTrigger>
                <AccordionContent>
                  Shipping across Tamil Nadu and India. Free delivery on
                  selected orders — contact us on WhatsApp for details. Returns
                  or exchanges may be accepted within 7 days for unused sarees
                  with tags; please call before returning.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>
        </div>
      </div>

      <Header heading={`We Think You'll Love`} />

      <div className="container grid grid-cols-2 lg:grid-cols-4 gap-x-8 ">
        {data.recommendations &&
          data.recommendations.edges.map(({ node }) => (
            <ProductCard key={node.id} product={node} />
          ))}
      </div>

      <ProductCommentsSection
        comments={
          commentsCollection
            ? commentsCollection.edges.map(({ node }) => node)
            : []
        }
        totalComments={totalComments}
      />
    </Shell>
  );
}

export default ProductDetailPage;

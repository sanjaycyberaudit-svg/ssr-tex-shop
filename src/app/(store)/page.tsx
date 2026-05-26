import { Shell } from "@/components/layouts/Shell";
import { Icons } from "@/components/layouts/icons";
import { CollectionCardFragment } from "@/features/collections";
import {
  HomeFeaturedProductFragment,
  HomeHeroCarousel,
  HomeCategoriesCarousel,
  HomeTestimonialsCarousel,
  HomeFeaturedCarousel,
} from "@/features/storefront/components";
import { TestimonialCardFragment } from "@/features/testimonials";
import { gql } from "@/gql";
import { heroSlides } from "@/config/heroSlides";
import { getHomeBannerSlides } from "@/lib/integrations/settings";
import { getClient } from "@/lib/urql";
import { siteConfig } from "@/config/site";

export const revalidate = 300;

const LandingRouteQuery = gql(/* GraphQL */ `
  query LandingRouteQuery {
    products: productsCollection(
      filter: { featured: { eq: true } }
      first: 12
      orderBy: [{ created_at: DescNullsLast }]
    ) {
      edges {
        node {
          id
          ...HomeFeaturedProductFragment
        }
      }
    }

    collectionScrollCards: collectionsCollection(
      first: 10
      orderBy: [{ order: DescNullsLast }]
    ) {
      edges {
        node {
          id
          ...CollectionCardFragment
        }
      }
    }

    homeTestimonials: testimonialsCollection(
      filter: { is_published: { eq: true } }
      first: 12
      orderBy: [{ order: DescNullsLast }, { created_at: DescNullsLast }]
    ) {
      edges {
        node {
          id
          ...TestimonialCardFragment
        }
      }
    }
  }
`);

export default async function Home() {
  const [homeBannerSlides, landingResponse] = await Promise.all([
    getHomeBannerSlides(),
    getClient().query(LandingRouteQuery, {}),
  ]);
  const { data, error } = landingResponse;

  if (data === null && error) {
    console.error("LandingRouteQuery failed:", error.message);
  }

  const products = data?.products;
  const collectionScrollCards = data?.collectionScrollCards;
  const homeTestimonials = data?.homeTestimonials;
  const slides = homeBannerSlides?.length ? homeBannerSlides : heroSlides;

  return (
    <main className="min-h-screen w-full min-w-0 overflow-x-hidden">
      <HomeHeroCarousel slides={slides} />

      <Shell>
        {error ? (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-6 my-6 text-sm">
            <p className="font-semibold mb-2">Store data not loaded</p>
            <p className="text-muted-foreground mb-2">
              Enable GraphQL in Supabase: SQL Editor → run{" "}
              <code className="bg-white px-1">
                supabase/02-enable-graphql.sql
              </code>
            </p>
          </div>
        ) : null}

        {collectionScrollCards?.edges?.length ? (
          <HomeCategoriesCarousel collections={collectionScrollCards.edges} />
        ) : null}

        {homeTestimonials?.edges?.length ? (
          <HomeTestimonialsCarousel testimonials={homeTestimonials.edges} />
        ) : null}

        {products?.edges?.length ? (
          <HomeFeaturedCarousel products={products.edges} />
        ) : null}

        <TrustFeatures />
      </Shell>
    </main>
  );
}

function TrustFeatures() {
  const features = [
    {
      Icon: Icons.package,
      title: "Affordable Shipping",
      description: "Low delivery charges for orders across India.",
    },
    {
      Icon: Icons.cart,
      title: "Contact Support",
      description: `Call ${siteConfig.phone} or email us anytime.`,
    },
    {
      Icon: Icons.tag,
      title: "Easy Replacement",
      description: "Simple returns on eligible items.",
    },
    {
      Icon: Icons.award,
      title: "Secure Checkout",
      description: "Safe, trusted payment flow.",
    },
  ];

  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10 py-10 md:py-16 border-t">
      {features.map(({ Icon, title, description }, index) => (
        <div className="text-center px-2" key={`trust_${index}`}>
          <div className="flex justify-center mb-3">
            <Icon className="h-9 w-9 text-primary/80" />
          </div>
          <h4 className="text-sm md:text-base font-semibold mb-1">{title}</h4>
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      ))}
    </section>
  );
}

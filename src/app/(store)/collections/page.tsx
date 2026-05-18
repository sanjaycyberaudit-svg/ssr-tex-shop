import Header from "@/components/layouts/Header";
import { Shell } from "@/components/layouts/Shell";
import { CollectionCardFragment } from "@/features/collections";
import CollectionsCard from "@/features/collections/components/CollectionsCard";
import { gql } from "@/gql";
import { getClient } from "@/lib/urql";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "All Categories | Sakthi Textiles",
  description: "Browse all saree collections at Sakthi Textiles",
};

const AllCollectionsQuery = gql(/* GraphQL */ `
  query AllCollectionsQuery {
    collectionsCollection(
      first: 50
      orderBy: [{ order: DescNullsLast }, { label: AscNullsLast }]
    ) {
      edges {
        node {
          id
          ...CollectionCardFragment
        }
      }
    }
  }
`);

export default async function AllCollectionsPage() {
  const { data } = await getClient().query(AllCollectionsQuery, {});

  const collections = data?.collectionsCollection?.edges ?? [];

  return (
    <Shell>
      <Header
        heading="Product Categories"
        description="Browse sarees by collection — Kanjivaram, silk, cotton & more"
      />

      {collections.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No collections yet. Check back soon.
        </p>
      ) : (
        <section className="grid grid-cols-2 gap-4 py-6 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {collections.map(({ node }) => (
            <CollectionsCard key={node.id} collection={node} />
          ))}
        </section>
      )}
    </Shell>
  );
}

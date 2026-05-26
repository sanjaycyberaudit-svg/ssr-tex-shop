import AdminShell from "@/components/admin/AdminShell";
import { buttonVariants } from "@/components/ui/button";
import { gql } from "@/gql";
import { getClient } from "@/lib/urql";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  TestimonialsColumns,
  TestimonialColumnsFragment,
} from "@/features/testimonials";
import { DataTable } from "@/features/cms";

export const dynamic = "force-dynamic";

const AdminTestimonialsPageQuery = gql(/* GraphQL */ `
  query AdminTestimonialsPageQuery {
    testimonialsCollection(
      orderBy: [{ order: DescNullsLast }, { created_at: DescNullsLast }]
    ) {
      edges {
        node {
          __typename
          id
          ...TestimonialColumnsFragment
        }
      }
    }
  }
`);

async function TestimonialsAdminPage() {
  const { data } = await getClient().query(AdminTestimonialsPageQuery, {});

  if (!data) return notFound();

  return (
    <AdminShell
      heading="Testimonials"
      description="Manage customer feedback shown on the homepage carousel."
    >
      <section className="flex w-full items-center justify-end pb-5">
        <Link href="/admin/testimonials/new" className={cn(buttonVariants())}>
          New testimonial
        </Link>
      </section>

      <DataTable
        columns={TestimonialsColumns}
        data={data.testimonialsCollection?.edges || []}
      />
    </AdminShell>
  );
}

export default TestimonialsAdminPage;

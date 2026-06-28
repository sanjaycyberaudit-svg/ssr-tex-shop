import InfoPage from "@/components/layouts/InfoPage";
import { siteConfig } from "@/config/site";
import Link from "next/link";
import { Metadata } from "next";
import { STOREFRONT_STATIC_REVALIDATE_SECONDS } from "@/lib/cache/constants";

export const revalidate = STOREFRONT_STATIC_REVALIDATE_SECONDS;

export const metadata: Metadata = {
  title: "Store Policy | SRI SAI RAGHAVENDRA TEX",
  description: "Terms of use and store policies at SRI SAI RAGHAVENDRA TEX",
};

export default function StorePolicyPage() {
  return (
    <InfoPage
      heading="Store Policy"
      description="Terms that apply when you shop with SRI SAI RAGHAVENDRA TEX online or at our Salem store."
    >
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Orders</h2>
        <p>
          All prices are listed in Indian Rupees (INR). We reserve the right to
          cancel orders in case of pricing errors, stock unavailability, or
          suspected fraud. You will be notified and refunded if payment was
          already collected.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">
          Product images
        </h2>
        <p>
          Saree colours may vary slightly from photos due to screen settings and
          lighting. We photograph our stock carefully; contact us if you need
          more pictures before buying.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Privacy</h2>
        <p>
          We use your name, phone, email, and address only to process orders and
          communicate with you. We do not sell your personal information to
          third parties.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Wholesale</h2>
        <p>
          Retail and wholesale enquiries are welcome. Reach us at{" "}
          <Link
            href={`mailto:${siteConfig.email}`}
            className="text-primary hover:underline"
          >
            {siteConfig.email}
          </Link>{" "}
          or visit our store in Salem.
        </p>
      </section>
    </InfoPage>
  );
}

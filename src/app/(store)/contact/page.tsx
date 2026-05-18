import InfoPage from "@/components/layouts/InfoPage";
import { siteConfig } from "@/config/site";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | Sakthi Textiles",
  description: "Contact Sakthi Textiles — phone, email, WhatsApp, and store address",
};

export default function ContactPage() {
  return (
    <InfoPage
      heading="Contact Us"
      description="Reach Sakthi Textiles by phone, WhatsApp, email, or visit our store in Salem."
    >
      <section id="store" className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Visit our store</h2>
        <address className="not-italic">
          {siteConfig.addressLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </address>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Phone & email</h2>
        <p>
          <Link href={siteConfig.phoneHref} className="text-primary hover:underline">
            {siteConfig.phone}
          </Link>
        </p>
        <p>
          <Link
            href={`mailto:${siteConfig.email}`}
            className="text-primary hover:underline"
          >
            {siteConfig.email}
          </Link>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">WhatsApp</h2>
        <p>
          Fastest way to ask about stock, wedding orders, or delivery —{" "}
          <Link
            href={siteConfig.social.whatsapp}
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Chat on WhatsApp
          </Link>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Follow us</h2>
        <ul className="space-y-1">
          <li>
            <Link
              href={siteConfig.social.instagram}
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram
            </Link>
          </li>
          <li>
            <Link
              href={siteConfig.social.facebook}
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Facebook
            </Link>
          </li>
          <li>
            <Link
              href={siteConfig.social.youtube}
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              YouTube
            </Link>
          </li>
        </ul>
      </section>
    </InfoPage>
  );
}

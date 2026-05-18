import Link from "next/link";
import Branding from "./Branding";
import { siteConfig } from "@/config/site";
import SocialMedias from "./SocialMedias";

function FooterLinkColumn({
  title,
  items,
}: {
  title: string;
  items: { title: string; href?: string }[];
}) {
  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-foreground">{title}</p>
      <ul className="flex flex-col gap-y-2">
        {items.map((item) => {
          const href = item.href || "#";
          const isExternal =
            href.startsWith("http") ||
            href.startsWith("mailto:") ||
            href.startsWith("tel:");

          return (
            <li key={item.title}>
              <Link
                href={href}
                className="text-sm text-muted-foreground hover:text-primary hover:underline"
                {...(isExternal
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {item.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function MainFooter() {
  const { footerNav } = siteConfig;

  return (
    <footer className="mt-[80px] border-t border-[#00542E]/20 bg-muted/30 md:mt-[120px]">
      <div className="container pb-8 pt-8 md:pb-10 md:pt-10">
        <div className="mb-10 grid grid-cols-2 gap-8 sm:grid-cols-2 md:grid-cols-4 md:gap-6 lg:max-w-4xl">
          {footerNav.map((column) => (
            <FooterLinkColumn
              key={column.title}
              title={column.title ?? ""}
              items={column.items ?? []}
            />
          ))}
        </div>

        <div className="flex flex-col items-start justify-between gap-6 border-t border-[#00542E]/15 pt-8 md:flex-row md:items-center">
          <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:gap-6">
            <Branding className="text-2xl md:text-3xl" />
            <div className="text-xs font-light text-muted-foreground md:text-[11px]">
              <address className="not-italic leading-relaxed">
                {siteConfig.addressLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </address>
              <p className="mt-2">
                <Link
                  className="hover:text-primary hover:underline"
                  href={siteConfig.phoneHref}
                >
                  {siteConfig.phone}
                </Link>
                {" · "}
                <Link
                  className="hover:text-primary hover:underline"
                  href={`mailto:${siteConfig.email}`}
                >
                  {siteConfig.email}
                </Link>
              </p>
              <p className="mt-2 text-[10px] text-muted-foreground/80">
                © {new Date().getFullYear()} {siteConfig.name}. All rights
                reserved.
              </p>
            </div>
          </div>

          <SocialMedias containerClassName="md:mr-2" />
        </div>
      </div>
    </footer>
  );
}

export default MainFooter;

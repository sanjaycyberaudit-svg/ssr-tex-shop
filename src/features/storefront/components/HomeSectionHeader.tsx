import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  titleAccent?: string;
  href?: string;
  viewMoreLabel?: string;
  showViewMore?: boolean;
};

export function HomeSectionHeader({
  title,
  titleAccent,
  href = "/shop",
  viewMoreLabel = "View More",
  showViewMore = true,
}: Props) {
  return (
    <header className="mb-3 flex min-w-0 flex-col gap-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3 md:mb-5">
      <h2 className="min-w-0 text-lg font-bold leading-tight tracking-tight sm:text-xl md:text-2xl">
        {title}
        {titleAccent ? (
          <span className="text-primary"> {titleAccent}</span>
        ) : null}
      </h2>
      {showViewMore ? (
        <Link
          href={href}
          className={cn(
            "inline-flex w-fit shrink-0 items-center justify-center rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground sm:text-sm",
            "hover:opacity-90 transition-opacity",
          )}
        >
          {viewMoreLabel}
        </Link>
      ) : null}
    </header>
  );
}

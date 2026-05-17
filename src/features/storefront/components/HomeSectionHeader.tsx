import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  titleAccent?: string;
  href?: string;
  viewMoreLabel?: string;
};

export function HomeSectionHeader({
  title,
  titleAccent,
  href = "/shop",
  viewMoreLabel = "View More",
}: Props) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4 md:mb-5 px-1">
      <h2 className="text-xl md:text-2xl font-bold tracking-tight">
        {title}
        {titleAccent ? (
          <span className="text-primary"> {titleAccent}</span>
        ) : null}
      </h2>
      <Link
        href={href}
        className={cn(
          "shrink-0 rounded-full bg-primary px-4 py-2 text-xs md:text-sm font-medium text-primary-foreground",
          "hover:opacity-90 transition-opacity",
        )}
      >
        {viewMoreLabel}
      </Link>
    </div>
  );
}

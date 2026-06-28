import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
    <header className="mb-4 flex min-w-0 flex-col gap-2 sm:mb-5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 md:mb-6">
      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
        <span
          aria-hidden
          className="h-6 w-1.5 shrink-0 rounded-full bg-gradient-to-b from-[#C1105A] to-[#7A0E43] sm:h-7"
        />
        <h2 className="min-w-0 text-lg font-bold leading-tight tracking-tight sm:text-xl md:text-2xl">
          {title}
          {titleAccent ? (
            <span className="bg-gradient-to-r from-[#C1105A] to-[#D6347E] bg-clip-text text-transparent">
              {" "}
              {titleAccent}
            </span>
          ) : null}
        </h2>
      </div>
      {showViewMore ? (
        <Link
          href={href}
          className={cn(
            "group inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-[#C1105A]/30 bg-[#C1105A]/5 px-4 py-2 text-xs font-semibold text-[#C1105A] sm:text-sm",
            "transition-colors hover:bg-[#C1105A] hover:text-white",
          )}
        >
          {viewMoreLabel}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : null}
    </header>
  );
}

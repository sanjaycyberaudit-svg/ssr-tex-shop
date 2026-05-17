import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";

type Props = { className?: string };

function Branding({ className }: Props) {
  return (
    <Link
      href="/"
      className={cn(
        "text-base sm:text-xl md:text-2xl font-semibold align-middle",
        className,
      )}
    >
      Sakthi Textiles
    </Link>
  );
}

export default Branding;

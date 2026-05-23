import Link from "next/link";
import { SakthiWordmark } from "@/components/layouts/SakthiWordmark";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  showEmblem?: boolean;
  size?: "sm" | "md" | "lg" | "nav";
};

export function BrandLogo({
  className,
  showEmblem = false,
  size = "nav",
}: Props) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex w-fit max-w-full shrink-0 items-center justify-center",
        className,
      )}
    >
      <SakthiWordmark size={size} showEmblem={showEmblem} />
    </Link>
  );
}

export default BrandLogo;

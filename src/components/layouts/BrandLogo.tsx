import Link from "next/link";
import { SakthiWordmark } from "@/components/layouts/SakthiWordmark";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  size?: "sm" | "md" | "lg" | "nav" | "sidebar" | "footer";
};

export function BrandLogo({ className, size = "nav" }: Props) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex w-fit shrink-0 items-center justify-start overflow-visible",
        className,
      )}
    >
      <SakthiWordmark size={size} />
    </Link>
  );
}

export default BrandLogo;

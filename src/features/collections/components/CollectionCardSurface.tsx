import Image from "next/image";
import { cn } from "@/lib/utils";

type CollectionCardSurfaceProps = {
  label: string;
  imageSrc: string;
  imageAlt: string;
  className?: string;
  /** Taller cards on mobile grid; wider on desktop */
  aspectClass?: string;
  sizes?: string;
  priority?: boolean;
};

/**
 * Shared category card image + label (homepage carousel & /collections grid).
 */
export function CollectionCardSurface({
  label,
  imageSrc,
  imageAlt,
  className,
  aspectClass = "aspect-[4/5] sm:aspect-[5/4] lg:aspect-[16/10]",
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px",
  priority = false,
}: CollectionCardSurfaceProps) {
  return (
    <div
      className={cn("relative w-full overflow-hidden", aspectClass, className)}
    >
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        priority={priority}
        loading={priority ? undefined : "lazy"}
        sizes={sizes}
        className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-[#002818]/95 via-[#002818]/45 to-transparent"
        aria-hidden
      />
      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
        <div className="border-l-[3px] border-[#C5A059] pl-2.5 sm:pl-3">
          <p className="font-[family-name:var(--font-hero-serif)] text-sm font-semibold leading-snug text-white drop-shadow-md sm:text-base lg:text-lg">
            {label}
          </p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#E8D5A3] sm:text-[11px]">
            View collection
          </p>
        </div>
      </div>
    </div>
  );
}

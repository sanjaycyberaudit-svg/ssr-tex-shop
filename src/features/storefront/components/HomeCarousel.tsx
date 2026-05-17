"use client";

import Autoplay from "embla-carousel-autoplay";
import { ReactNode } from "react";
import { Carousel, CarouselContent } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  loop?: boolean;
  className?: string;
  delayMs?: number;
};

/** Shared home carousel: one primary slide on mobile, peek on larger screens. */
export function HomeCarousel({
  children,
  loop = true,
  className,
  delayMs = 2000,
}: Props) {
  return (
    <div className={cn("w-full min-w-0 overflow-hidden", className)}>
      <Carousel
        opts={{ align: "start", loop, containScroll: "trimSnaps" }}
        plugins={[
          Autoplay({
            delay: delayMs,
            stopOnInteraction: false,
            stopOnMouseEnter: true,
          }),
        ]}
        className="w-full max-w-full"
      >
        <CarouselContent className="-ml-3 sm:-ml-4">{children}</CarouselContent>
      </Carousel>
    </div>
  );
}

export const homeCarouselItemClass =
  "pl-3 sm:pl-4 min-w-0 shrink-0 grow-0 basis-[92%] sm:basis-[78%] md:basis-[48%] lg:basis-[36%]";

export const homeFeaturedItemClass =
  "pl-3 sm:pl-4 min-w-0 shrink-0 grow-0 basis-[92%] sm:basis-[85%] md:basis-[55%] lg:basis-[42%]";

"use client";

import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ReactNode } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  loop?: boolean;
  className?: string;
  delayMs?: number;
  /** Show left/right arrow controls */
  showArrows?: boolean;
};

const arrowClass =
  "absolute top-1/2 z-10 h-10 w-10 -translate-y-1/2 rounded-full border-2 border-[#00542E]/20 bg-white/95 text-[#00542E] shadow-md transition-all duration-300 ease-out hover:bg-white hover:border-[#00542E]/50 disabled:pointer-events-none disabled:!opacity-0 sm:h-11 sm:w-11";

const arrowRevealClass =
  "pointer-events-none scale-90 opacity-0 group-hover/carousel:pointer-events-auto group-hover/carousel:scale-100 group-hover/carousel:opacity-100 group-focus-within/carousel:pointer-events-auto group-focus-within/carousel:scale-100 group-focus-within/carousel:opacity-100 focus-visible:pointer-events-auto focus-visible:scale-100 focus-visible:opacity-100";

/** Shared home carousel: autoplay; arrows fade in on hover or focus. */
export function HomeCarousel({
  children,
  loop = true,
  className,
  delayMs = 2000,
  showArrows = true,
}: Props) {
  return (
    <div className={cn("group/carousel w-full min-w-0", className)}>
      <div className="relative w-full overflow-hidden rounded-2xl">
        <Carousel
          opts={{ align: "start", loop, containScroll: "trimSnaps" }}
          plugins={[
            Autoplay({
              delay: delayMs,
              stopOnInteraction: true,
              stopOnMouseEnter: true,
            }),
          ]}
          className="w-full max-w-full"
        >
          <CarouselContent className="-ml-3 sm:-ml-4">
            {children}
          </CarouselContent>
          {showArrows ? (
            <>
              <CarouselPrevious
                className={cn(arrowClass, arrowRevealClass, "left-1 sm:left-2")}
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-6 w-6" strokeWidth={2.5} />
              </CarouselPrevious>
              <CarouselNext
                className={cn(arrowClass, arrowRevealClass, "right-1 sm:right-2")}
                aria-label="Next slide"
              >
                <ChevronRight className="h-6 w-6" strokeWidth={2.5} />
              </CarouselNext>
            </>
          ) : null}
        </Carousel>
      </div>
    </div>
  );
}

export const homeCarouselItemClass =
  "pl-3 sm:pl-4 min-w-0 shrink-0 grow-0 basis-[92%] sm:basis-[78%] md:basis-[48%] lg:basis-[36%]";

export const homeFeaturedItemClass =
  "pl-3 sm:pl-4 min-w-0 shrink-0 grow-0 basis-[92%] sm:basis-[85%] md:basis-[55%] lg:basis-[42%]";

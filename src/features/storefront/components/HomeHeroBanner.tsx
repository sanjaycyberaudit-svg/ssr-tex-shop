import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HomeHeroBanner() {
  return (
    <section className="w-full bg-background">
      <div className="container px-3 sm:px-4 pt-3 pb-2 md:pt-6 md:pb-4">
        <Link
          href="/shop"
          className="relative block w-full overflow-hidden rounded-2xl md:rounded-3xl shadow-md aspect-[16/9] sm:aspect-[2/1] md:aspect-[21/9] max-h-[420px] md:max-h-[520px]"
        >
          <Image
            src="/images/hero-banner.png"
            alt="Sakthi Textiles — premium silk saree collection"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 1200px"
            className="object-cover object-center"
          />
        </Link>
        <div className="mt-4 hidden md:flex justify-center">
          <Link
            href="/shop"
            className={cn(buttonVariants({ size: "lg" }), "rounded-full px-10")}
          >
            Shop sarees
          </Link>
        </div>
      </div>
    </section>
  );
}

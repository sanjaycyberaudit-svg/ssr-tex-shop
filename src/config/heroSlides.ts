import { heroBannerImage } from "@/lib/supabase/seedData/collectionPlaceholders";

export type HeroSlide = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  cta: string;
  image: string;
  imageAlt: string;
};

/** Homepage hero carousel — Tamil Nadu saree model placeholders until Admin → Home Banner uploads. */
export const heroSlides: HeroSlide[] = [
  {
    id: "festive-silk",
    title: "Festive Silk",
    subtitle:
      "Kanjivaram, soft silk, and wedding weaves — curated for every celebration",
    href: "/collections",
    cta: "Shop now",
    image: heroBannerImage("festiveSilk"),
    imageAlt:
      "Model in festive silk saree — SRI SAI RAGHAVENDRA TEX, Salem Tamil Nadu",
  },
  {
    id: "summer-weaves",
    title: "Summer Weaves",
    subtitle:
      "Light cotton, silk cotton, and soft silks for comfort and elegance",
    href: "/collections",
    cta: "Shop now",
    image: heroBannerImage("summerWeaves"),
    imageAlt:
      "Woman in traditional cotton saree — SRI SAI RAGHAVENDRA TEX, Tamil Nadu",
  },
  {
    id: "wedding-edit",
    title: "Wedding Edit",
    subtitle: "Traditional silks and bridal weaves for your special day",
    href: "/featured",
    cta: "Shop now",
    image: heroBannerImage("weddingEdit"),
    imageAlt:
      "Bridal silk saree collection — SRI SAI RAGHAVENDRA TEX, Salem",
  },
  {
    id: "daily-elegance",
    title: "Daily Elegance",
    subtitle: "Premium quality sarees — wholesale and retail from Salem",
    href: "/shop",
    cta: "Shop now",
    image: heroBannerImage("dailyElegance"),
    imageAlt:
      "Daily wear saree model — SRI SAI RAGHAVENDRA TEX, Tamil Nadu",
  },
];

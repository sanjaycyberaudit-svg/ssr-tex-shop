export type HeroSlide = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  cta: string;
  image: string;
  imageAlt: string;
};

/** Homepage hero carousel — defaults until banners are set in Admin → Settings → Home Banner */
export const heroSlides: HeroSlide[] = [
  {
    id: "festive-silk",
    title: "Festive Silk",
    subtitle:
      "Kanjivaram, soft silk, and wedding weaves — curated for every celebration",
    href: "/collections",
    cta: "Shop now",
    image: "https://placehold.co/1400x900/C1105A/FFFFFF/png?text=Festive+Silk+Sarees",
    imageAlt: "Festive silk saree collection — SRI SAI RAGHAVENDRA TEX",
  },
  {
    id: "summer-weaves",
    title: "Summer Weaves",
    subtitle:
      "Light cotton, silk cotton, and soft silks for comfort and elegance",
    href: "/collections",
    cta: "Shop now",
    image: "https://placehold.co/1400x900/9A0E48/FFFFFF/png?text=Cotton+%26+Soft+Silk",
    imageAlt: "Cotton and soft silk sarees — SRI SAI RAGHAVENDRA TEX",
  },
  {
    id: "wedding-edit",
    title: "Wedding Edit",
    subtitle:
      "Traditional silks and bridal weaves for your special day",
    href: "/featured",
    cta: "Shop now",
    image: "https://placehold.co/1400x900/7A0E43/FFFFFF/png?text=Wedding+Collection",
    imageAlt: "Wedding silk saree collection — SRI SAI RAGHAVENDRA TEX",
  },
  {
    id: "daily-elegance",
    title: "Daily Elegance",
    subtitle: "Premium quality sarees — wholesale and retail from Salem",
    href: "/shop",
    cta: "Shop now",
    image: "https://placehold.co/1400x900/D6347E/FFFFFF/png?text=Daily+Wear+Sarees",
    imageAlt: "Daily wear sarees — SRI SAI RAGHAVENDRA TEX",
  },
];

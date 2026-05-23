export type HeroSlide = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  cta: string;
  image: string;
  imageAlt: string;
};

/** Homepage hero carousel — Sakthi saree photography from Supabase Storage */
export const heroSlides: HeroSlide[] = [
  {
    id: "festive-silk",
    title: "Festive Silk",
    subtitle:
      "Kanjivaram, soft silk, and wedding weaves — curated for every celebration",
    href: "/collections/kanjivaram-wedding-sarees",
    cta: "Shop now",
    image:
      "https://qhtwwyqlsnckorndmhmt.supabase.co/storage/v1/object/public/media/sakthi/saree-R-tapgdDCDppiSQlGdkRl.webp",
    imageAlt: "Model in Kanjivaram silk saree",
  },
  {
    id: "summer-weaves",
    title: "Summer Weaves",
    subtitle:
      "Light cotton, silk cotton, and soft silks for comfort and elegance",
    href: "/collections/cotton-sarees",
    cta: "Shop now",
    image:
      "https://qhtwwyqlsnckorndmhmt.supabase.co/storage/v1/object/public/media/sakthi/saree-pdIkXPnfznIDPsDJ4k4PE.webp",
    imageAlt: "Model in cotton saree",
  },
  {
    id: "wedding-edit",
    title: "Wedding Edit",
    subtitle:
      "Traditional silks, Kubera pattu, and celebrity-inspired bridal looks",
    href: "/collections/wedding-collections",
    cta: "Shop now",
    image:
      "https://qhtwwyqlsnckorndmhmt.supabase.co/storage/v1/object/public/media/sakthi/saree-U0Rtn9BZSywuxw19vrXla.webp",
    imageAlt: "Model in wedding silk saree",
  },
  {
    id: "daily-elegance",
    title: "Daily Elegance",
    subtitle: "Softie sarees and fancy silks — premium quality, trusted weave",
    href: "/shop",
    cta: "Shop now",
    image:
      "https://qhtwwyqlsnckorndmhmt.supabase.co/storage/v1/object/public/media/sakthi/saree-N2Osq4mnOsiSNYN62fSbu.webp",
    imageAlt: "Model in soft silk saree",
  },
];

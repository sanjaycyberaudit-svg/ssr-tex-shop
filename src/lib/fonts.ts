import { Montserrat, Playfair_Display } from "next/font/google";

/** Brand wordmark — bold caps sans-serif */
export const brandSans = Montserrat({
  weight: ["700", "800"],
  subsets: ["latin"],
  variable: "--font-brand-sans",
  display: "swap",
});

/** Hero banner titles */
export const heroSerif = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-hero-serif",
  display: "swap",
});

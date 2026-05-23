import { Marck_Script, Playfair_Display } from "next/font/google";

/** Cursive wordmark — Nalli-style slanted script */
export const sakthiScript = Marck_Script({
  weight: "400",
  subsets: ["latin", "cyrillic"],
  variable: "--font-sakthi-script",
  display: "swap",
});

/** Hero banner titles */
export const heroSerif = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-hero-serif",
  display: "swap",
});

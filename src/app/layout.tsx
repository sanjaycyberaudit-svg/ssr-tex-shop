import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { brandSans, heroSerif } from "@/lib/fonts";
import CustomProvider from "../providers/CustomProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sakthi Textile | Silk & Cotton Sarees",
  description: "Authentic silk and cotton sarees — wholesale and retail",
  icons: {
    icon: [{ url: "/images/sakthi-st-emblem.svg", type: "image/svg+xml" }],
    shortcut: ["/images/sakthi-st-emblem.svg"],
    apple: [{ url: "/images/sakthi-st-emblem.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <CustomProvider>
        <body
          className={`${inter.className} ${brandSans.variable} ${heroSerif.variable}`}
        >
          {children}
          <Toaster />
        </body>
      </CustomProvider>
    </html>
  );
}

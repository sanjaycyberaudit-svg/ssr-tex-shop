import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import CustomProvider from "../providers/CustomProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sakthi Textile | Silk & Cotton Sarees",
  description: "Authentic silk and cotton sarees — wholesale and retail",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <CustomProvider>
        <body className={inter.className}>
          {children}
          <Toaster />
        </body>
      </CustomProvider>
    </html>
  );
}

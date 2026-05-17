import { CartSheet } from "@/features/carts";
import MainFooter from "@/components/layouts/MainFooter";
import Navbar from "@/components/layouts/MainNavbar";
import { MobileBottomNav } from "@/components/layouts/MobileBottomNav";
import { ReactNode } from "react";

type Props = { children: ReactNode };

async function StoreLayout({ children }: Props) {
  return (
    <>
      <Navbar />
      <main className="pt-[50px] pb-20 md:pb-0">{children}</main>
      <CartSheet />
      <MobileBottomNav />
      <MainFooter />
    </>
  );
}

export default StoreLayout;

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
      <main className="w-full max-w-[100vw] overflow-x-hidden pt-[3.75rem] md:pt-[50px] pb-[var(--mobile-nav-height)] md:pb-0">
        {children}
      </main>
      <CartSheet />
      <MobileBottomNav />
      <div className="md:contents pb-[var(--mobile-nav-height)] md:pb-0">
        <MainFooter />
      </div>
    </>
  );
}

export default StoreLayout;

import { CartSheet } from "@/features/carts";
import MainFooter from "@/components/layouts/MainFooter";
import { MobileMenuProvider } from "@/components/layouts/MobileMenuContext";
import Navbar from "@/components/layouts/MainNavbar";
import { StoreFloatingActions } from "@/components/layouts/StoreFloatingActions";
import { MobileBottomNav } from "@/components/layouts/MobileBottomNav";
import { ReactNode } from "react";

type Props = { children: ReactNode };

async function StoreLayout({ children }: Props) {
  return (
    <MobileMenuProvider>
      <Navbar />
      <main className="w-full max-w-[100vw] overflow-x-hidden pt-[var(--store-header-offset-mobile)] md:pt-[var(--store-header-offset-desktop)] pb-[var(--mobile-nav-height)] md:pb-0">
        {children}
      </main>
      <CartSheet />
      <StoreFloatingActions />
      <MobileBottomNav />
      <div className="md:contents pb-[var(--mobile-nav-height)] md:pb-0">
        <MainFooter />
      </div>
    </MobileMenuProvider>
  );
}

export default StoreLayout;

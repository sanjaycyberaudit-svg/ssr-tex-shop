import { CartSheet } from "@/features/carts";
import MainFooter from "@/components/layouts/MainFooter";
import { MobileMenuProvider } from "@/components/layouts/MobileMenuContext";
import Navbar from "@/components/layouts/MainNavbar";
import { StoreFloatingActions } from "@/components/layouts/StoreFloatingActions";
import { MobileBottomNav } from "@/components/layouts/MobileBottomNav";
import { resolveStorefrontSocial } from "@/lib/integrations/settings";
import { SocialLinksProvider } from "@/providers/SocialLinksProvider";
import { ReactNode } from "react";

type Props = { children: ReactNode };

export const revalidate = 60;

async function StoreLayout({ children }: Props) {
  const social = await resolveStorefrontSocial();

  return (
    <SocialLinksProvider social={social}>
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
    </SocialLinksProvider>
  );
}

export default StoreLayout;

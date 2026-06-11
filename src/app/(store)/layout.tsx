import { CartSheet } from "@/features/carts";
import MainFooter from "@/components/layouts/MainFooter";
import { MobileMenuProvider } from "@/components/layouts/MobileMenuContext";
import Navbar from "@/components/layouts/MainNavbar";
import { StoreFloatingActions } from "@/components/layouts/StoreFloatingActions";
import { MobileBottomNav } from "@/components/layouts/MobileBottomNav";
import { resolveStorefrontRuntimeBundle } from "@/lib/integrations/settings";
import { AnnouncementsProvider } from "@/providers/AnnouncementsProvider";
import { BulkOrderGuardProvider } from "@/providers/BulkOrderGuardProvider";
import { CourierChargesProvider } from "@/providers/CourierChargesProvider";
import { OfferCodesProvider } from "@/providers/OfferCodesProvider";
import { SocialLinksProvider } from "@/providers/SocialLinksProvider";
import { StockControlProvider } from "@/providers/StockControlProvider";
import { ReactNode } from "react";

type Props = { children: ReactNode };

export const revalidate = 60;

async function StoreLayout({ children }: Props) {
  const {
    social,
    announcements,
    bulkOrderGuard,
    stockControl,
    courierCharges,
    offerCodes,
  } = await resolveStorefrontRuntimeBundle();

  return (
    <SocialLinksProvider social={social}>
      <AnnouncementsProvider announcements={announcements}>
        <BulkOrderGuardProvider config={bulkOrderGuard}>
          <StockControlProvider config={stockControl}>
            <CourierChargesProvider config={courierCharges}>
              <OfferCodesProvider config={offerCodes}>
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
              </OfferCodesProvider>
            </CourierChargesProvider>
          </StockControlProvider>
        </BulkOrderGuardProvider>
      </AnnouncementsProvider>
    </SocialLinksProvider>
  );
}

export default StoreLayout;

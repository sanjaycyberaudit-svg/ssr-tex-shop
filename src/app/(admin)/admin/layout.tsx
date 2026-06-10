import { SidebarNav } from "@/components/admin/SidebarNav";
import SocialMedias from "@/components/layouts/SocialMedias";
import { siteConfig } from "@/config/site";
import { dashboardConfig } from "@/config/dashboard";
import { resolveStorefrontSocial } from "@/lib/integrations/settings";
import { SocialLinksProvider } from "@/providers/SocialLinksProvider";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const social = await resolveStorefrontSocial();

  return (
    <SocialLinksProvider social={social}>
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[2500px] bg-white px-4 md:px-12">
        <aside className="admin-scroll hidden h-full min-h-0 w-[220px] shrink-0 flex-col overflow-y-auto overscroll-contain border-r bg-white md:flex lg:w-[240px]">
          <div className="flex flex-col py-6 pr-4 lg:py-8 lg:pr-6">
            <SidebarNav items={dashboardConfig.sidebarNav} />
            <div className="mt-8 border-t border-border pt-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Follow {siteConfig.name}
              </p>
              <SocialMedias variant="compact" colored />
            </div>
          </div>
        </aside>
        <main className="admin-scroll min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain py-6 pr-1 md:py-8 md:pl-6 md:pr-2 lg:pl-10">
          {children}
        </main>
      </div>
    </SocialLinksProvider>
  );
}

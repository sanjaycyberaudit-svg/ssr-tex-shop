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
      <div className="flex h-full min-h-0 w-full bg-white">
        <aside className="admin-scroll hidden h-full min-h-0 w-[var(--admin-sidebar-width)] shrink-0 flex-col overflow-y-auto overscroll-contain border-r bg-white md:flex">
          <div className="flex flex-col px-3 py-5">
            <SidebarNav items={dashboardConfig.sidebarNav} />
            <div className="mt-6 border-t border-border pt-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Follow {siteConfig.name}
              </p>
              <SocialMedias variant="compact" colored />
            </div>
          </div>
        </aside>
        <main className="admin-scroll min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-5 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </SocialLinksProvider>
  );
}

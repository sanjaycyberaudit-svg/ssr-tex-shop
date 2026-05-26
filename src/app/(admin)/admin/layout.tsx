import { SidebarNav } from "@/components/admin/SidebarNav";
import SocialMedias from "@/components/layouts/SocialMedias";
import { siteConfig } from "@/config/site";
import { dashboardConfig } from "@/config/dashboard";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-[2500px] bg-white px-4 md:px-12">
      <aside className="hidden h-full min-h-0 w-[220px] shrink-0 flex-col overflow-y-auto overscroll-contain border-r bg-white md:flex lg:w-[240px]">
        <div className="flex flex-col py-6 pr-4 lg:py-8 lg:pr-6">
          <SidebarNav items={dashboardConfig.sidebarNav} />
          <div className="mt-8 border-t border-border pt-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Follow {siteConfig.name}
            </p>
            <SocialMedias variant="compact" />
          </div>
        </div>
      </aside>
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain py-6 md:py-8 md:pl-6 lg:pl-10">
        {children}
      </main>
    </div>
  );
}

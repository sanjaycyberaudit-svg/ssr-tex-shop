import { SidebarNav } from "@/components/admin/SidebarNav";
import SocialMedias from "@/components/layouts/SocialMedias";
import { ScrollArea } from "@/components/ui/scroll-area";
import { siteConfig } from "@/config/site";
import { dashboardConfig } from "@/config/dashboard";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-[2500px] flex-1 items-start bg-white px-4 md:px-12 md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
      <aside className="hidden shrink-0 border-r md:block">
        <ScrollArea className="sticky top-14 h-[calc(100vh-3.5rem)] py-6 pr-6 lg:py-8">
          <SidebarNav items={dashboardConfig.sidebarNav} />
          <div className="mt-8 border-t border-border pt-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Follow {siteConfig.name}
            </p>
            <SocialMedias variant="compact" />
          </div>
        </ScrollArea>
      </aside>
      <main className="min-w-0 flex-1 py-6 md:py-8">{children}</main>
    </div>
  );
}

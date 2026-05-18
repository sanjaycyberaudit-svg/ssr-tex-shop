import { SidebarNav } from "@/components/admin/SidebarNav";
import SocialMedias from "@/components/layouts/SocialMedias";
import { ScrollArea } from "@/components/ui/scrollArea";
import { siteConfig } from "@/config/site";
import { dashboardConfig } from "@/config/dashboard";
import createServerClient from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const cookieStore = cookies();
  const supabase = createServerClient({ cookieStore });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/sign-in");
  }

  return (
    <div className="mx-auto px-4 md:px-[3rem] max-w-[2500px] pt-[50px] flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 bg-white">
      <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 overflow-y-auto border-r md:sticky md:block">
        <ScrollArea className="py-6 pr-6 lg:py-8">
          <SidebarNav items={dashboardConfig.sidebarNav} />
          <div className="mt-8 border-t border-border pt-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Follow {siteConfig.name}
            </p>
            <SocialMedias variant="compact" />
          </div>
        </ScrollArea>
      </aside>
      <main className="flex w-full flex-col overflow-hidden pt-[50px]">
        {children}
      </main>
    </div>
  );
}

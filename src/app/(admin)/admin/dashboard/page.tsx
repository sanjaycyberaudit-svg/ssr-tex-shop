import { DashboardView } from "@/features/admin/dashboard/DashboardView";
import { getDashboardStats } from "@/lib/admin/getDashboardStats";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard | Sakthi Textiles Admin",
  description: "Store overview, analytics, reports and notifications",
};

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return <DashboardView stats={stats} />;
}

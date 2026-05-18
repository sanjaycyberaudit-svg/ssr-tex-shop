import { DashboardView } from "@/features/admin/dashboard/DashboardView";
import {
  getDashboardStats,
  getEmptyDashboardStats,
} from "@/lib/admin/getDashboardStats";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard | Sakthi Textiles Admin",
  description: "Store overview, analytics, reports and notifications",
};

export default async function DashboardPage() {
  let stats = getEmptyDashboardStats();
  let statsError: string | null = null;

  try {
    stats = await getDashboardStats();
  } catch (err) {
    console.error("[admin/dashboard] getDashboardStats failed:", err);
    statsError =
      err instanceof Error
        ? err.message
        : "Could not load dashboard data. Check database connection.";
  }

  return <DashboardView stats={stats} statsError={statsError} />;
}

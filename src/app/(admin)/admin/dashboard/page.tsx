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
    const raw =
      err instanceof Error ? err.message : "Could not load dashboard data.";
    statsError = raw.includes("ENOTFOUND db.")
      ? "Database host is outdated. Ensure DATABASE_SERVICE_ROLE and Supabase URL are set on Vercel (dashboard now uses Supabase API)."
      : raw;
  }

  return <DashboardView stats={stats} statsError={statsError} />;
}

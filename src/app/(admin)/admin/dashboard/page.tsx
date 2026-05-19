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
    statsError =
      raw.includes("ENOTFOUND") && raw.includes("supabase")
        ? "Database connection failed. On Vercel, set DATABASE_URL to the pooler URI (aws-1-ap-south-1, port 6543) or keep the legacy db.* URL — the app rewrites it automatically on deploy."
        : raw;
  }

  return <DashboardView stats={stats} statsError={statsError} />;
}

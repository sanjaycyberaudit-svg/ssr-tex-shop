import Navbar from "@/components/layouts/MainNavbar";
import { getSessionUser, isAdminUser } from "@/lib/auth/admin";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

type Props = { children: ReactNode };

export default async function AdminLayout({ children }: Props) {
  const user = await getSessionUser();

  if (!(await isAdminUser(user))) {
    redirect("/sign-in?error=Admin access required. Sign in with an admin account.");
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar adminLayout />
      <div className="pt-14">{children}</div>
    </div>
  );
}

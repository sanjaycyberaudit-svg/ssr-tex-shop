import { AuthStoreShell } from "@/components/layouts/AuthStoreShell";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthStoreShell>{children}</AuthStoreShell>;
}

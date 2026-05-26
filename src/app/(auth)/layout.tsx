import { AuthStoreShell } from "@/components/layouts/AuthStoreShell";
import { resolveStorefrontSocial } from "@/lib/integrations/settings";
import { SocialLinksProvider } from "@/providers/SocialLinksProvider";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const social = await resolveStorefrontSocial();

  return (
    <SocialLinksProvider social={social}>
      <AuthStoreShell>{children}</AuthStoreShell>
    </SocialLinksProvider>
  );
}

import AdminShell from "@/components/admin/AdminShell";
import { BulkOrderGuardForm } from "@/features/admin/settings/BulkOrderGuardForm";

export default function AdminBulkOrderSettingsPage() {
  return (
    <AdminShell
      heading="Bulk Order Settings"
      description="Configure per-product bulk quantity guard behavior for storefront cart and checkout."
    >
      <BulkOrderGuardForm />
    </AdminShell>
  );
}

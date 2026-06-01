import AdminShell from "@/components/admin/AdminShell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DataTable } from "@/features/cms";
import { OrdersColumns } from "@/features/orders";
import { gql } from "@/gql";
import {
  isPaidPaymentStatus,
  needsPaymentAttention,
} from "@/lib/orders/paymentStatus";
import { getClient } from "@/lib/urql";

export const dynamic = "force-dynamic";

type AdminOrdersPageProps = {
  searchParams: {
    [key: string]: string | string[] | undefined;
  };
};

const AdminOrdersPageQuery = gql(/* GraphQL */ `
  query AdminOrdersPageQuery {
    ordersCollection(orderBy: [{ created_at: DescNullsLast }]) {
      edges {
        node {
          __typename
          id
          payment_status
          order_status
          ...OrderColumnsFragment
        }
      }
    }
  }
`);

type AdminOrderEdge = {
  node: {
    id: string;
    payment_status: string | null;
    order_status: string | null;
  };
};

async function OrdersPage({ searchParams }: AdminOrdersPageProps) {
  void searchParams;

  let fetchError: string | null = null;
  let orders: AdminOrderEdge[] = [];

  try {
    const { data, error } = await getClient().query(AdminOrdersPageQuery, {});
    if (error) {
      fetchError = error.message;
    } else {
      orders = (data?.ordersCollection?.edges as AdminOrderEdge[] | null) ?? [];
    }
  } catch (error) {
    fetchError =
      error instanceof Error ? error.message : "Failed to load orders";
  }

  const paidOrders = orders.filter((entry) =>
    isPaidPaymentStatus(entry.node.payment_status),
  );
  const pendingOrders = orders.filter((entry) =>
    needsPaymentAttention(entry.node),
  );

  return (
    <AdminShell
      heading="Orders"
      description="View and manage customer orders and payment status."
    >
      <div className="space-y-6">
        {fetchError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not fully load orders</AlertTitle>
            <AlertDescription>{fetchError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Total
            </p>
            <p className="mt-1 text-2xl font-semibold">{orders.length}</p>
          </div>
          <div className="rounded-lg border border-amber-300/50 bg-amber-50/40 p-4">
            <p className="text-xs uppercase tracking-wide text-amber-700">
              Pending / unpaid
            </p>
            <p className="mt-1 text-2xl font-semibold text-amber-700">
              {pendingOrders.length}
            </p>
          </div>
          <div className="rounded-lg border border-emerald-300/50 bg-emerald-50/40 p-4">
            <p className="text-xs uppercase tracking-wide text-emerald-700">
              Paid
            </p>
            <p className="mt-1 text-2xl font-semibold text-emerald-700">
              {paidOrders.length}
            </p>
          </div>
        </div>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Pending / unpaid orders</h2>
          <DataTable columns={OrdersColumns} data={pendingOrders} />
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Paid orders</h2>
          <DataTable columns={OrdersColumns} data={paidOrders} />
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">All orders</h2>
          <DataTable columns={OrdersColumns} data={orders} />
        </section>
      </div>
    </AdminShell>
  );
}

export default OrdersPage;

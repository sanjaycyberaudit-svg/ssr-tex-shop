import { ProductsColumns, ProductsDataTable } from "@/features/products";
import { getAdminProductsList } from "@/lib/admin/getAdminProductsList";

export async function AdminProductsTableSection() {
  const productRows = await getAdminProductsList();

  return (
    <ProductsDataTable
      columns={ProductsColumns}
      data={productRows}
      bulkDeleteEndpoint="/api/admin/products/manage"
      bulkDeleteLabel="Delete selected products"
      enableDragSelect
    />
  );
}

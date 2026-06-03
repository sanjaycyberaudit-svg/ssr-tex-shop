export const BULK_ORDER_MIN_QTY = 9;

export function isBulkOrderQuantity(quantity: number): boolean {
  return quantity >= BULK_ORDER_MIN_QTY;
}

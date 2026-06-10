"use client";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@supabase/auth-helpers-nextjs";
import { useMutation, useQuery } from "@urql/next";
import { FetchCartQuery } from "../components/UserCartSection";
import { createCartMutation, updateCartsMutation } from "../query";
import { isBulkOrderQuantity } from "../constants/bulkOrder";
import useCartStore from "../useCartStore";

function useCartActions(user: User | null, productId: string) {
  const { toast } = useToast();
  const [, addToCart] = useMutation(createCartMutation);
  const [, updateCart] = useMutation(updateCartsMutation);
  const addProductStorage = useCartStore((s) => s.addProductToCart);
  const guestCart = useCartStore((s) => s.cart);

  const [{ data }, refetch] = useQuery({
    query: FetchCartQuery,
    variables: {
      userId: user ? user.id : undefined,
    },
  });

  const authAddOrUpdateProduct = async (
    quantity: number,
    opts: { silent?: boolean } = {},
  ) => {
    const existedProduct = data?.cartsCollection.edges.find(
      ({ node }) => node.product_id === productId,
    );
    const currentQuantity = existedProduct?.node.quantity ?? 0;
    if (isBulkOrderQuantity(currentQuantity + quantity)) {
      return { blockedBulk: true, added: false };
    }
    try {
      let res;
      if (!existedProduct) {
        res = await addToCart({
          productId,
          userId: user.id,
          quantity,
        });
        refetch({ requestPolicy: "network-only" });
      } else {
        res = await updateCart({
          productId,
          userId: user.id,
          newQuantity: existedProduct.node.quantity + quantity,
        });
        refetch({ requestPolicy: "network-only" });
      }
      if (res && !res.error && !opts.silent)
        toast({ title: "Success, Added a Product to the Cart." });
      return { blockedBulk: false, added: true };
    } catch (err) {
      if (!opts.silent) toast({ title: "Error, Unexpected Error occurred." });
      return { blockedBulk: false, added: false };
    }
  };

  const guestAddProduct = (quantity: number, opts: { silent?: boolean } = {}) => {
    const currentQuantity = guestCart[productId]?.quantity ?? 0;
    if (isBulkOrderQuantity(currentQuantity + quantity)) {
      return { blockedBulk: true, added: false };
    }
    addProductStorage(productId, quantity);
    if (!opts.silent) toast({ title: "Sucess, Added a Product to the Cart." });
    return { blockedBulk: false, added: true };
  };

  const addProductToCart = async (
    quantity: number,
    opts: { silent?: boolean } = {},
  ) => (!user ? guestAddProduct(quantity, opts) : authAddOrUpdateProduct(quantity, opts));

  return { addProductToCart };
}

export default useCartActions;

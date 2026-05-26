"use client";

import useCartStore, {
  type CartItems,
} from "@/features/carts/hooks/useCartStore";
import { useToast } from "@/components/ui/use-toast";
import { AuthUser, Session } from "@supabase/supabase-js";
import { nanoid } from "nanoid";
import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";
import useWishlistStore from "@/features/wishlists/useWishlistStore";

type SupabaseAuthContextType = {
  user: AuthUser | null;
  session: Session | null;
};

const SupabaseAuthContext = createContext<SupabaseAuthContextType>({
  user: null,
  session: null,
});

export const useAuth = () => {
  const client = useContext(SupabaseAuthContext);
  return client;
};

interface SupabaseAuthProviderProps {
  children: React.ReactNode;
}

export const SupabaseAuthProvider: React.FC<SupabaseAuthProviderProps> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const removeAllCartStorage = useCartStore((s) => s.removeAllProducts);
  const setWishlist = useWishlistStore((s) => s.setWishlist);
  const { toast } = useToast();

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    try {
      const supabase = createClient();
      const authChange = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);

        switch (_event) {
          case "INITIAL_SESSION":
            supabase.auth.getUser().then(({ data }) => {
              setUser(data.user);
            });
            break;
          case "PASSWORD_RECOVERY":
            supabase.auth.signOut();
            setUser(null);
            break;

          case "SIGNED_IN":
            supabase.auth.getUser().then(({ data }) => {
              setUser(data.user);

              if (!data.user) return;

              try {
                const raw = localStorage.getItem("cart");
                if (raw) {
                  const parsed = JSON.parse(raw) as { cart?: CartItems };
                  const cart = parsed?.cart;
                  if (cart && typeof cart === "object") {
                    const storageCarts = Object.entries(cart).map(
                      ([productId, productValue]) => ({
                        id: nanoid(),
                        productId,
                        quantity: productValue.quantity,
                        userId: data.user!.id,
                      }),
                    );

                    if (storageCarts.length > 0) {
                      supabase.from("carts").insert(storageCarts);
                    }
                  }
                }
              } catch {
                // Ignore invalid guest cart payload in localStorage.
              }
            });

            if (session?.user?.id) {
              supabase
                .from("wishlist")
                .select()
                .eq("user_id", session.user.id)
                .then((data) => {
                  const wishlistItems: Parameters<typeof setWishlist>[0] = {};

                  data?.data?.forEach((item) => {
                    wishlistItems[item.product_id] = {
                      createdAt: new Date(item.created_at),
                      updatedAt: new Date(item.created_at),
                    };
                  });

                  setWishlist(wishlistItems);
                });
            }

            toast({
              title: "Welcome Back.",
              description: "Your are arleady signed in.",
            });
            break;
          case "SIGNED_OUT":
            setUser(null);
            removeAllCartStorage();
            break;

          case "TOKEN_REFRESHED":
          case "USER_UPDATED":
          case "MFA_CHALLENGE_VERIFIED":
            supabase.auth.getUser().then(({ data }) => {
              setUser(data.user);
            });
            break;
        }
      });

      subscription = authChange.data.subscription;
    } catch (error) {
      console.error("[auth] Failed to initialize client auth provider", error);
      setUser(null);
      setSession(null);
    }

    return () => subscription?.unsubscribe();
  }, [removeAllCartStorage, setWishlist, toast]);

  return (
    <SupabaseAuthContext.Provider value={{ user, session }}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};

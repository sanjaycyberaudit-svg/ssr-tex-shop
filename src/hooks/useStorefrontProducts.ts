"use client";

import type { SearchQueryVariables } from "@/gql/graphql";
import type { StorefrontCollectionMatch } from "@/lib/storefront/collection-search";
import { useEffect, useState } from "react";
import {
  featuredVariablesToQueryString,
  searchVariablesToQueryString,
} from "@/lib/storefront/search-params";

type ProductsCollection = {
  edges: { node: { id: string } }[];
  pageInfo: { hasNextPage: boolean; endCursor?: string | null };
} | null;

type State = {
  productsCollection: ProductsCollection;
  matchingCollections: StorefrontCollectionMatch[];
  fetching: boolean;
  error: string | null;
};

export function useStorefrontProductSearch(
  variables: SearchQueryVariables,
  collectionId?: string,
) {
  const [state, setState] = useState<State>({
    productsCollection: null,
    matchingCollections: [],
    fetching: true,
    error: null,
  });

  const queryKey = searchVariablesToQueryString(variables, collectionId);

  useEffect(() => {
    let active = true;

    setState((prev) => ({ ...prev, fetching: true, error: null }));

    void fetch(`/api/storefront/products?${queryKey}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load products");
        return res.json() as Promise<{
          productsCollection: ProductsCollection;
          matchingCollections?: StorefrontCollectionMatch[];
        }>;
      })
      .then((payload) => {
        if (!active) return;
        setState({
          productsCollection: payload.productsCollection,
          matchingCollections: payload.matchingCollections ?? [],
          fetching: false,
          error: null,
        });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({
          productsCollection: null,
          matchingCollections: [],
          fetching: false,
          error:
            error instanceof Error ? error.message : "Failed to load products",
        });
      });

    return () => {
      active = false;
    };
  }, [queryKey]);

  return state;
}

export function useStorefrontFeaturedProducts(variables: {
  first: number;
  after?: string | null;
}) {
  const [state, setState] = useState<State>({
    productsCollection: null,
    matchingCollections: [],
    fetching: true,
    error: null,
  });

  const queryKey = featuredVariablesToQueryString(variables);

  useEffect(() => {
    let active = true;

    setState((prev) => ({ ...prev, fetching: true, error: null }));

    void fetch(`/api/storefront/products?${queryKey}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load products");
        return res.json() as Promise<{
          productsCollection: ProductsCollection;
          matchingCollections?: StorefrontCollectionMatch[];
        }>;
      })
      .then((payload) => {
        if (!active) return;
        setState({
          productsCollection: payload.productsCollection,
          matchingCollections: payload.matchingCollections ?? [],
          fetching: false,
          error: null,
        });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({
          productsCollection: null,
          matchingCollections: [],
          fetching: false,
          error:
            error instanceof Error ? error.message : "Failed to load products",
        });
      });

    return () => {
      active = false;
    };
  }, [queryKey]);

  return state;
}

export function useDraftProductIds() {
  const [draftIds, setDraftIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    void fetch("/api/products/drafts")
      .then(async (res) => {
        if (!res.ok) throw new Error("failed");
        return res.json() as Promise<{ ids?: string[] }>;
      })
      .then((payload) => {
        if (!active) return;
        setDraftIds(new Set(payload.ids ?? []));
        setLoaded(true);
      })
      .catch(() => {
        if (!active) return;
        setDraftIds(new Set());
        setLoaded(true);
      });

    return () => {
      active = false;
    };
  }, []);

  return { draftIds, draftLoaded: loaded };
}

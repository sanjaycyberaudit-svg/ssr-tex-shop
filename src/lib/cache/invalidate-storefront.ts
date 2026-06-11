import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "./constants";
import { redisDelByPrefix } from "./redis";

const REDIS_PREFIXES = [
  "sf:products:",
  "sf:drafts",
  "sf:size:",
  "sf:collection:",
  "sf:product:",
] as const;

/** Bust storefront read caches after admin/catalog writes. */
export async function invalidateStorefrontCache() {
  Object.values(CACHE_TAGS).forEach((tag) => revalidateTag(tag));

  await Promise.all(REDIS_PREFIXES.map((prefix) => redisDelByPrefix(prefix)));
}

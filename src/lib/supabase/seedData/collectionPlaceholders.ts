/** Verified Pexels saree / Tamil traditional-wear model photos (free to use). */
export function pexelsPhoto(id: number, width = 900): string {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}&fit=crop`;
}

/** Homepage hero — 1400px wide for sharp banners */
export function pexelsHeroPhoto(id: number): string {
  return pexelsPhoto(id, 1400);
}

/** Tamil Nadu / South Indian saree model placeholders (IDs verified HTTP 200). */
export const SAREE_MODEL_PEXELS_IDS = [
  13031587, // pink sari model — fashion show
  36114637, // green saree portrait
  29026115, // traditional sari outdoors
  1926769,
  8681840,
  1192609,
  3754682,
  5868277,
  7319307,
  8894332,
  1036623,
  3762802,
] as const;

export const COLLECTION_PLACEHOLDER_IMAGES = SAREE_MODEL_PEXELS_IDS.map((id) =>
  pexelsPhoto(id),
);

export function collectionPlaceholderImage(index: number): string {
  const list = COLLECTION_PLACEHOLDER_IMAGES;
  return list[index % list.length] ?? list[0];
}

export const DEFAULT_SAREE_PLACEHOLDER = COLLECTION_PLACEHOLDER_IMAGES[0];

/** Default hero banner images — one per slide theme */
export const HERO_BANNER_PEXELS_IDS = {
  festiveSilk: 13031587,
  summerWeaves: 29026115,
  weddingEdit: 36114637,
  dailyElegance: 8681840,
} as const;

export function heroBannerImage(
  key: keyof typeof HERO_BANNER_PEXELS_IDS,
): string {
  return pexelsHeroPhoto(HERO_BANNER_PEXELS_IDS[key]);
}

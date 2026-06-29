/** Working saree model / traditional-wear placeholders (Pexels — free to use). */
function pexelsPhoto(id: number): string {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=900`;
}

export const COLLECTION_PLACEHOLDER_IMAGES = [
  pexelsPhoto(13031587), // pink sari model
  pexelsPhoto(36114637), // green saree portrait
  pexelsPhoto(29026115), // traditional sari outdoors
  pexelsPhoto(1926769),
  pexelsPhoto(8681840),
  pexelsPhoto(1192609),
  pexelsPhoto(3754682),
  pexelsPhoto(5868277),
  pexelsPhoto(7319307),
  pexelsPhoto(8894332),
  pexelsPhoto(1036623),
  pexelsPhoto(3762802),
] as const;

export function collectionPlaceholderImage(index: number): string {
  const list = COLLECTION_PLACEHOLDER_IMAGES;
  return list[index % list.length] ?? list[0];
}

export const DEFAULT_SAREE_PLACEHOLDER = COLLECTION_PLACEHOLDER_IMAGES[0];

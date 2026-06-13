"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  AdminLoadingState,
  LoadingButtonLabel,
} from "@/components/admin/AdminLoadingState";
import { fetchWithRetry, fetchWithTimeout } from "@/lib/network/fetchWithTimeout";
import { cn, keytoUrl } from "@/lib/utils";

type MediaSection = "banner" | "product";

type MediaLibraryItem = {
  id: string;
  key: string;
  alt: string;
  createdAt: string;
  section: MediaSection;
  usage: {
    bannerSlideCount: number;
    productCount: number;
    collectionCount: number;
    testimonialCount: number;
  };
};

type DeleteResponse = {
  deletedMediaIds: string[];
  deletedProductIds: string[];
  blocked: { mediaId: string; reason: string }[];
};

type DragState = {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  additive: boolean;
  startSelection: Set<string>;
};

type MediaUploadPhase = "idle" | "preparing" | "uploading" | "refreshing";

type MediaUploadProgress = {
  phase: MediaUploadPhase;
  current: number;
  total: number;
  percent: number;
  message: string;
};

const MAX_MEDIA_REQUEST_BYTES = 3.5 * 1024 * 1024;
const CLIENT_PREPROCESS_MAX_EDGE = 2400;
const CLIENT_TARGET_IMAGE_BYTES = 2 * 1024 * 1024;
const CLIENT_QUALITY_STEPS = [0.9, 0.86, 0.82, 0.78, 0.74] as const;

function intersects(a: DOMRect, b: DOMRect) {
  return !(
    a.right < b.left ||
    a.left > b.right ||
    a.bottom < b.top ||
    a.top > b.bottom
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function replaceExt(fileName: string, ext: string) {
  return fileName.replace(/\.[^/.]+$/, "") + ext;
}

function chunkFilesBySize(files: File[], maxBytes: number): File[][] {
  if (files.length === 0) return [];
  const chunks: File[][] = [];
  let currentChunk: File[] = [];
  let currentSize = 0;

  for (const file of files) {
    if (currentChunk.length > 0 && currentSize + file.size > maxBytes) {
      chunks.push(currentChunk);
      currentChunk = [];
      currentSize = 0;
    }
    currentChunk.push(file);
    currentSize += file.size;
  }

  if (currentChunk.length > 0) chunks.push(currentChunk);
  return chunks;
}

async function compressImageForMediaUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.type === "image/gif") return file;

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Unsupported image format."));
      img.src = objectUrl;
    });

    const originalWidth = image.naturalWidth || image.width;
    const originalHeight = image.naturalHeight || image.height;
    if (!originalWidth || !originalHeight) return file;

    const scale = Math.min(
      1,
      CLIENT_PREPROCESS_MAX_EDGE / Math.max(originalWidth, originalHeight),
    );
    const targetWidth = Math.max(1, Math.round(originalWidth * scale));
    const targetHeight = Math.max(1, Math.round(originalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

    let bestBlob: Blob | null = null;
    for (const quality of CLIENT_QUALITY_STEPS) {
      // eslint-disable-next-line no-await-in-loop
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", quality),
      );
      if (!blob) continue;
      if (!bestBlob || blob.size < bestBlob.size) bestBlob = blob;
      if (blob.size <= CLIENT_TARGET_IMAGE_BYTES) {
        bestBlob = blob;
        break;
      }
    }

    if (!bestBlob) return file;
    if (bestBlob.size >= file.size) return file;

    return new File([bestBlob], replaceExt(file.name, ".webp"), {
      type: "image/webp",
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function uploadMediaBatch(files: File[]) {
  const formData = new FormData();
  files.forEach((file, index) => formData.append(`files[${index}]`, file));

  let response: Response | null = null;
  let attempts = 0;
  while (attempts < 3) {
    try {
      // eslint-disable-next-line no-await-in-loop
      response = await fetchWithTimeout("/api/medias", {
        method: "POST",
        body: formData,
        timeoutMs: 45000,
      });
      if (response.status < 500) break;
    } catch {
      // transient failure, retry
    }
    attempts += 1;
    if (attempts < 3) {
      // eslint-disable-next-line no-await-in-loop
      await delay(400 * attempts);
    }
  }

  if (!response) {
    return {
      status: 503,
      uploaded: [] as string[],
      errors: ["Upload request failed after retries."],
      message: "Upload request failed after retries.",
      isRequestTooLarge: false,
    };
  }

  const raw = await response.text();
  let payload:
    | string[]
    | { message?: string; uploaded?: string[]; errors?: string[] }
    | null = null;
  try {
    payload = JSON.parse(raw) as
      | string[]
      | { message?: string; uploaded?: string[]; errors?: string[] };
  } catch {
    payload = null;
  }

  const isRequestTooLarge =
    response.status === 413 || /request entity too large/i.test(raw);

  if (Array.isArray(payload)) {
    return {
      status: response.status,
      uploaded: payload,
      errors: [],
      message: "",
      isRequestTooLarge,
    };
  }

  const uploaded = payload?.uploaded ?? [];
  const errors = payload?.errors ?? [];
  const message = payload?.message ?? "";

  return {
    status: response.status,
    uploaded,
    errors,
    message,
    isRequestTooLarge,
  };
}

const MEDIA_LIBRARY_PAGE_SIZE = 48;

export function AdminMediaManager() {
  const { toast } = useToast();
  const [medias, setMedias] = useState<MediaLibraryItem[]>([]);
  const [activeSection, setActiveSection] = useState<MediaSection>("product");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [counts, setCounts] = useState({ banner: 0, product: 0 });
  const [uploadProgress, setUploadProgress] =
    useState<MediaUploadProgress | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const sectionItems = medias;
  const sectionItemIds = useMemo(
    () => new Set(sectionItems.map((item) => item.id)),
    [sectionItems],
  );
  const bannerCount = counts.banner;
  const productCount = counts.product;

  const loadLibrary = async (options?: {
    reset?: boolean;
    page?: number;
    section?: MediaSection;
  }) => {
    const section = options?.section ?? activeSection;
    const targetPage = options?.page ?? 1;
    const reset = options?.reset ?? targetPage === 1;

    if (reset) {
      setIsLoading(true);
      setLoadError(null);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        limit: String(MEDIA_LIBRARY_PAGE_SIZE),
        section,
      });
      const res = await fetchWithRetry(
        `/api/admin/medias/library?${params.toString()}`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error("Could not load media library.");

      const payload = (await res.json()) as {
        medias: MediaLibraryItem[];
        pageInfo: { page: number; hasNextPage: boolean };
        counts: { banner: number; product: number };
      };

      setCounts(payload.counts ?? { banner: 0, product: 0 });
      setPage(payload.pageInfo?.page ?? targetPage);
      setHasNextPage(Boolean(payload.pageInfo?.hasNextPage));
      setMedias((prev) =>
        reset ? (payload.medias ?? []) : [...prev, ...(payload.medias ?? [])],
      );
      setLoadError(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Please retry.";
      setLoadError(message);
      if (reset) {
        setMedias([]);
        toast({
          title: "Failed to load medias",
          description: message,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    setSelectedIds([]);
    setPage(1);
    void loadLibrary({ reset: true, page: 1, section: activeSection });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => sectionItemIds.has(id)));
  }, [sectionItemIds]);

  useEffect(() => {
    if (!drag) return;

    const onMouseMove = (event: MouseEvent) => {
      setDrag((prev) =>
        prev
          ? {
              ...prev,
              currentX: event.clientX,
              currentY: event.clientY,
            }
          : null,
      );
    };

    const onMouseUp = () => {
      setDrag(null);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [drag]);

  useEffect(() => {
    if (!drag) return;

    const rect = new DOMRect(
      Math.min(drag.startX, drag.currentX),
      Math.min(drag.startY, drag.currentY),
      Math.abs(drag.currentX - drag.startX),
      Math.abs(drag.currentY - drag.startY),
    );

    const hitIds = new Set<string>();
    for (const item of sectionItems) {
      const node = itemRefs.current[item.id];
      if (!node) continue;
      if (intersects(rect, node.getBoundingClientRect())) {
        hitIds.add(item.id);
      }
    }

    const merged = drag.additive
      ? new Set([...drag.startSelection, ...hitIds])
      : hitIds;
    setSelectedIds([...merged]);
  }, [drag, sectionItems]);

  const onUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const selectedFiles = Array.from(files);

    setIsUploading(true);
    try {
      setUploadProgress({
        phase: "preparing",
        current: 0,
        total: selectedFiles.length,
        percent: 1,
        message: `Preparing images 0/${selectedFiles.length}`,
      });

      const preparedFiles: File[] = [];
      for (let index = 0; index < selectedFiles.length; index += 1) {
        // eslint-disable-next-line no-await-in-loop
        const compressed = await compressImageForMediaUpload(
          selectedFiles[index],
        );
        preparedFiles.push(compressed);
        const prepPercent = Math.max(
          1,
          Math.round(((index + 1) / selectedFiles.length) * 45),
        );
        setUploadProgress({
          phase: "preparing",
          current: index + 1,
          total: selectedFiles.length,
          percent: prepPercent,
          message: `Preparing images ${index + 1}/${selectedFiles.length}`,
        });
      }

      const initialBatches = chunkFilesBySize(
        preparedFiles,
        MAX_MEDIA_REQUEST_BYTES,
      );
      const queue = initialBatches.length > 0 ? [...initialBatches] : [[]];
      let processedBatches = 0;
      let uploadedCount = 0;
      const errors: string[] = [];

      while (queue.length > 0) {
        const filesBatch = queue.shift();
        if (!filesBatch) break;
        const totalNow = processedBatches + queue.length + 1;
        const currentNow = processedBatches + 1;
        const uploadPercent = Math.min(
          95,
          Math.round(45 + (currentNow / Math.max(1, totalNow)) * 45),
        );
        setUploadProgress({
          phase: "uploading",
          current: currentNow,
          total: totalNow,
          percent: uploadPercent,
          message: `Uploading batch ${currentNow}/${totalNow}`,
        });

        // eslint-disable-next-line no-await-in-loop
        const result = await uploadMediaBatch(filesBatch);
        if (result.isRequestTooLarge && filesBatch.length > 1) {
          const mid = Math.ceil(filesBatch.length / 2);
          const firstHalf = filesBatch.slice(0, mid);
          const secondHalf = filesBatch.slice(mid);
          queue.unshift(secondHalf, firstHalf);
          continue;
        }

        if (result.isRequestTooLarge && filesBatch.length === 1) {
          throw new Error(
            `${filesBatch[0].name} is too large to upload. Compress this image and retry.`,
          );
        }

        if (
          result.status >= 400 &&
          result.uploaded.length === 0 &&
          (result.errors.length === 0 || result.message)
        ) {
          throw new Error(result.message || "Media upload failed.");
        }

        uploadedCount += result.uploaded.length;
        errors.push(...result.errors);
        processedBatches += 1;
      }

      setUploadProgress({
        phase: "refreshing",
        current: 1,
        total: 1,
        percent: 98,
        message: "Refreshing media library...",
      });
      await loadLibrary({ reset: true, section: activeSection });

      if (uploadedCount === 0) {
        throw new Error(errors[0] || "No images were uploaded.");
      }

      toast({
        title: "Upload complete",
        description:
          errors.length > 0
            ? `${uploadedCount} image(s) uploaded with ${errors.length} warning(s).`
            : `${uploadedCount} image(s) uploaded successfully.`,
      });
      if (errors.length > 0) {
        console.warn("[media-upload] partial errors:", errors);
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Please retry.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    setIsDeleting(true);
    try {
      const res = await fetchWithTimeout("/api/admin/medias/library", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: activeSection,
          mediaIds: selectedIds,
        }),
      });
      const payload = (await res.json()) as
        | DeleteResponse
        | { message?: string };
      if (!res.ok) {
        throw new Error(
          "message" in payload && payload.message
            ? payload.message
            : "Delete request failed.",
        );
      }

      const result = payload as DeleteResponse;
      const blockedCount = result.blocked.length;
      const deletedCount = result.deletedMediaIds.length;
      const deletedProducts = result.deletedProductIds.length;

      await loadLibrary({ reset: true, section: activeSection });
      setSelectedIds([]);

      toast({
        title: "Delete completed",
        description: `Deleted medias: ${deletedCount}, deleted products: ${deletedProducts}, blocked: ${blockedCount}.`,
      });
      if (blockedCount > 0) {
        console.warn("[media-delete] blocked items:", result.blocked);
      }
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Please retry.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const onGridMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest("[data-media-id]")) return;

    setDrag({
      startX: event.clientX,
      startY: event.clientY,
      currentX: event.clientX,
      currentY: event.clientY,
      additive: event.ctrlKey || event.metaKey,
      startSelection: new Set(selectedIds),
    });
  };

  const dragOverlayStyle = useMemo(() => {
    if (!drag || !gridRef.current) return undefined;
    const rootRect = gridRef.current.getBoundingClientRect();
    const left = Math.min(drag.startX, drag.currentX) - rootRect.left;
    const top = Math.min(drag.startY, drag.currentY) - rootRect.top;
    const width = Math.abs(drag.currentX - drag.startX);
    const height = Math.abs(drag.currentY - drag.startY);
    return { left, top, width, height };
  }, [drag]);

  return (
    <div className="space-y-4">
      {uploadProgress ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 backdrop-blur-[1px]">
          <div className="w-[320px] rounded-xl border border-[#E8A317]/40 bg-white p-5 shadow-2xl">
            <p className="text-center text-sm font-semibold text-[#8A5A00]">
              {uploadProgress.message}
            </p>
            <p className="mt-2 text-center text-3xl font-bold text-[#8A5A00]">
              {uploadProgress.percent}%
            </p>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#FDECC8]">
              <div
                className="h-full rounded-full bg-[#E8A317] transition-all"
                style={{ width: `${uploadProgress.percent}%` }}
              />
            </div>
          </div>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={activeSection === "banner" ? "default" : "outline"}
          onClick={() => setActiveSection("banner")}
        >
          Banner Images ({bannerCount})
        </Button>
        <Button
          variant={activeSection === "product" ? "default" : "outline"}
          onClick={() => setActiveSection("product")}
        >
          Product Images ({productCount})
        </Button>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <LoadingButtonLabel
              isLoading={isUploading}
              loadingText="Uploading..."
              idleText="Upload Images"
            />
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setSelectedIds(sectionItems.map((item) => item.id))}
            disabled={sectionItems.length === 0}
          >
            Select All Loaded
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setSelectedIds([])}
            disabled={selectedIds.length === 0}
          >
            Clear
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onDeleteSelected}
            disabled={selectedIds.length === 0 || isDeleting}
          >
            <LoadingButtonLabel
              isLoading={isDeleting}
              loadingText="Deleting..."
              idleText={`Delete Selected (${selectedIds.length})`}
            />
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Tip: click to multi-select. Drag on empty space to box-select many
        images quickly.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        accept="image/*"
        onChange={(event) => {
          void onUploadFiles(event.target.files);
        }}
      />

      {isLoading ? (
        <AdminLoadingState message="Loading media library..." />
      ) : loadError && sectionItems.length === 0 ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm font-medium text-destructive">{loadError}</p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() =>
              void loadLibrary({ reset: true, section: activeSection })
            }
          >
            Retry
          </Button>
        </div>
      ) : (
        <>
          <div
            ref={gridRef}
            className="relative grid grid-cols-3 gap-3 rounded-md border p-3 md:grid-cols-6 xl:grid-cols-8"
            onMouseDown={onGridMouseDown}
          >
            {sectionItems.length === 0 ? (
              <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
                No images in this section yet.
              </p>
            ) : null}
            {sectionItems.map((item) => {
            const selected = selectedIds.includes(item.id);
            return (
              <button
                key={item.id}
                data-media-id={item.id}
                ref={(el) => {
                  itemRefs.current[item.id] = el;
                }}
                type="button"
                className={cn(
                  "relative overflow-hidden rounded-md border text-left",
                  selected ? "ring-2 ring-primary ring-offset-2" : "",
                )}
                onClick={(event) => {
                  const multi = event.ctrlKey || event.metaKey;
                  setSelectedIds((prev) => {
                    if (multi) {
                      return prev.includes(item.id)
                        ? prev.filter((id) => id !== item.id)
                        : [...prev, item.id];
                    }
                    return prev.includes(item.id) && prev.length === 1
                      ? []
                      : [item.id];
                  });
                }}
              >
                <Image
                  src={keytoUrl(item.key)}
                  alt={item.alt || "media"}
                  width={120}
                  height={120}
                  className="h-[120px] w-full object-cover"
                />
                <div className="space-y-0.5 bg-background/95 p-1.5 text-[10px]">
                  <p className="truncate font-medium">{item.alt || "image"}</p>
                  <p className="text-muted-foreground">
                    Products: {item.usage.productCount}
                  </p>
                  {activeSection === "banner" ? (
                    <p className="text-muted-foreground">
                      Slides: {item.usage.bannerSlideCount}
                    </p>
                  ) : null}
                </div>
              </button>
            );
          })}

          {dragOverlayStyle ? (
            <div
              className="pointer-events-none absolute z-20 border border-primary/70 bg-primary/15"
              style={dragOverlayStyle}
            />
          ) : null}
          </div>

          {hasNextPage ? (
            <div className="flex justify-center pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isLoadingMore}
                onClick={() =>
                  void loadLibrary({
                    reset: false,
                    page: page + 1,
                    section: activeSection,
                  })
                }
              >
                <LoadingButtonLabel
                  isLoading={isLoadingMore}
                  loadingText="Loading..."
                  idleText={`Load more (${sectionItems.length} of ${
                    activeSection === "banner" ? bannerCount : productCount
                  })`}
                />
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

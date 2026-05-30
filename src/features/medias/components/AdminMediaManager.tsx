"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
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

function intersects(a: DOMRect, b: DOMRect) {
  return !(
    a.right < b.left ||
    a.left > b.right ||
    a.bottom < b.top ||
    a.top > b.bottom
  );
}

export function AdminMediaManager() {
  const { toast } = useToast();
  const [medias, setMedias] = useState<MediaLibraryItem[]>([]);
  const [activeSection, setActiveSection] = useState<MediaSection>("product");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [drag, setDrag] = useState<DragState | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const sectionItems = useMemo(
    () => medias.filter((m) => m.section === activeSection),
    [medias, activeSection],
  );
  const sectionItemIds = useMemo(
    () => new Set(sectionItems.map((item) => item.id)),
    [sectionItems],
  );
  const bannerCount = useMemo(
    () => medias.filter((m) => m.section === "banner").length,
    [medias],
  );
  const productCount = medias.length - bannerCount;

  const loadLibrary = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/medias/library", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Could not load media library.");
      const payload = (await res.json()) as { medias: MediaLibraryItem[] };
      setMedias(payload.medias ?? []);
    } catch (error) {
      toast({
        title: "Failed to load medias",
        description: error instanceof Error ? error.message : "Please retry.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadLibrary();
  }, []);

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

    const formData = new FormData();
    [...files].forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });

    setIsUploading(true);
    try {
      const res = await fetch("/api/medias", {
        method: "POST",
        body: formData,
      });
      const payload = (await res.json().catch(() => null)) as
        | string[]
        | { message?: string; uploaded?: string[]; errors?: string[] }
        | null;

      if (!res.ok && payload && !Array.isArray(payload) && payload.message) {
        throw new Error(payload.message);
      }

      await loadLibrary();
      toast({
        title: "Upload complete",
        description: "Media library refreshed.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Please retry.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/admin/medias/library", {
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

      await loadLibrary();
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
            {isUploading ? "Uploading..." : "Upload Images"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setSelectedIds(sectionItems.map((item) => item.id))}
            disabled={sectionItems.length === 0}
          >
            Select All
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
            {isDeleting
              ? "Deleting..."
              : `Delete Selected (${selectedIds.length})`}
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
        <p className="text-sm text-muted-foreground">Loading medias...</p>
      ) : (
        <div
          ref={gridRef}
          className="relative grid grid-cols-3 gap-3 rounded-md border p-3 md:grid-cols-6 xl:grid-cols-8"
          onMouseDown={onGridMouseDown}
        >
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
      )}
    </div>
  );
}

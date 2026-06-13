"use client";

import { createProductAction, updateProductAction } from "@/_actions/products";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TagsField from "@/components/ui/tagsField";
import { useToast } from "@/components/ui/use-toast";
import {
  AdminLoadingState,
  LoadingButtonLabel,
} from "@/components/admin/AdminLoadingState";
import { BadgeSelectField } from "@/features/cms";
import { ImageDialog } from "@/features/medias";
import UploadMediaContainer from "@/features/medias/components/UploadMediaContainer";
import {
  InsertProducts,
  SelectProducts,
  products,
} from "@/lib/supabase/schema";
import {
  mergeUniqueFiles,
  prepareImageFilesForDirect,
  runBulkDraftUpload,
  type UploadFileFailure,
  type UploadProgressUpdate,
  UPLOAD_LIMIT_MB,
} from "@/lib/admin/client-image-upload";
import { fetchWithTimeout } from "@/lib/network/fetchWithTimeout";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@urql/next";
import { createInsertSchema } from "drizzle-zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useForm } from "react-hook-form";
import { gql } from "urql";

type ProductsFormProps = {
  product?: SelectProducts;
};

type BulkCreateMode = "single" | "bulk";

type CreatedDraftProduct = {
  id: string;
  productCode: string;
  name: string;
  slug: string;
};

const MAX_BULK_FILES = 50;
const BULK_SHARED_FIELDS = [
  "name",
  "description",
  "isDraft",
  "collectionId",
  "badge",
  "rating",
  "tags",
  "price",
  "stock",
] as const;

type ApiSettingRecord = {
  key: string;
  isEnabled: boolean;
  value: Record<string, unknown>;
} | null;

type IntegrationsPayload = {
  stockControl: ApiSettingRecord;
};

type SizeOptionForm = {
  size: string;
  qty: string;
};

type ProductSizeConfigForm = {
  enabled: boolean;
  options: SizeOptionForm[];
};

const DEFAULT_SIZE_OPTIONS: SizeOptionForm[] = [
  { size: "36", qty: "1" },
  { size: "38", qty: "1" },
  { size: "40", qty: "1" },
  { size: "42", qty: "1" },
  { size: "44", qty: "1" },
];

function normalizeSizeQtyInput(raw: unknown) {
  const value = Number(String(raw ?? "").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value * 100) / 100);
}

function hasAnySizeOptionConfigured(options: SizeOptionForm[]) {
  return options.some((option) => {
    const size = String(option.size ?? "").trim();
    const qty = normalizeSizeQtyInput(option.qty);
    return size.length > 0 || qty > 0;
  });
}

type BulkSharedPayload = {
  name: string;
  description: string;
  isDraft: boolean;
  collectionId: string | null;
  badge: string | null;
  rating: string;
  price: string;
  tags: string[];
  stock: number;
};

export const ProductFormQuery = gql(/* GraphQL */ `
  query ProductFormQuery {
    collectionsCollection(orderBy: [{ label: AscNullsLast }]) {
      __typename
      edges {
        node {
          id
          label
        }
      }
    }
  }
`);

function ProductFrom({ product }: ProductsFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();
  const [createMode, setCreateMode] = useState<BulkCreateMode>("single");
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [isMediaDialogOpen, setIsMediaDialogOpen] = useState(false);
  const [bulkCreated, setBulkCreated] = useState<CreatedDraftProduct[]>([]);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [bulkFailures, setBulkFailures] = useState<UploadFileFailure[]>([]);
  const [bulkProgress, setBulkProgress] =
    useState<UploadProgressUpdate | null>(null);
  const [bulkPhase, setBulkPhase] = useState<
    "idle" | "preparing" | "uploading" | "creating"
  >("idle");
  const [prepareProgress, setPrepareProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [stockControl, setStockControl] = useState({
    enabled: false,
    lowStockThreshold: 5,
  });
  const [sizeConfig, setSizeConfig] = useState<ProductSizeConfigForm>({
    enabled: false,
    options: [{ size: "", qty: "" }],
  });
  const localFileInputRef = useRef<HTMLInputElement>(null);

  const [{ data }] = useQuery({
    query: ProductFormQuery,
  });

  const form = useForm<InsertProducts>({
    resolver: zodResolver(createInsertSchema(products)),
    defaultValues: {
      ...product,
      stock: typeof product?.stock === "number" ? product.stock : 1,
    },
  });

  const { register, control, handleSubmit } = form;

  useEffect(() => {
    let active = true;
    const loadSettings = async () => {
      try {
        const response = await fetchWithTimeout("/api/admin/integrations", {
          cache: "no-store",
        });
        if (!response.ok) return;
        const payload = (await response.json()) as IntegrationsPayload;
        if (!active) return;

        const thresholdRaw = Number(
          payload.stockControl?.value?.lowStockThreshold ?? 5,
        );
        const lowStockThreshold = Number.isFinite(thresholdRaw)
          ? Math.min(99, Math.max(1, Math.round(thresholdRaw)))
          : 5;
        const enabled = Boolean(payload.stockControl?.isEnabled ?? false);
        setStockControl({ enabled, lowStockThreshold });

        if (!product && enabled) {
          const currentStock = Number(form.getValues("stock"));
          if (!Number.isFinite(currentStock) || currentStock <= 0) {
            form.setValue("stock", 1);
          }
        }
      } catch {
        // Settings fetch failure should not block product edit/create.
      }
    };
    void loadSettings();

    return () => {
      active = false;
    };
  }, [form, product]);

  useEffect(() => {
    if (!product?.id) return;
    let active = true;
    const loadSizeConfig = async () => {
      try {
        const response = await fetchWithTimeout(
          `/api/admin/products/size-config?productId=${encodeURIComponent(product.id)}`,
          { cache: "no-store" },
        );
        if (!response.ok) return;
        const payload = (await response.json()) as {
          config?: ProductSizeConfigForm;
        };
        if (!active) return;
        const config = payload.config;
        if (!config) return;
        setSizeConfig({
          enabled: Boolean(config.enabled),
          options:
            Array.isArray(config.options) && config.options.length > 0
              ? config.options.map((item) => ({
                  size: String(item.size ?? "")
                    .trim()
                    .slice(0, 8)
                    .toUpperCase(),
                  qty: String(item.qty ?? ""),
                }))
              : [{ size: "", qty: "" }],
        });
      } catch {
        // keep default config
      }
    };
    void loadSizeConfig();
    return () => {
      active = false;
    };
  }, [product?.id]);

  const normalizedSizeConfig = useMemo(() => {
    const dedup = new Map<string, { size: string; qty: number }>();
    for (const option of sizeConfig.options) {
      const size = String(option.size ?? "")
        .trim()
        .slice(0, 8)
        .toUpperCase();
      const qty = normalizeSizeQtyInput(option.qty);
      if (!size && qty <= 0) continue;
      const key = size || "__NO_LABEL__";
      dedup.set(key, { size, qty });
    }
    return {
      enabled: sizeConfig.enabled,
      options: Array.from(dedup.values()),
    };
  }, [sizeConfig.enabled, sizeConfig.options]);

  const inBulkMode = !product && createMode === "bulk";
  const totalBulkImages = bulkFiles.length + selectedMediaIds.length;
  const canSubmitBulk = useMemo(
    () =>
      totalBulkImages > 0 &&
      totalBulkImages <= MAX_BULK_FILES &&
      !isPending &&
      bulkPhase !== "preparing",
    [bulkPhase, isPending, totalBulkImages],
  );

  const bulkOverlay = useMemo(() => {
    if (!inBulkMode || bulkPhase === "idle") return null;
    if (bulkProgress) {
      return {
        percent: bulkProgress.percent,
        message: bulkProgress.message,
      };
    }
    return {
      percent: 10,
      message: "Working...",
    };
  }, [bulkPhase, bulkProgress, inBulkMode]);

  const addLocalFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setBulkPhase("preparing");
    setPrepareProgress({ current: 0, total: files.length });

    const { prepared, rejected } = await prepareImageFilesForDirect(
      files,
      (current, total) => {
        setPrepareProgress({ current, total });
      },
    );

    if (rejected.length > 0) {
      toast({
        title: `${rejected.length} file(s) skipped`,
        description: rejected
          .slice(0, 3)
          .map((entry) => entry.reason)
          .join(" "),
        variant: "destructive",
      });
      setBulkErrors((prev) => [
        ...prev,
        ...rejected.map((entry) => entry.reason),
      ]);
    }

    setBulkFiles((prev) =>
      mergeUniqueFiles(
        prev,
        prepared.map((item) => item.file),
      ),
    );
    setPrepareProgress(null);
    setBulkPhase("idle");
  };

  const toggleSelectedMediaId = (mediaId: string) => {
    setSelectedMediaIds((prev) =>
      prev.includes(mediaId)
        ? prev.filter((id) => id !== mediaId)
        : [...prev, mediaId],
    );
  };

  const onSingleSubmit = async (data: InsertProducts) => {
    startTransition(async () => {
      try {
        const normalizedStockRaw = Number(data.stock);
        const normalizedStock = Number.isFinite(normalizedStockRaw)
          ? Math.max(0, Math.round(normalizedStockRaw))
          : stockControl.enabled
            ? 1
            : 0;
        const payload: InsertProducts = {
          ...data,
          stock: normalizedStock,
        };
        const result = product
          ? await updateProductAction(product.id, payload)
          : await createProductAction(payload);
        const productId = product?.id ?? result?.[0]?.id;
        if (!productId) {
          throw new Error("Product id missing after save.");
        }
        const sizeSave = await fetchWithTimeout(
          "/api/admin/products/size-config",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId,
              config: normalizedSizeConfig,
            }),
          },
        );
        if (!sizeSave.ok) {
          throw new Error("Could not save size configuration.");
        }

        router.push("/admin/products");
        router.refresh();

        toast({
          title: `Product is ${product ? "updated" : "created"}.`,
          description: `${payload.name}`,
        });
      } catch (err) {
        toast({
          title: "Unable to save product",
          description: "Please retry.",
          variant: "destructive",
        });
      }
    });
  };

  const onBulkSubmit = async () => {
    if (!canSubmitBulk) {
      toast({
        title: "Select images",
        description: `Select 1 to ${MAX_BULK_FILES} total images from Media Library and/or Computer.`,
        variant: "destructive",
      });
      return;
    }

    const isValid = await form.trigger(BULK_SHARED_FIELDS);
    if (!isValid) {
      toast({
        title: "Fix form errors",
        description: "Complete the required fields before bulk create.",
        variant: "destructive",
      });
      return;
    }

    const values = form.getValues();
    const shared: BulkSharedPayload = {
      name: String(values.name ?? "").trim(),
      description: String(values.description ?? ""),
      isDraft: Boolean(values.isDraft),
      collectionId: values.collectionId ?? null,
      badge: values.badge ? String(values.badge) : null,
      rating: String(values.rating ?? "4"),
      price: String(values.price ?? "0"),
      tags: Array.isArray(values.tags) ? values.tags : [],
      stock: Number.isFinite(Number(values.stock))
        ? Math.max(0, Math.round(Number(values.stock)))
        : 0,
    };

    startTransition(async () => {
      try {
        setBulkCreated([]);
        setBulkErrors([]);
        setBulkFailures([]);
        setBulkPhase("uploading");

        const result = await runBulkDraftUpload({
          files: bulkFiles,
          selectedMediaIds,
          shared,
          onProgress: (update) => {
            setBulkProgress(update);
            setBulkPhase(
              update.phase === "complete" ? "creating" : "uploading",
            );
          },
        });

        setBulkCreated(result.created);
        setBulkErrors(result.errors);
        setBulkFailures(result.failures);

        if (result.created.length === 0) {
          throw new Error(
            result.errors[0] ||
              "No products were created. Check selected images and shared details.",
          );
        }

        toast({
          title: "Bulk create finished",
          description:
            result.errors.length > 0
              ? `${result.created.length} products created with ${result.errors.length} warning(s).`
              : `${result.created.length} products created.`,
        });

        if (result.failures.length === 0) {
          setBulkFiles([]);
        } else {
          setBulkFiles(result.failures.map((entry) => entry.file));
        }
        if (result.created.length > 0) {
          setSelectedMediaIds([]);
        }
        router.refresh();
      } catch (error) {
        toast({
          title: "Bulk create failed",
          description: error instanceof Error ? error.message : "Please retry.",
          variant: "destructive",
        });
      } finally {
        setBulkProgress(null);
        setBulkPhase("idle");
      }
    });
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inBulkMode) {
      void onBulkSubmit();
      return;
    }
    void handleSubmit(onSingleSubmit)();
  };

  const updateSizeOption = (
    index: number,
    key: keyof SizeOptionForm,
    value: string,
  ) => {
    setSizeConfig((prev) => ({
      ...prev,
      options: prev.options.map((option, i) =>
        i === index ? { ...option, [key]: value } : option,
      ),
    }));
  };

  const addSizeOption = () => {
    setSizeConfig((prev) => ({
      ...prev,
      options: [...prev.options, { size: "", qty: "" }],
    }));
  };

  const removeSizeOption = (index: number) => {
    setSizeConfig((prev) => ({
      ...prev,
      options:
        prev.options.length <= 1
          ? [{ size: "", qty: "" }]
          : prev.options.filter((_, i) => i !== index),
    }));
  };

  return (
    <Form {...form}>
      {bulkOverlay ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 backdrop-blur-[1px]">
          <div className="w-[320px] rounded-xl border border-[#E8A317]/40 bg-white p-5 shadow-2xl">
            <p className="text-center text-sm font-semibold text-[#8A5A00]">
              {bulkOverlay.message}
            </p>
            <p className="mt-2 text-center text-3xl font-bold text-[#8A5A00]">
              {bulkOverlay.percent}%
            </p>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#FDECC8]">
              <div
                className="h-full rounded-full bg-[#E8A317] transition-all"
                style={{ width: `${bulkOverlay.percent}%` }}
              />
            </div>
          </div>
        </div>
      ) : null}
      <form
        id="project-form"
        className="gap-x-5 flex gap-y-5 flex-col px-3"
        onSubmit={onSubmit}
      >
        <div className="flex flex-col gap-y-5 max-w-[500px]">
          {!product ? (
            <FormItem>
              <FormLabel className="text-sm">Create mode</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={createMode === "single" ? "default" : "outline"}
                    onClick={() => setCreateMode("single")}
                  >
                    Single Product
                  </Button>
                  <Button
                    type="button"
                    variant={createMode === "bulk" ? "default" : "outline"}
                    onClick={() => setCreateMode("bulk")}
                  >
                    Bulk from images
                  </Button>
                </div>
              </FormControl>
              <FormDescription>
                Bulk mode reuses shared details and creates one product per
                image.
              </FormDescription>
            </FormItem>
          ) : null}

          <FormItem>
            <FormLabel className="text-sm">Product Code</FormLabel>
            <FormControl>
              <Input
                value={form.watch("productCode") ?? ""}
                readOnly
                placeholder="Auto-generated (ST...)"
              />
            </FormControl>
            <FormDescription>
              Auto-generated for bulk uploads. This value is read-only.
            </FormDescription>
            <FormMessage />
          </FormItem>

          <FormField
            control={control}
            name="isDraft"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Draft Product</FormLabel>
                <FormControl>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(field.value)}
                      onChange={(event) => field.onChange(event.target.checked)}
                    />
                    Keep hidden from storefront until details are finalized.
                  </label>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <FormLabel className="text-sm">Name*</FormLabel>
            <FormControl>
              <Input
                aria-invalid={!!form.formState.errors.name}
                placeholder="Type Product Name."
                {...register("name")}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          {!inBulkMode ? (
            <FormItem>
              <FormLabel className="text-sm">Slug*</FormLabel>
              <FormControl>
                <Input
                  defaultValue={product?.slug}
                  aria-invalid={!!form.formState.errors.slug}
                  placeholder="Type Product slug."
                  {...register("slug")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          ) : (
            <FormItem>
              <FormLabel className="text-sm">Slug</FormLabel>
              <FormControl>
                <Input
                  readOnly
                  value="Auto-generated: product-stXXXXXX"
                  aria-readonly
                />
              </FormControl>
              <FormDescription>
                Bulk mode auto-generates slug per product code.
              </FormDescription>
            </FormItem>
          )}

          <FormItem>
            <FormLabel className="text-sm">Description*</FormLabel>
            <FormControl>
              <Input
                defaultValue={product?.description || ""}
                aria-invalid={!!form.formState.errors.description}
                placeholder="Type a short description for the product.."
                {...register("description")}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          {/* <FormField
            control={form.control}
            name="featured"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                <FormControl>
                  <FormLabel>Featured*</FormLabel>
                  <Checkbox
                    defaultChecked={false}
                    checked={field.value || false}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>

                <FormDescription>
                  You can manage your mobile notifications in the{" "}
                </FormDescription>
              </FormItem>
            )}
          /> */}
          <Suspense>
            {data && data.collectionsCollection && (
              <FormField
                control={control}
                name={"collectionId"}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{"Collections"}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a collection" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {data.collectionsCollection.edges.map(
                          ({ node: collection }) => (
                            <SelectItem
                              value={collection.id}
                              key={collection.id}
                            >
                              {collection.label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {"Select a Collection for the products."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </Suspense>

          <BadgeSelectField name="badge" label={""} />

          <FormItem>
            <FormLabel className="text-sm">Rating*</FormLabel>
            <FormControl>
              <Input
                defaultValue={product?.rating}
                aria-invalid={!!form.formState.errors.rating}
                placeholder="Rating (0-5)."
                {...register("rating")}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          <FormItem>
            <FormLabel className="text-sm">Tags</FormLabel>
            <FormControl>
              <TagsField name={"tags"} defaultValue={product?.tags || []} />
            </FormControl>
            <FormMessage />
          </FormItem>

          <FormItem>
            <FormLabel className="text-sm">Price*</FormLabel>
            <FormControl>
              <Input
                defaultValue={product?.price}
                aria-invalid={!!form.formState.errors.price}
                placeholder="Price in ₹ (e.g. 1299)"
                {...register("price")}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          <FormItem>
            <FormLabel className="text-sm">Stock</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={0}
                defaultValue={product?.stock ?? undefined}
                aria-invalid={!!form.formState.errors.stock}
                placeholder={
                  stockControl.enabled
                    ? "Stock quantity (default 1 for new product)"
                    : "Stock quantity"
                }
                {...register("stock", { valueAsNumber: true })}
              />
            </FormControl>
            <FormDescription>
              {stockControl.enabled
                ? `Low-stock notice appears below ${stockControl.lowStockThreshold}.`
                : "Stock control is disabled; storefront behavior remains unchanged."}
            </FormDescription>
            <FormMessage />
          </FormItem>

          <FormItem>
            <FormLabel className="text-sm">Enable Size</FormLabel>
            <FormControl>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={sizeConfig.enabled}
                  onChange={(event) =>
                    setSizeConfig((prev) => ({
                      ...prev,
                      enabled: event.target.checked,
                      options:
                        event.target.checked &&
                        !hasAnySizeOptionConfigured(prev.options)
                          ? DEFAULT_SIZE_OPTIONS
                          : prev.options,
                    }))
                  }
                />
                Allow customers to select available sizes.
              </label>
            </FormControl>
            <FormDescription>
              Size label supports up to 8 characters. Leave label empty to show
              only the number.
            </FormDescription>
          </FormItem>

          {sizeConfig.enabled ? (
            <FormItem>
              <FormLabel className="text-sm">Size options</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  {sizeConfig.options.map((option, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[1fr,1fr,auto] gap-2"
                    >
                      <Input
                        value={option.size}
                        maxLength={8}
                        placeholder="Size (e.g. 6.2 / S / XL)"
                        onChange={(event) =>
                          updateSizeOption(
                            index,
                            "size",
                            event.target.value.trimStart().toUpperCase(),
                          )
                        }
                      />
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={option.qty}
                        placeholder="Value / Stock (e.g. 32 or 6.2)"
                        onChange={(event) =>
                          updateSizeOption(
                            index,
                            "qty",
                            event.target.value.replace(/[^0-9.]/g, ""),
                          )
                        }
                        onBlur={(event) =>
                          updateSizeOption(
                            index,
                            "qty",
                            String(normalizeSizeQtyInput(event.target.value)),
                          )
                        }
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => removeSizeOption(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addSizeOption}
                  >
                    Add size
                  </Button>
                </div>
              </FormControl>
            </FormItem>
          ) : null}

          {inBulkMode ? (
            <FormItem>
              <FormLabel>Bulk Images*</FormLabel>
              <FormControl>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isPending || bulkPhase === "preparing"}
                      onClick={() => setIsMediaDialogOpen(true)}
                    >
                      Add from Media Library
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isPending || bulkPhase === "preparing"}
                      onClick={() => localFileInputRef.current?.click()}
                    >
                      Upload from Computer
                    </Button>
                  </div>

                  <input
                    ref={localFileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const selected = Array.from(event.target.files ?? []);
                      void addLocalFiles(selected);
                      event.currentTarget.value = "";
                    }}
                  />
                </div>
              </FormControl>
              <FormDescription>
                Select up to {MAX_BULK_FILES} images. Each image becomes one
                product using the shared details above. Max {UPLOAD_LIMIT_MB} MB
                per image; uploads go directly to storage, then are optimized on
                the server.
              </FormDescription>
              <FormMessage />
              <p className="text-xs text-muted-foreground">
                Selected images: {totalBulkImages} (Media:{" "}
                {selectedMediaIds.length}, Computer: {bulkFiles.length})
                {totalBulkImages > MAX_BULK_FILES
                  ? ` (maximum ${MAX_BULK_FILES}; remove some files)`
                  : ""}
              </p>
              {bulkPhase === "preparing" || (isPending && inBulkMode) ? (
                <AdminLoadingState
                  message={
                    bulkPhase === "preparing"
                      ? `Preparing images... ${prepareProgress?.current ?? 0}/${prepareProgress?.total ?? 0}`
                      : bulkProgress?.message ?? "Creating products..."
                  }
                />
              ) : null}

              {selectedMediaIds.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium">From Media Library</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedMediaIds.map((mediaId) => (
                      <button
                        key={mediaId}
                        type="button"
                        className="rounded border px-2 py-1 text-xs hover:bg-muted"
                        onClick={() => toggleSelectedMediaId(mediaId)}
                        title="Remove from selection"
                      >
                        {mediaId}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {bulkFiles.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium">From Computer</p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {bulkFiles.map((file) => (
                      <div
                        key={`${file.name}:${file.size}:${file.lastModified}`}
                        className="flex items-center justify-between gap-3 rounded border px-2 py-1"
                      >
                        <span className="truncate">{file.name}</span>
                        <button
                          type="button"
                          className="text-destructive"
                          disabled={isPending || bulkPhase === "preparing"}
                          onClick={() =>
                            setBulkFiles((prev) =>
                              prev.filter(
                                (item) =>
                                  !(
                                    item.name === file.name &&
                                    item.size === file.size &&
                                    item.lastModified === file.lastModified
                                  ),
                              ),
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </FormItem>
          ) : (
            <FormField
              control={form.control}
              name="featuredImageId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Featured Image*</FormLabel>
                  <Suspense>
                    <ImageDialog
                      defaultValue={product?.featuredImageId}
                      onChange={field.onChange}
                      value={field.value}
                    />
                  </Suspense>

                  <FormDescription>
                    Drag n Drop the image to above section or click the button
                    to select from Image gallery.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {inBulkMode ? (
            <Dialog
              open={isMediaDialogOpen}
              onOpenChange={setIsMediaDialogOpen}
            >
              <DialogContent className="max-w-[1080px] min-h-full md:min-h-[480px]">
                <DialogHeader>
                  <DialogTitle className="mb-5">
                    Select images from Media Library
                  </DialogTitle>
                </DialogHeader>
                <Suspense>
                  <UploadMediaContainer
                    onClickItemsHandler={toggleSelectedMediaId}
                    selectedImageIds={selectedMediaIds}
                  />
                </Suspense>
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-muted-foreground">
                    Selected from media: {selectedMediaIds.length}
                  </p>
                  <Button
                    type="button"
                    onClick={() => setIsMediaDialogOpen(false)}
                  >
                    Done
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : null}

          {bulkCreated.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Created products</h4>
              <ul className="space-y-1 text-sm">
                {bulkCreated.map((created) => (
                  <li key={created.id}>
                    <Link
                      href={`/admin/products/${created.id}`}
                      className="text-primary hover:underline"
                    >
                      {created.productCode} - {created.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {bulkErrors.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-destructive">
                Upload issues
              </h4>
              <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                {bulkErrors.map((error, index) => (
                  <li key={`${error}-${index}`}>{error}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {bulkFailures.length > 0 ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-sm font-medium text-destructive">
                {bulkFailures.length} file(s) still need upload
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Failed files remain in the Computer list. Fix or compress them,
                then click Create again to retry only those files.
              </p>
            </div>
          ) : null}
        </div>

        <div className="py-8 flex gap-x-5 items-center">
          <Button
            disabled={
              isPending ||
              bulkPhase === "preparing" ||
              (inBulkMode && !canSubmitBulk)
            }
            variant={"outline"}
            form="project-form"
          >
            <LoadingButtonLabel
              isLoading={isPending}
              loadingText={
                inBulkMode
                  ? "Creating bulk..."
                  : product
                    ? "Updating..."
                    : "Creating..."
              }
              idleText={
                product ? "Update" : inBulkMode ? "Create Bulk" : "Create"
              }
            />
          </Button>
          <Link href="/admin/products" className={buttonVariants()}>
            Cancel
          </Link>
        </div>
      </form>
    </Form>
  );
}

export default ProductFrom;

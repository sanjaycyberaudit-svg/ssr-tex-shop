"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

type CreatedDraftProduct = {
  id: string;
  productCode: string;
  name: string;
  slug: string;
};

type BulkDraftResponse = {
  message?: string;
  created: CreatedDraftProduct[];
  errors: string[];
};

const MAX_FILES = 50;

export function BulkDraftProductUpload() {
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [created, setCreated] = useState<CreatedDraftProduct[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const canSubmit = useMemo(
    () => !isSubmitting && files.length > 0 && files.length <= MAX_FILES,
    [isSubmitting, files.length],
  );

  const onUpload = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setCreated([]);
    setErrors([]);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const res = await fetch("/api/admin/products/bulk-draft", {
        method: "POST",
        body: formData,
      });
      const payload = (await res.json()) as BulkDraftResponse;

      setCreated(payload.created ?? []);
      setErrors(payload.errors ?? []);

      if (!res.ok && (payload.created?.length ?? 0) === 0) {
        throw new Error(payload.message || "Bulk upload failed");
      }

      toast({
        title: "Bulk upload finished",
        description: `${payload.created?.length ?? 0} draft products created.`,
      });
      setFiles([]);
    } catch (error) {
      toast({
        title: "Bulk upload failed",
        description: error instanceof Error ? error.message : "Please retry",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Bulk Upload Draft Products</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Upload up to {MAX_FILES} images. Each image creates one draft product
          with auto code like <span className="font-medium">ST000001</span>.
        </p>
        <Input
          type="file"
          multiple
          accept="image/*"
          onChange={(event) => {
            const selected = Array.from(event.target.files ?? []);
            setFiles(selected);
          }}
        />
        <p className="text-xs text-muted-foreground">
          Selected files: {files.length}
          {files.length > MAX_FILES
            ? ` (maximum ${MAX_FILES}; remove some files)`
            : ""}
        </p>

        <Button onClick={onUpload} disabled={!canSubmit}>
          {isSubmitting ? "Uploading..." : "Create Draft Products"}
        </Button>

        {created.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Created drafts</h4>
            <ul className="space-y-1 text-sm">
              {created.map((product) => (
                <li key={product.id}>
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="text-primary hover:underline"
                  >
                    {product.productCode} - {product.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {errors.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-destructive">
              Upload issues
            </h4>
            <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

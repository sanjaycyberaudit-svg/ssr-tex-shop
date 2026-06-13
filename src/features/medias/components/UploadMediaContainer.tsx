"use client";
import { Icons } from "@/components/layouts/icons";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { gql } from "@/gql";
import {
  UPLOAD_LIMIT_BYTES,
  uploadMediaFilesQueue,
} from "@/lib/admin/client-image-upload";
import { FileWithPreview } from "@/types";
import { useQuery } from "@urql/next";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { FileWithPath, useDropzone } from "react-dropzone";
import ImagesGrid from "./ImageGrid";
import ImageGridSkeleton from "./ImageGridSkeleton";

interface UploadMediaContainerProps {
  onClickItemsHandler: (mediaId: string) => void;
  defaultImageId?: string;
  selectedImageIds?: string[];
}

function UploadMediaContainer({
  onClickItemsHandler,
  defaultImageId,
  selectedImageIds,
}: UploadMediaContainerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [uploadingImages, setUploadingImages] = useState<FileWithPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const previewUrlsRef = useRef<string[]>([]);
  const [lastCursor, setLastCursor] = React.useState<string | undefined>(
    undefined,
  );
  const [{ data, fetching, error }, refetch] = useQuery({
    query: MediasPageContentQuery,
    variables: {
      first: 16,
      after: lastCursor,
    },
  });

  const medias = data?.mediasCollection;

  const openMediaDetails = (mediaId: string) => {
    router.push(`/admin/medias/${mediaId}`);
  };

  const onDrop = async (acceptedFiles: FileWithPath[]) => {
    if (acceptedFiles.length === 0 || isUploading) return;

    const uploadFiles = acceptedFiles.map((file) =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
      }),
    );
    previewUrlsRef.current.push(...uploadFiles.map((file) => file.preview));

    setUploadingImages((prev) => [...prev, ...uploadFiles]);
    setIsUploading(true);
    setUploadMessage(`Uploading 0/${acceptedFiles.length}...`);

    try {
      const result = await uploadMediaFilesQueue(acceptedFiles, {
        onProgress: (update) => {
          setUploadMessage(update.message);
        },
      });

      const uploadedNames = new Set(result.uploadedNames);
      if (uploadedNames.size > 0) {
        refetch({ requestPolicy: "network-only" });
        setUploadingImages((prev) =>
          prev.filter((item) => !uploadedNames.has(item.name)),
        );
      }

      const issueCount =
        result.validationErrors.length + result.failures.length;

      if (result.uploadedCount > 0) {
        toast({
          title: "Upload complete",
          description:
            issueCount > 0
              ? `${result.uploadedCount} uploaded, ${issueCount} failed or skipped.`
              : `${result.uploadedCount} image(s) uploaded.`,
        });
      } else {
        toast({
          title: "Upload failed",
          description:
            result.validationErrors[0]?.reason ??
            result.failures[0]?.reason ??
            "No images were uploaded.",
          variant: "destructive",
        });
      }

      if (issueCount > 0) {
        console.warn("[media-picker-upload] issues:", [
          ...result.validationErrors.map((entry) => entry.reason),
          ...result.failures.map((entry) => entry.reason),
        ]);
      }
    } catch (uploadError) {
      toast({
        title: "Upload failed",
        description:
          uploadError instanceof Error
            ? uploadError.message
            : "Please retry.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadMessage(null);
    }
  };

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current = [];
    };
  }, []);

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    maxSize: UPLOAD_LIMIT_BYTES,
    multiple: true,
    disabled: isUploading,
    onDrop,
    noClick: true,
    noKeyboard: true,
  });

  return (
    <div>
      {error && <p>Oh no... {error.message}</p>}

      {uploadMessage ? (
        <p className="mb-2 text-xs text-muted-foreground">{uploadMessage}</p>
      ) : null}

      {fetching && <ImageGridSkeleton />}

      {medias && (
        <>
          <div className="border border-dot border-zinc-300 p-5">
            <div {...getRootProps()} className="dropzone-container">
              <ImagesGrid
                medias={medias.edges}
                AddMediaButtonComponent={
                  <AddMediaButtonComponent open={open} disabled={isUploading} />
                }
                uploadingFiles={uploadingImages}
                onClickHandler={onClickItemsHandler}
                defaultImageId={defaultImageId}
                selectedImageIds={selectedImageIds}
              />

              {medias.pageInfo.hasNextPage ? (
                <div className="flex justify-center content-center">
                  <Button
                    onClick={() => {
                      setLastCursor(medias.pageInfo.endCursor ?? undefined);
                    }}
                  >
                    Load more.
                  </Button>
                </div>
              ) : null}

              <input {...getInputProps()} />
              {isDragActive ? (
                <div className="w-full h-full min-h-[320px] flex items-center justify-center z-50">
                  Drop the Image here to upload the image.
                </div>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const AddMediaButtonComponent = ({
  open,
  disabled,
}: {
  open: () => void;
  disabled?: boolean;
}) => {
  return (
    <button
      onClick={open}
      disabled={disabled}
      className=" h-[120px] w-[120px] border-2 border-dashed border-zinc-400 text-zinc-400 flex flex-col justify-center items-center disabled:opacity-50"
    >
      <Icons.add size={32} />
    </button>
  );
};

export default UploadMediaContainer;

export const MediasPageContentQuery = gql(/* GraphQL */ `
  query MediasPageContentQuery($first: Int, $after: Cursor) {
    mediasCollection(
      first: $first
      after: $after
      orderBy: [{ created_at: DescNullsLast }]
    ) {
      __typename
      edges {
        node {
          id
          key
          alt
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        endCursor
      }
    }
  }
`);

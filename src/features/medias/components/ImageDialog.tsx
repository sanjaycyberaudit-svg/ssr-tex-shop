"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import ImagePreviewCard from "@/features/medias/components/ImagePreviewCard";
import React, { Suspense } from "react";
import UploadMediaContainer from "./UploadMediaContainer";
import { useFormField } from "@/components/ui/form";
import { useFieldArray, useFormContext } from "react-hook-form";

type Props = {
  onChange: (data: string) => void;
  defaultValue?: string;
  multiple?: boolean;
  modalOpen?: boolean;
  value?: string;
};

function ImageDialog({
  modalOpen = false,
  onChange,
  value,
  defaultValue,
}: Props) {
  const [dialogOpen, setDialogOpen] = React.useState(modalOpen);
  // const { control, setError, getValues, setValue } = useFormContext()
  // const { fields, remove, append, update, move, swap } = useFieldArray({
  //   control,
  //   name: "",
  // })
  const onClickHandler = (mediaId: string) => {
    onChange(mediaId);
    setDialogOpen(false);
  };

  return (
    <div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger>
          <div>
            {value ? (
              <ImagePreviewCard
                key={value}
                onClick={() => {}}
                mediaId={value}
              />
            ) : (
              "Select / Add Image"
            )}
          </div>
        </DialogTrigger>

        <DialogContent className="flex max-h-[90vh] max-w-[1080px] flex-col overflow-hidden sm:max-w-[1080px]">
          <DialogHeader className="shrink-0">
            <DialogTitle>Image Gallery</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-hidden">
            <Suspense>
              <UploadMediaContainer
                onClickItemsHandler={onClickHandler}
                defaultImageId={defaultValue}
              />
            </Suspense>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ImageDialog;

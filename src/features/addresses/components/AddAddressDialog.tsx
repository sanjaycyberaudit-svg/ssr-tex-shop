"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddAddressForm } from "./AddAddressForm";
import type { AddressFormValues } from "../validations/addressFormSchema";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AddressFormValues) => Promise<void>;
  submitLabel?: string;
  defaultValues?: Partial<AddressFormValues>;
  persistDraft?: boolean;
};

export function AddAddressDialog({
  open,
  onOpenChange,
  onSubmit,
  submitLabel,
  defaultValues,
  persistDraft = false,
}: Props) {
  const handleSubmit = async (values: AddressFormValues) => {
    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch {
      /* Parent shows toast; keep dialog open for corrections */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(92vh,720px)] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-semibold sm:text-xl">
            Add New Address
          </DialogTitle>
        </DialogHeader>
        <AddAddressForm
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          submitLabel={submitLabel}
          defaultValues={defaultValues}
          persistDraft={persistDraft}
          dialogOpen={open}
        />
      </DialogContent>
    </Dialog>
  );
}

export default AddAddressDialog;

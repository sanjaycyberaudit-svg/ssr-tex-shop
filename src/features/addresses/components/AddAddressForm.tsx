"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  mergeCheckoutAddressDefaults,
  saveCheckoutAddressDraft,
} from "../lib/checkoutAddressDraft";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { INDIAN_STATES } from "../constants/indianStates";
import {
  addressFormSchema,
  type AddressFormValues,
} from "../validations/addressFormSchema";

type Props = {
  onSubmit: (values: AddressFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  defaultValues?: Partial<AddressFormValues>;
  /** Remember fields in localStorage until checkout completes (survives refresh). */
  persistDraft?: boolean;
  /** When the parent dialog opens, reload any saved draft. */
  dialogOpen?: boolean;
};

function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <span>
      {children}
      <span className="text-destructive" aria-hidden="true">
        {" "}
        *
      </span>
    </span>
  );
}

export function AddAddressForm({
  onSubmit,
  onCancel,
  submitLabel = "Add Address",
  defaultValues,
  persistDraft = false,
  dialogOpen = true,
}: Props) {
  const initialValues = useMemo(
    () =>
      persistDraft
        ? mergeCheckoutAddressDefaults(defaultValues)
        : {
            fullName: "",
            email: "",
            mobile: "",
            line1: "",
            line2: "",
            city: "",
            state: "",
            postal_code: "",
            ...defaultValues,
          },
    [persistDraft, defaultValues],
  );

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: initialValues,
  });

  const isSubmitting = form.formState.isSubmitting;
  const [statePickerOpen, setStatePickerOpen] = useState(false);
  const normalizeStateValue = (value: string) =>
    value.toLowerCase().replace(/\s+/g, " ").trim();

  const wasDialogOpen = useRef(false);
  useEffect(() => {
    const justOpened = dialogOpen && !wasDialogOpen.current;
    wasDialogOpen.current = dialogOpen;

    if (!persistDraft || !justOpened) return;
    form.reset(mergeCheckoutAddressDefaults(defaultValues));
  }, [persistDraft, dialogOpen, defaultValues, form]);

  useEffect(() => {
    if (!persistDraft) return;

    const subscription = form.watch((values) => {
      saveCheckoutAddressDraft(values as AddressFormValues);
    });

    return () => subscription.unsubscribe();
  }, [form, persistDraft]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-3 sm:space-y-4"
        noValidate
      >
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <RequiredLabel>Full Name</RequiredLabel>
              </FormLabel>
              <FormControl>
                <Input placeholder="Enter full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <RequiredLabel>Email</RequiredLabel>
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Enter email"
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mobile"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <RequiredLabel>Mobile Number</RequiredLabel>
              </FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  inputMode="numeric"
                  placeholder="Enter mobile number"
                  autoComplete="tel"
                  maxLength={10}
                  {...field}
                  onChange={(e) => {
                    const digits = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 10);
                    field.onChange(digits);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="line1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <RequiredLabel>Address</RequiredLabel>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter address"
                  autoComplete="street-address"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="line2"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address Line 2</FormLabel>
                <FormControl>
                  <Input placeholder="Optional" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <RequiredLabel>City</RequiredLabel>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter city"
                    autoComplete="address-level2"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <RequiredLabel>State</RequiredLabel>
                </FormLabel>
                <Popover
                  open={statePickerOpen}
                  onOpenChange={setStatePickerOpen}
                >
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={statePickerOpen}
                        className={cn(
                          "w-full justify-between font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value || "Select state"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="z-[220] w-[var(--radix-popover-trigger-width)] p-0"
                  >
                    <Command>
                      <CommandInput placeholder="Search state..." />
                      <CommandList>
                        <CommandEmpty>No state found.</CommandEmpty>
                        <CommandGroup>
                          {INDIAN_STATES.map((state) => (
                            <CommandItem
                              key={state}
                              value={`${state} ${state.replace(/\s+/g, "")}`}
                              className="cursor-pointer"
                              onSelect={(selectedValue) => {
                                const normalizedSelected =
                                  normalizeStateValue(selectedValue);
                                const matchedState =
                                  INDIAN_STATES.find((candidate) =>
                                    normalizedSelected.includes(
                                      normalizeStateValue(candidate),
                                    ),
                                  ) ?? state;
                                field.onChange(matchedState);
                                setStatePickerOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  state === field.value
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              {state}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="postal_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <RequiredLabel>PIN Code</RequiredLabel>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="6-digit PIN code"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={6}
                    {...field}
                    onChange={(e) => {
                      const digits = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6);
                      field.onChange(digits);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="sticky bottom-0 -mx-4 flex flex-col-reverse gap-2 border-t bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-2 sm:backdrop-blur-none sm:flex-row sm:justify-end sm:gap-3">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="w-full bg-[#E8A317] text-[#1a1a1a] hover:bg-[#d49210] sm:w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                Saving…
                <Spinner className="ml-2 h-4 w-4" aria-hidden="true" />
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default AddAddressForm;

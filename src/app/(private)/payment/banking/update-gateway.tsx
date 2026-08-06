/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useUpdatePaymentMethodMutation } from "@/lib/features/paymentApiSlice";

interface UpdateGatewayModalProps {
  id: string;
  label?: {
    image?: string;
    name?: string;
    wallet?: string;
  };
  defaultValues: {
    maxDeposit?: string;
    minDeposit?: string;
    category?: string;
    rules?: string;
    isActive?: boolean;
    isRecommended?: boolean;
    currencyCode?: string;
    network?: string;
    address?: string;
  };
  children: React.ReactNode;
}

export function UpdateGatewayModal({
  id,
  defaultValues,
  children,
}: UpdateGatewayModalProps) {
  const [open, setOpen] = useState(false);
  const [updatePaymentMethod, { isLoading }] = useUpdatePaymentMethodMutation();

  const form = useForm({
    defaultValues: {
      minDeposit: defaultValues?.minDeposit ?? "",
      maxDeposit: defaultValues?.maxDeposit ?? "",
      category: defaultValues?.category ?? "MOBILE_BANKING",
      isActive: defaultValues?.isActive ?? true,
      isRecommended: defaultValues?.isRecommended ?? false,
      currencyCode: defaultValues?.currencyCode ?? "",
      network: defaultValues?.network ?? "",
      address: defaultValues?.address ?? "",
    },
  });

  const onSubmit = async (values: any) => {
    try {
      await updatePaymentMethod({ id, body: values }).unwrap();
      toast.success("Gateway updated successfully!");
      setOpen(false);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update gateway");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* DialogTrigger renders the children (<Button>Edit</Button>) */}
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="max-w-md bg-slate-900 text-white border-slate-800">
        <DialogHeader>
          <DialogTitle>Update Gateway</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Min Deposit */}
            <FormField
              control={form.control}
              name="minDeposit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Deposit</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g. 100"
                      className="bg-slate-800 border-slate-700"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Max Deposit */}
            <FormField
              control={form.control}
              name="maxDeposit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Deposit</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g. 10000"
                      className="bg-slate-800 border-slate-700"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Crypto Fields if Applicable */}
            {form.watch("category") === "CRYPTO" && (
              <div className="space-y-3 p-3 bg-slate-800/50 rounded-md border border-slate-700">
                <p className="text-xs font-semibold text-slate-400">
                  Crypto Details
                </p>
                <FormField
                  control={form.control}
                  name="currencyCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="USDT"
                          className="bg-slate-800 border-slate-700"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="network"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Network</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="TRC20"
                          className="bg-slate-800 border-slate-700"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deposit Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0x..."
                          className="bg-slate-800 border-slate-700"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Switches for Active and Recommended */}
            <div className="flex justify-between items-center pt-2">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer">Active</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isRecommended"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer">
                      Recommended
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full mt-4">
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

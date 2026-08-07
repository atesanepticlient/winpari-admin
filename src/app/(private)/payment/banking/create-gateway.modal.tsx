/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { IoMdAlert } from "react-icons/io";
import { toast } from "sonner";
import { INTERNAL_SERVER_ERROR } from "@/error";
import { walletCreateSchema, WalletCreateSchema } from "../../../../../schema";
import { useCreatePaymentMethodMutation } from "@/lib/features/paymentApiSlice";

interface CreateGatewayModalProps {
  children: React.ReactNode;
  defaultCategory?: "E_WALLET" | "CRYPTO" | "CARD";
}

export default function CreateGatewayModal({
  children,
  defaultCategory = "E_WALLET",
}: CreateGatewayModalProps) {
  const [open, setOpen] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [createGatewayApi, { isLoading: creating }] =
    useCreatePaymentMethodMutation();

  const form = useForm<WalletCreateSchema>({
    resolver: zodResolver(walletCreateSchema),
    defaultValues: {
      walletNumber: "",
      walletImage: "",
      walletName: "",
      isActive: false,
      minDeposit: 100,
      maxDeposit: 10000,
      minWithdraw: 100,
      maxWithdraw: 10000,
      currencyCode: "",
      network: "",
      address: "",
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    try {
      const timestamp = Math.floor(Date.now() / 1000);

      const signatureRes = await fetch("/api/sign-cloudinary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timestamp }),
      });

      if (!signatureRes.ok) {
        toast.error("Failed to prepare upload");
        return;
      }

      const { payload } = await signatureRes.json();
      const { signature, cloud_name, api_key } = payload;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", api_key);
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
        { method: "POST", body: formData },
      );

      const data = await uploadRes.json();

      if (!uploadRes.ok || !data.secure_url) {
        toast.error(data.error?.message || "Failed to upload image");
        return;
      }

      form.setValue("walletImage", data.secure_url, { shouldValidate: true });
      toast.success("Image uploaded");
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = (data: WalletCreateSchema) => {
    const asyncAction = async () => {
      const { currencyCode, network, address, ...rest } = data as any;

      const response = await createGatewayApi({
        ...rest,
        category: defaultCategory,
        ...(defaultCategory === "CRYPTO"
          ? {
              cryptoData: {
                currencyCode,
                network,
                address,
              },
            }
          : {}),
      }).unwrap();

      form.reset();
      setOpen(false);
      return response.success;
    };

    toast.promise(asyncAction(), {
      loading: "Creating gateway...",
      success: "Gateway created successfully",
      error: (err: any) =>
        err?.data?.error ? `Error: ${err.data.error}` : INTERNAL_SERVER_ERROR,
    });
  };

  const isLoading = imageUploading || creating;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create New Gateway ({defaultCategory})</DialogTitle>
        </DialogHeader>

        <Alert className="mb-2">
          <IoMdAlert className="h-4 w-4" />
          <AlertTitle>Note</AlertTitle>
          <AlertDescription>
            Gateway name and logo cannot be modified frequently once
            established.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="walletName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gateway Name</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isLoading}
                      placeholder="e.g. Bkash, Nagad, Binance Pay"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <Label htmlFor="file" className="mb-2 block">
                Gateway Logo
              </Label>
              <Input
                id="file"
                type="file"
                accept="image/*"
                disabled={isLoading}
                onChange={handleFileUpload}
              />
              {form.watch("walletImage") && (
                <p className="text-xs text-emerald-500 mt-1">
                  Logo uploaded successfully
                </p>
              )}
            </div>

            {defaultCategory !== "CRYPTO" && (
              <FormField
                control={form.control}
                name="walletNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wallet Number</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        placeholder="e.g. 01700000000"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Deposit limits */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="minDeposit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Deposit</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        disabled={isLoading}
                        placeholder="e.g. 100"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxDeposit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Deposit</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        disabled={isLoading}
                        placeholder="e.g. 10000"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Withdraw limits */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="minWithdraw"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Withdraw</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        disabled={isLoading}
                        placeholder="e.g. 500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxWithdraw"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Withdraw</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        disabled={isLoading}
                        placeholder="e.g. 50000"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Crypto fields — only relevant when this modal is opened for a CRYPTO gateway */}
            {defaultCategory === "CRYPTO" && (
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
                          disabled={isLoading}
                          placeholder="USDT"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
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
                          disabled={isLoading}
                          placeholder="TRC20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
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
                          disabled={isLoading}
                          placeholder="0x..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3 space-y-0">
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Switch
                      disabled={isLoading}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <span
                    className={`text-sm ${
                      field.value ? "text-emerald-500" : "text-slate-400"
                    }`}
                  >
                    {field.value ? "Active" : "Inactive"}
                  </span>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isLoading}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Create Gateway"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

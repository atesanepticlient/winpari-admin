/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink, Wallet, Gift } from "lucide-react";

import CookieLoader from "@/components/loader/cooki-loader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFetchSiteQuery } from "@/lib/features/siteApiSlice";
import {
  bonusSettingUpdateSchema,
  BonusSettingUpdateSchema,
} from "../../../../schema";
import { updateBonusSettingAction } from "@/action/site";

const SiteSettings = () => {
  const router = useRouter();
  const { data, isLoading } = useFetchSiteQuery();

  const bonusSetting = data?.payload?.bonusSetting;
  const depositWallets = data?.payload?.depositWallets || [];
  const withdrawWallets = data?.payload?.withdrawWallets || [];

  const form = useForm<BonusSettingUpdateSchema>({
    resolver: zodResolver(bonusSettingUpdateSchema),
    defaultValues: {
      firstPayin: 0,
      firstPayinUpTo: 0,
      referPayin: 0,
      referPayinUpTo: 0,
      inviationCode: 0,
      inviationCodeUpTo: 0,
    },
  });

  // Load and convert decimal percentage values (0.10 -> 10%)
  useEffect(() => {
    if (bonusSetting) {
      form.reset({
        firstPayin: Number(bonusSetting.firstPayin) * 100 || 0,
        firstPayinUpTo: Number(bonusSetting.firstPayinUpTo) || 0,
        referPayin: Number(bonusSetting.referPayin) * 100 || 0,
        referPayinUpTo: Number(bonusSetting.referPayinUpTo) || 0,
        inviationCode: Number(bonusSetting.inviationCode) * 100 || 0,
        inviationCodeUpTo: Number(bonusSetting.inviationCodeUpTo) || 0,
      });
    }
  }, [bonusSetting, form]);

  const handleSubmit = (values: BonusSettingUpdateSchema) => {
    // Transform percentage entries back to decimals before sending (10% -> 0.10)
    const formattedData = {
      ...values,
      firstPayin: values.firstPayin / 100,
      referPayin: values.referPayin / 100,
      inviationCode: values.inviationCode / 100,
    };

    const asyncAction = async () => {
      const response = await updateBonusSettingAction(formattedData);
      if (response?.error || !response?.success) {
        throw new Error(response?.error || "Failed to update bonus settings.");
      }
      return true;
    };

    toast.promise(asyncAction(), {
      loading: "Saving Bonus Settings...",
      success: "Bonus Settings Updated!",
      error: (error: any) => error.message,
    });
  };

  if (isLoading || !data) {
    return (
      <div className="flex h-[85vh] w-full items-center justify-center">
        <CookieLoader />
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-4 max-w-4xl">
      {/* BONUS SETTINGS FORM */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Gift className="h-5 w-5 text-primary" />
            Bonus Settings
          </CardTitle>
          <CardDescription>
            Configure deposit and referral bonus percentages and upper payout
            caps.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Payin */}
                <FormField
                  control={form.control}
                  name="firstPayin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Deposit Bonus (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Ex: 10"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="firstPayinUpTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Deposit Bonus Limit (Up To)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Ex: 1000"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Referral Payin */}
                <FormField
                  control={form.control}
                  name="referPayin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referral Bonus (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Ex: 5"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="referPayinUpTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referral Bonus Limit (Up To)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Ex: 500" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Invitation Code */}
                <FormField
                  control={form.control}
                  name="inviationCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invitation Code Bonus (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Ex: 2"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="inviationCodeUpTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invitation Code Limit (Up To)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Ex: 200" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit">Save Bonus Settings</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* READ-ONLY WALLET LIMITS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Deposit Wallets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wallet className="h-4 w-4 text-emerald-500" /> Deposit Wallets
              </CardTitle>
              <CardDescription>Read-only dynamic limits</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/payment/banking")}
              className="gap-1"
            >
              Manage <ExternalLink className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {depositWallets.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active deposit wallets.
              </p>
            ) : (
              depositWallets.map((wallet: any) => (
                <div
                  key={wallet.id}
                  className="flex items-center justify-between border-b pb-2 text-sm"
                >
                  <span className="font-medium">{wallet.walletName}</span>
                  <span className="text-muted-foreground">
                    Min: {Number(wallet.minDeposit)} | Max:{" "}
                    {Number(wallet.maxDeposit)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
          <CardFooter className="bg-muted/30 pt-3 text-xs text-muted-foreground">
            To update deposit limits or wallets, visit the Deposit Management
            page.
          </CardFooter>
        </Card>

        {/* Withdraw Wallets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wallet className="h-4 w-4 text-rose-500" /> Withdraw Wallets
              </CardTitle>
              <CardDescription>Read-only dynamic limits</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/payment/banking")}
              className="gap-1"
            >
              Manage <ExternalLink className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {withdrawWallets.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active withdraw wallets.
              </p>
            ) : (
              withdrawWallets.map((wallet: any) => (
                <div
                  key={wallet.id}
                  className="flex items-center justify-between border-b pb-2 text-sm"
                >
                  <span className="font-medium">{wallet.walletName}</span>
                  <span className="text-muted-foreground">
                    Min: {Number(wallet.minWithdraw)} | Max:{" "}
                    {Number(wallet.maxWithdraw)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
          <CardFooter className="bg-muted/30 pt-3 text-xs text-muted-foreground">
            To update withdraw limits or wallets, visit the Withdraw Management
            page.
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default SiteSettings;

/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { updateSiteAction } from "@/action/site";
import CookieLoader from "@/components/loader/cooki-loader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { siteUpdateSchema, SiteUpdateSchema } from "@/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const Site = () => {
  const { data, isLoading } = useFetchSiteQuery();
  const site = data?.payload;

  const form = useForm<SiteUpdateSchema>({
    defaultValues: {
      firstDepositBonus: "",
      maxAgWithdraw: "",
      maxWithdraw: "",
      minAgWithdraw: "",
      minWithdraw: "",
      referBonuseMainUser: "",
      referBonuseRefererUser: "",
      turnover: "",
      maxAgentPayout: "",
      minAgentPayout: "",
      agentDepositEarning: "",
      agentWithdrawEarning: "",
      maxAgDeposit: "",
      minAgDeposit: "",
      minAgentSecurityMoney: "",
    },
    resolver: zodResolver(siteUpdateSchema),
  });

  const handleSubmit = (data: SiteUpdateSchema) => {
    const asyncAction = async () => {
      const response = await updateSiteAction(data);
      if (response.error || !response.success) {
        throw new Error("Failed to update site info.");
      }
      return true;
    };

    toast.promise(asyncAction(), {
      loading: "Saving...",
      success: () => "Site Updated",
      error: (error: any) => {
        return error.message;
      },
    });
  };

  useEffect(() => {
    if (site) {
      form.reset({
        firstDepositBonus: site.firstDepositBonus?.toString() || "",
        maxAgWithdraw: site.maxAgWithdraw?.toString() || "",
        maxWithdraw: site.maxWithdraw?.toString() || "",
        minAgWithdraw: site.minAgWithdraw?.toString() || "",
        minWithdraw: site.minWithdraw?.toString() || "",
        maxAgDeposit: site.maxAgDeposit?.toString() || "",
        minAgDeposit: site.minAgDeposit?.toString() || "",
        referBonuseMainUser: site.referBonuseMainUser?.toString() || "",
        referBonuseRefererUser: site.referBonuseRefererUser?.toString() || "",
        turnover: site.turnover?.toString() || "",
        maxAgentPayout: site.maxAgentPayout?.toString() || "",
        minAgentPayout: site.minAgentPayout?.toString() || "",
        agentDepositEarning: site.agentDepositEarning?.toString() || "",
        agentWithdrawEarning: site.agentWithdrawEarning?.toString() || "",
        minAgentSecurityMoney: site.minAgentSecurityMoney?.toString() || "",
      });
    }
  }, [site]);

  return (
    <div>
      {(!site || isLoading) && (
        <div className="flex w-full h-[85vh] justify-center items-center">
          <CookieLoader />
        </div>
      )}
      {site && !isLoading && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <Card className="w-[300px] md:w-[350px] lg:w-[420px]">
              <CardHeader>
                <CardTitle className="text-lg">Site</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-end">
                  <span className="text-sm">
                    <b>User</b>
                  </span>
                </div>
                <FormField
                  control={form.control}
                  name="minWithdraw"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Min Withdraw</FormLabel>
                      <div>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            className="w-[100px]"
                            placeholder="Ex:100"
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxWithdraw"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Max Withdraw</FormLabel>
                      <div>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            className="w-[100px]"
                            placeholder="Ex:100"
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minAgDeposit"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Min Agent Deposit</FormLabel>
                      <div>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            className="w-[100px]"
                            placeholder="Ex:100"
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxAgDeposit"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Max Agent Deposit</FormLabel>
                      <div>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            className="w-[100px]"
                            placeholder="Ex:100"
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minAgWithdraw"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Min Agent Withdraw </FormLabel>
                      <div>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            className="w-[100px]"
                            placeholder="Ex:100"
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxAgWithdraw"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Max Agent Withdraw </FormLabel>
                      <div>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            className="w-[100px]"
                            placeholder="Ex:100"
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="turnover"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Deposit Turnover [X]</FormLabel>
                      <div>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            className="w-[100px]"
                            placeholder="Ex:10%"
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="referBonuseMainUser"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Refer Bonus </FormLabel>
                      <div>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            className="w-[100px]"
                            placeholder="Ex:100"
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="referBonuseRefererUser"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Referrer User Bonus </FormLabel>
                      <div>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            className="w-[100px]"
                            placeholder="Ex:100"
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="firstDepositBonus"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Fisrt Deposit Bonus [%]</FormLabel>
                      <div>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            className="w-[100px]"
                            placeholder="Ex:10%"
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <span className="text-sm">
                    <b>Agent</b>
                  </span>
                </div>
                <FormField
                  control={form.control}
                  name="minAgentPayout"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Minimum Agent Payout</FormLabel>
                      <div>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            className="w-[100px]"
                            placeholder="Ex:100"
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxAgentPayout"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Maximum Agent Payout</FormLabel>
                      <div>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            className="w-[100px]"
                            placeholder="Ex:100"
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="agentDepositEarning"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Deposit Commission [%]</FormLabel>
                      <div>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            className="w-[100px]"
                            placeholder="Ex:10%"
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="agentWithdrawEarning"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Withdraw Commission [%]</FormLabel>
                      <div>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            className="w-[100px]"
                            placeholder="Ex:10%"
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minAgentSecurityMoney"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Agent Security Money</FormLabel>
                      <div>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            className="w-[100px]"
                            placeholder="Ex:10000"
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit">Save</Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      )}
    </div>
  );
};

export default Site;

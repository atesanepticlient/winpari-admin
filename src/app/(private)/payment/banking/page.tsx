/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import CookieLoader from "@/components/loader/cooki-loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useDeletePaymentMethodMutation,
  useFetchPaymentMethosQuery,
} from "@/lib/features/paymentApiSlice";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CreateGatewayModal from "./create-gateway.modal";
import { toast } from "sonner";
import { INTERNAL_SERVER_ERROR } from "@/error";
import { UpdateGatewayModal } from "./update-gateway";

export default function Methods() {
  const { data, isLoading } = useFetchPaymentMethosQuery();
  console.log({ data });
  const [deleteWalletApi] = useDeletePaymentMethodMutation();

  const allMethods: any[] = React.useMemo(() => {
    if (!data?.payload) return [];
    if (Array.isArray(data.payload)) return data.payload;
    if (Array.isArray(data.payload?.methods)) {
      return data.payload.methods.flatMap((m: any) => m.methodData || []);
    }
    return [];
  }, [data]);

  // 1. E-Wallets: MOBILE_BANKING enum OR missing category
  const eWallets = React.useMemo(() => {
    return allMethods.filter(
      (m) =>
        m.category === "MOBILE_BANKING" ||
        m.category === "E_WALLET" ||
        !m.category,
    );
  }, [allMethods]);

  // 2. Crypto Wallets: CRYPTO enum
  const cryptoWallets = React.useMemo(() => {
    return allMethods.filter((m) => m.category === "CRYPTO");
  }, [allMethods]);

  const getActiveCount = (methods: any[]) =>
    methods.filter((item) => item.isActive).length;

  const handleDelete = (id: string) => {
    if (!window.confirm("Are you sure you want to delete this gateway?"))
      return;

    const asyncAction = async () => {
      const response = await deleteWalletApi({ id }).unwrap();
      return response.success;
    };

    toast.promise(asyncAction(), {
      loading: "Deleting...",
      success: "Gateway Deleted",
      error: (error: any) =>
        error?.data?.error
          ? `Error: ${error.data.error}`
          : INTERNAL_SERVER_ERROR,
    });
  };

  const renderStatisticsBar = (methods: any[]) => {
    const totalCount = methods.length;
    const activeCount = getActiveCount(methods);
    const inactiveCount = totalCount - activeCount;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Gateways
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Active Gateways
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Inactive Gateways
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {inactiveCount}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderTable = (methods: any[]) => {
    if (methods.length === 0) {
      return (
        <div className="text-center py-8 text-slate-400">No Gateways Found</div>
      );
    }

    return (
      <div className="rounded-md border border-slate-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Configuration</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {methods.map((gateway: any) => {
              // Configuration check matches Prisma DepositEWallet fields
              const isConfigured =
                gateway.minDeposit != null && gateway.maxDeposit != null;

              return (
                <TableRow key={gateway.id}>
                  <TableCell>
                    <img
                      src={gateway.walletImage || "/placeholder.png"}
                      alt={gateway.walletName}
                      className="w-10 h-10 object-contain rounded-md bg-slate-800 p-1"
                    />
                  </TableCell>
                  <TableCell className="font-medium capitalize">
                    {gateway.walletName}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-sm font-semibold ${
                        gateway.isActive ? "text-emerald-500" : "text-red-500"
                      }`}
                    >
                      {gateway.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        isConfigured
                          ? "bg-green-500/10 text-green-500 border-green-500/20"
                          : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                      }
                    >
                      {isConfigured ? "Ready" : "Action Required"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <UpdateGatewayModal
                        label={{
                          image: gateway.walletImage,
                          name: gateway.walletName,
                          wallet: gateway.walletName,
                        }}
                        defaultValues={{
                          maxDeposit: gateway.maxDeposit?.toString() ?? "",
                          minDeposit: gateway.minDeposit?.toString() ?? "",
                          maxWithdraw:
                            gateway.withdrawWallet?.maxWithdraw?.toString() ??
                            "",
                          minWithdraw:
                            gateway.withdrawWallet?.minWithdraw?.toString() ??
                            "",
                          category: gateway.category ?? "MOBILE_BANKING",
                          isActive: Boolean(gateway.isActive),
                          isRecommended: Boolean(gateway.isRecommended),
                          currencyCode:
                            gateway.cryptoWallet?.currencyCode ?? "",
                          network: gateway.cryptoWallet?.network ?? "",
                          address: gateway.cryptoWallet?.address ?? "",
                        }}
                        id={gateway.id}
                      >
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </UpdateGatewayModal>
                
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(gateway.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  if (isLoading) return <CookieLoader />;

  return (
    <div className="container mx-auto p-4 md:p-8 grid gap-6">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold text-white">Banking & Gateways</h1>
      </div>

      <Tabs defaultValue="e-wallet" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="e-wallet">E-Wallets</TabsTrigger>
          <TabsTrigger value="crypto">Crypto</TabsTrigger>
          <TabsTrigger value="cards">Cards</TabsTrigger>
        </TabsList>

        <TabsContent value="e-wallet">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">E-Wallet Gateways</h2>
            <CreateGatewayModal defaultCategory="MOBILE_BANKING">
              <Button>Create E-Wallet</Button>
            </CreateGatewayModal>
          </div>
          {renderStatisticsBar(eWallets)}
          {renderTable(eWallets)}
        </TabsContent>

        <TabsContent value="crypto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Crypto Gateways</h2>
            <CreateGatewayModal defaultCategory="CRYPTO">
              <Button>Create Crypto Gateway</Button>
            </CreateGatewayModal>
          </div>
          {renderStatisticsBar(cryptoWallets)}
          {renderTable(cryptoWallets)}
        </TabsContent>

        <TabsContent value="cards">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Card Gateways</h2>
            <CreateGatewayModal defaultCategory="CARD">
              <Button>Create Card Gateway</Button>
            </CreateGatewayModal>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

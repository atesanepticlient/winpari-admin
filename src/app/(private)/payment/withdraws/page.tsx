/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import moment from "moment";
import { format } from "date-fns";
import {
  useFetchWithdrawsQuery,
  useUpdateWithdrawMutation,
} from "@/lib/features/paymentApiSlice";
import CookieLoader from "@/components/loader/cooki-loader";
import { TableSkeletonLoader } from "@/components/loader/table-loader";
import { toast } from "sonner";
import { INTERNAL_SERVER_ERROR } from "@/error";
import { PaymentStatus } from "@prisma/client";

// Crypto amounts are in USD; mobile banking amounts are in the user's local
// wallet currency. Used to pick the right symbol wherever an amount renders.
const CURRENCY_SYMBOLS: Record<string, string> = {
  BDT: "৳",
  PKR: "₨",
  INR: "₹",
  USD: "$",
};
const getCurrencySymbol = (code?: string | null) =>
  CURRENCY_SYMBOLS[(code || "BDT").toUpperCase()] || `${code || "৳"} `;

const DepositsPage = () => {
  const [filter, setFilter] = useState({
    card: "",
    from: "",
    to: "",
    limit: 10,
    maxAmount: 25000,
    minAmount: 0,
    search: "",
    status: "ALL",
    page: 1,
  });

  const { data, isLoading, isFetching } = useFetchWithdrawsQuery(filter);
  const withdraws = data?.payload.withdraws || [];
  const totalFound = data?.payload.totalFound;

  const findPaymentWallets = () => {
    if (!withdraws) return [];
    const wallets: any[] = [];

    for (let i = 0; i < withdraws?.length; i++) {
      if (
        wallets.find(
          (wallet) =>
            withdraws[i]!.withdrawEWallet!.walletName.toLowerCase() ==
            wallet.walletName.toLowerCase(),
        )
      ) {
        continue;
      } else {
        wallets.push({
          walletName: withdraws[i].withdrawEWallet?.walletName,
          walletImage: withdraws[i].withdrawEWallet?.walletImage,
        });
      }
    }

    return wallets;
  };
  const paymentWallets = findPaymentWallets();

  const [arrovalAPi, { isLoading: arrovalActionLoading }] =
    useUpdateWithdrawMutation();

  const handleArroval = (
    depositId: string,
    actionType: "accept" | "reject",
  ) => {
    const asyncAction = async () => {
      const response = await arrovalAPi({
        change: actionType,
        id: depositId,
        message: message,
      }).unwrap();
      return response.message;
    };

    toast.promise(asyncAction(), {
      loading: "Updating...",
      success: (message) => message,
      error: (error: any) => {
        if (error?.data?.error) {
          return `Error: ${error.data.error}`;
        } else {
          return INTERNAL_SERVER_ERROR;
        }
      },
    });
  };

  const handleChangeFilterValues = (name: string, value: any) => {
    setFilter((state) => ({ ...state, [name]: value }));
  };

  const [selectedWithdraw, setSelectedWithdraw] = useState<any | null>(null);
  const [message, setMessage] = useState(`   `);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Only crypto withdraws can be manually approved/rejected by an admin —
  // mobile banking (e-wallet) withdraws are view-only in this modal.
  const isCryptoWithdraw =
    selectedWithdraw?.withdrawEWallet?.category === "CRYPTO";
  const isActionable =
    isCryptoWithdraw && selectedWithdraw?.status === "PENDING";

  const handleViewDetails = (deposit: any) => {
    setSelectedWithdraw(deposit);
    setIsModalOpen(true);
  };

  const renderStatusBadge = (status: any) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>
        );
      case "ACCEPTED":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">Approved</Badge>
        );
      case "REJECTED":
        return <Badge className="bg-red-500 hover:bg-red-600">Rejected</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      handleChangeFilterValues("from", dateRange.from);
      handleChangeFilterValues("to", dateRange.to);
    }
  }, [dateRange]);

  useEffect(() => {
    if (selectedWithdraw) {
      setMessage(
        `${selectedWithdraw.amount} Your Withdraw was successfully added`,
      );
    }
  }, [selectedWithdraw]);

  const renderTableContent = () => {
    if (isFetching) return <TableSkeletonLoader />;
    return (
      <>
        <div className="overflow-x-auto border rounded-md">
          <Table className="  ">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px] ">ID</TableHead>
                <TableHead>Player ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Gateway</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdraws?.map((withdraw: any) => (
                <TableRow key={withdraw.id} className="">
                  <TableCell className="font-medium ">{withdraw.id}</TableCell>
                  <TableCell>{withdraw.user.playerId}</TableCell>
                  <TableCell>
                    {withdraw.withdrawEWallet?.category === "CRYPTO"
                      ? getCurrencySymbol("USD")
                      : getCurrencySymbol(withdraw.user?.wallet?.currencyCode)}
                    {+withdraw.amount}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center capitalize">
                      <img
                        src={withdraw.withdrawEWallet.walletImage}
                        alt={withdraw.withdrawEWallet.walletName}
                        className="w-[50px] mr-2"
                      />
                      {withdraw.withdrawEWallet.walletName}
                    </div>
                  </TableCell>
                  <TableCell>
                    {withdraw.withdrawEWallet?.category === "CRYPTO" ? (
                      <Badge variant="outline">Crypto</Badge>
                    ) : (
                      <Badge variant="secondary">Mobile Banking</Badge>
                    )}
                  </TableCell>
                  <TableCell>{moment(withdraw.createdAt).calendar()}</TableCell>
                  <TableCell>{renderStatusBadge(withdraw.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(withdraw)}
                      className="!rounded-button whitespace-nowrap cursor-pointer"
                    >
                      <i className="fas fa-eye mr-1"></i> View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {withdraws?.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-gray-500"
                  >
                    No deposits found matching your filters
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="px-6 py-4 flex items-center justify-between ">
          <div className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-medium">{withdraws?.length || 0}</span> of{" "}
            <span className="font-medium">{totalFound}</span> deposits
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={withdraws?.length == 0 || filter.page == 1}
              onClick={() => handleChangeFilterValues("page", filter.page - 1)}
              className="!rounded-button whitespace-nowrap cursor-pointer"
            >
              <i className="fas fa-chevron-left mr-1"></i> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={
                withdraws?.length == 0 ||
                Math.ceil(totalFound! / filter.limit) == filter.page
              }
              onClick={() => handleChangeFilterValues("page", filter.page + 1)}
              className="!rounded-button whitespace-nowrap cursor-pointer"
            >
              Next <i className="fas fa-chevron-right ml-1"></i>
            </Button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="container mx-auto ">
      <>
        {withdraws && !isLoading && (
          <div className="">
            <main className="max-w-7xl mx-auto">
              {/* Tabs and Data */}
              <div className=" shadow rounded-lg overflow-hidden">
                <div>
                  {/* Filters */}
                  <div className=" py-4  ">
                    <div className="flex gap-4">
                      <div>
                        <Label htmlFor="search" className="text-sm font-medium">
                          Search
                        </Label>
                        <div className="relative mt-1">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <i className="fas fa-search text-gray-400"></i>
                          </div>
                          <Input
                            id="search"
                            type="text"
                            placeholder="TRX ID, User ID..."
                            className="pl-10"
                            value={filter.search}
                            onChange={(e) =>
                              handleChangeFilterValues("search", e.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Label
                          htmlFor="date-range"
                          className="text-sm font-medium"
                        >
                          Date Range
                        </Label>
                        <Popover
                          open={isCalendarOpen}
                          onOpenChange={setIsCalendarOpen}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              id="date-range"
                              variant="outline"
                              className="w-full justify-start text-left font-normal mt-1 !rounded-button whitespace-nowrap cursor-pointer"
                            >
                              <i className="fas fa-calendar-alt mr-2 text-gray-400"></i>
                              {dateRange.from ? (
                                dateRange.to ? (
                                  <>
                                    {format(dateRange.from, "LLL dd, y")} -{" "}
                                    {format(dateRange.to, "LLL dd, y")}
                                  </>
                                ) : (
                                  format(dateRange.from, "LLL dd, y")
                                )
                              ) : (
                                <span>Pick a date range</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="range"
                              selected={dateRange}
                              onSelect={(range) => {
                                setDateRange(
                                  range as {
                                    from: Date | undefined;
                                    to: Date | undefined;
                                  },
                                );
                                if (range?.to) setIsCalendarOpen(false);
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div>
                        <Label
                          htmlFor="payment-gateway"
                          className="text-sm font-medium"
                        >
                          Payment Gateway
                        </Label>
                        <Select
                          value={filter.card}
                          onValueChange={(value) =>
                            handleChangeFilterValues("card", value)
                          }
                        >
                          <SelectTrigger id="payment-gateway" className="mt-1">
                            <SelectValue placeholder="All Gateways" />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentWallets?.map((pw, i) => (
                              <SelectItem
                                value={pw.walletName}
                                key={i}
                                className="capitalize"
                              >
                                {pw.walletName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label
                          htmlFor="payment-status"
                          className="text-sm font-medium"
                        >
                          Status
                        </Label>
                        <Select
                          value={filter.status}
                          onValueChange={(value) =>
                            handleChangeFilterValues("status", value)
                          }
                        >
                          <SelectTrigger id="payment-status" className="mt-1">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={"ALL"} className="capitalize">
                              All
                            </SelectItem>
                            <SelectItem
                              value={PaymentStatus.ACCEPTED}
                              className="capitalize"
                            >
                              Accepted
                            </SelectItem>
                            <SelectItem
                              value={PaymentStatus.REJECTED}
                              className="capitalize"
                            >
                              Rejected
                            </SelectItem>
                            <SelectItem
                              value={PaymentStatus.PENDING}
                              className="capitalize"
                            >
                              Pending
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label
                          htmlFor="amount-range"
                          className="text-sm font-medium"
                        >
                          Amount Range
                        </Label>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <Input
                            id="min-amount"
                            type="number"
                            placeholder="Min"
                            value={filter.minAmount}
                            onChange={(e) =>
                              handleChangeFilterValues(
                                "minAmount",
                                +e.target.value,
                              )
                            }
                            className="text-sm"
                          />
                          <Input
                            id="max-amount"
                            type="number"
                            placeholder="Max"
                            value={filter.maxAmount}
                            onChange={(e) =>
                              handleChangeFilterValues(
                                "maxAmount",
                                +e.target.value,
                              )
                            }
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>{renderTableContent()}</div>
                </div>
              </div>
            </main>

            {/* Deposit Details Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                  <DialogTitle>Deposit Details</DialogTitle>
                  <DialogDescription>
                    Transaction ID: {selectedWithdraw?.transactionId}
                  </DialogDescription>
                </DialogHeader>

                {selectedWithdraw && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">
                          Transaction Information
                        </h3>
                        <div className=" p-4 rounded-lg space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">
                              Amount:
                            </span>
                            <span className="text-sm font-medium">
                              {isCryptoWithdraw
                                ? getCurrencySymbol("USD")
                                : getCurrencySymbol(
                                    selectedWithdraw.user?.wallet?.currencyCode,
                                  )}
                              {+selectedWithdraw.amount}
                            </span>
                          </div>
                          {isCryptoWithdraw && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">
                                Converted (
                                {selectedWithdraw.walletCurrency ||
                                  selectedWithdraw.user?.wallet?.currencyCode ||
                                  "local"}
                                ):
                              </span>
                              <span className="text-sm font-medium">
                                {getCurrencySymbol(
                                  selectedWithdraw.walletCurrency ||
                                    selectedWithdraw.user?.wallet?.currencyCode,
                                )}
                                {selectedWithdraw.convertedAmount ?? "—"}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">
                              Status:
                            </span>
                            <span>
                              {renderStatusBadge(selectedWithdraw.status)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">
                              Timestamp:
                            </span>
                            <span className="text-sm font-medium">
                              {moment(selectedWithdraw.createdAt).calendar()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">
                          Payment Information
                        </h3>
                        <div className=" p-4 rounded-lg space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">
                              Payment Method:
                            </span>
                            <span className="text-sm font-medium">
                              {selectedWithdraw.withdrawEWallet.walletName}{" "}
                              <img
                                src={
                                  selectedWithdraw.withdrawEWallet.walletImage
                                }
                                alt={
                                  selectedWithdraw.withdrawEWallet.walletName
                                }
                                className="w-[50px]"
                              />
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">
                              Wallet Type
                            </span>
                            <span className="text-sm font-medium">
                              {isCryptoWithdraw ? "Crypto" : "Mobile Banking"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">
                              Account Details:
                            </span>
                            <span className="text-sm font-medium">
                              {selectedWithdraw.withdrawEWallet.walletNumber}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">
                          User Information
                        </h3>
                        <div className=" p-4 rounded-lg space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">
                              User ID:
                            </span>
                            <span className="text-sm font-medium">
                              {selectedWithdraw.userId}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">
                              Player Id:
                            </span>
                            <span className="text-sm font-medium">
                              {selectedWithdraw.user.playerId}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">
                              Email:
                            </span>
                            <span className="text-sm font-medium">
                              {selectedWithdraw.user.email}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">
                              Phone:
                            </span>
                            <span className="text-sm font-medium">
                              {selectedWithdraw.user.phone}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">
                              Wallet Currency:
                            </span>
                            <span className="text-sm font-medium">
                              {selectedWithdraw.user?.wallet?.currencyCode ||
                                "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">
                          Notes
                        </h3>
                        <div className="p-4 rounded-lg bg-input/30">
                          <p className="text-sm">
                            {isCryptoWithdraw
                              ? "Withdraw"
                              : "Mobile banking withdraws are processed automatically and shown here for reference only."}
                          </p>
                        </div>
                      </div>

                      {isActionable && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-2">
                            Message to User
                          </h3>
                          <Textarea
                            disabled={arrovalActionLoading}
                            placeholder="Enter a message to the user about this withdraw..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="resize-none"
                            rows={4}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
                  {isActionable ? (
                    <>
                      <Button
                        disabled={arrovalActionLoading}
                        variant="destructive"
                        onClick={() =>
                          handleArroval(selectedWithdraw.id, "reject")
                        }
                        className="!rounded-button whitespace-nowrap cursor-pointer"
                      >
                        <i className="fas fa-times-circle mr-2"></i>
                        Reject Deposit
                      </Button>
                      <Button
                        disabled={arrovalActionLoading}
                        onClick={() =>
                          handleArroval(selectedWithdraw.id, "accept")
                        }
                        className="bg-green-600 hover:bg-green-700 text-white !rounded-button whitespace-nowrap cursor-pointer"
                      >
                        <i className="fas fa-check-circle mr-2"></i>
                        Approve Deposit
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setIsModalOpen(false)}
                      className="ml-auto !rounded-button whitespace-nowrap cursor-pointer"
                    >
                      Close
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {(!withdraws || isLoading) && (
          <div className="flex w-full h-[85vh] justify-center items-center">
            <CookieLoader />
          </div>
        )}
      </>
    </div>
  );
};
export default DepositsPage;

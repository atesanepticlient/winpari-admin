/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import moment from "moment";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import CookieLoader from "@/components/loader/cooki-loader";
import SuspensionModal from "./suspension-modal";

import { INTERNAL_SERVER_ERROR } from "@/error";
import { userDelete } from "@/action/user";
import {
  useCreateMessageMutation,
  useFetchUserQuery,
} from "@/lib/features/userApiSlice";
import { createMessageSchema, CreateMessageSchema } from "@/schema";
import BettingHistoryModal from "../../BettingHistoryModal";

// Currency Symbol Helper Mapping
export const formatCurrency = (amount: number, code: string = "BDT") => {
  const currencySymbols: Record<string, string> = {
    BDT: "৳",
    INR: "₹",
    PKR: "₨",
    USD: "$",
    EUR: "€",
    GBP: "£",
    MYR: "RM",
    THB: "฿",
  };

  const symbol = currencySymbols[code.toUpperCase()] || code.toUpperCase();
  return `${symbol} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const Details = ({ id }: { id: string }) => {
  const { data, isLoading, isError, error } = useFetchUserQuery({ id });

  const user = data?.user;
  const financial = data?.financialOverview;
  const betting = data?.bettingStatistics;
  const currency = data?.currencyCode || user?.wallet?.currencyCode || "BDT";

  const [filterType, setFilterType] = useState<"ALL" | "DEPOSIT" | "WITHDRAW">(
    "ALL",
  );
  const [bettingTab, setBettingTab] = useState<"ALL" | "CASINO" | "SPORTS">(
    "ALL",
  );

  // State for Betting History Modal
  const [isBettingHistoryOpen, setIsBettingHistoryOpen] =
    useState<boolean>(false);

  const [createMessageApi, { isLoading: isSendingMsg }] =
    useCreateMessageMutation();

  const messageForm = useForm<CreateMessageSchema>({
    defaultValues: { id: "", message: "" },
    resolver: zodResolver(createMessageSchema),
  });

  useEffect(() => {
    if (user) {
      messageForm.reset({ id: user.id, message: "" });
    }
  }, [user]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard!`);
  };

  const handleSendMessage = async (formData: CreateMessageSchema) => {
    const asyncAction = async () => {
      const res = await createMessageApi({
        userId: formData.id,
        message: formData.message,
      }).unwrap();
      return res;
    };

    toast.promise(asyncAction(), {
      loading: "Dispatching inbox message...",
      success: () => {
        messageForm.reset({ id: user?.id || "", message: "" });
        return "System notification sent to user";
      },
      error: (err: any) =>
        err?.data?.error ? `Error: ${err.data.error}` : INTERNAL_SERVER_ERROR,
    });
  };

  const handleDelete = () => {
    if (!user?.id) return;
    if (
      window.confirm(
        `PERMANENT ACTION: Are you sure you want to delete Player ${user.playerId}?`,
      )
    ) {
      const asyncAction = async () => {
        const res = await userDelete(user.id);
        if (res.success) {
          window.location.href = "/users";
          return true;
        }
        throw new Error(res.error || "Failed to delete user");
      };

      toast.promise(asyncAction(), {
        loading: "Deleting account permanently...",
        error: (err) => `${err.message}`,
      });
    }
  };

  // Recharts Data Aggregations for Betting Chart Modal
  const categoryChartData = useMemo(() => {
    if (!betting?.categories) return [];
    return betting.categories.map((cat: any) => {
      const wagered = cat.totalWagered || 0;
      const returnAmount = cat.profitNLoss || 0;
      const netProfitLoss = returnAmount - wagered;

      return {
        name: cat.category || "OTHER",
        Wagered: wagered,
        Return: returnAmount,
        NetPnL: netProfitLoss,
        Count: cat.count,
      };
    });
  }, [betting]);

  const casinoVsSportsChartData = useMemo(() => {
    if (!betting) return [];
    const casinoWagered = betting.casino?.totalBet || 0;
    const casinoReturn = betting.casino?.pnl || 0;
    const casinoNetPnL = casinoReturn - casinoWagered;

    const sportsWagered = betting.sports?.totalBet || 0;
    const sportsWin = betting.sports?.totalWin || 0;
    const sportsNetPnL = sportsWin - sportsWagered;

    return [
      {
        name: "Casino",
        Wagered: casinoWagered,
        NetPnL: casinoNetPnL,
      },
      {
        name: "Sportsbook",
        Wagered: sportsWagered,
        NetPnL: sportsNetPnL,
      },
    ];
  }, [betting]);

  if (isLoading) {
    return (
      <div className="flex w-full h-[80vh] justify-center items-center">
        <CookieLoader />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="p-8 text-center bg-red-950/20 border border-red-900/50 rounded-2xl my-12">
        <h3 className="text-xl font-bold text-red-500 mb-2">
          User Profile Error
        </h3>
        <p className="text-slate-400">
          {(error as any)?.status === 404
            ? "Player ID not found in database."
            : "Unable to retrieve user metrics."}
        </p>
      </div>
    );
  }

  const activeTurnover = user.turnOver?.activeTurnOver || 0;
  const requiredTurnover = user.turnOver?.totalTurnOver || 1;
  const turnoverProgress = Math.min(
    100,
    Math.round((activeTurnover / (requiredTurnover || 1)) * 100),
  );

  const filteredTransactions = (data?.latestTransactions || []).filter(
    (tx: any) => filterType === "ALL" || tx.type === filterType,
  );

  return (
    <div className="space-y-8">
      {/* Top Header & Actions Toolbar */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-[#0d1527] p-6 rounded-2xl border border-slate-800/80 shadow-xl">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 border-2 border-blue-500/30">
            <AvatarFallback className="bg-blue-600/20 text-blue-400 text-xl font-bold">
              {user.playerId.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-white tracking-wide">
                {user.playerId}
              </h1>
              <Badge
                className={
                  user.isBanned
                    ? "bg-red-600/90 text-white"
                    : "bg-emerald-600/90 text-white"
                }
              >
                {user.isBanned ? "BANNED" : "ACTIVE"}
              </Badge>
              {user.getBouns && (
                <Badge
                  variant="outline"
                  className="border-amber-500/50 text-amber-400"
                >
                  Bonus Claimed
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Registered:{" "}
              {moment(user.createdAt).format("MMM DD, YYYY · HH:mm")} (
              {moment(user.createdAt).fromNow()})
            </p>
          </div>
        </div>

        {/* Quick Action Control Strip */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
          <Button
            onClick={() => setIsBettingHistoryOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold cursor-pointer"
          >
            Betting History
          </Button>

          <SuspensionModal id={user.id} currentStatus={user.isBanned}>
            <Button
              variant={user.isBanned ? "default" : "destructive"}
              className="cursor-pointer font-medium"
            >
              {user.isBanned ? "Unban Account" : "Ban Account"}
            </Button>
          </SuspensionModal>

          <Button
            variant="outline"
            onClick={() =>
              document
                .getElementById("notify-card")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-200 cursor-pointer"
          >
            Send Notification
          </Button>

          <Button
            variant="ghost"
            onClick={handleDelete}
            className="text-red-400 hover:text-red-300 hover:bg-red-950/30 cursor-pointer ml-auto xl:ml-0"
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="bg-[#0d1527] border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400 font-medium">
              Main Balance
            </CardDescription>
            <CardTitle className="text-2xl font-black text-blue-400">
              {formatCurrency(
                user.wallet ? Number(user.wallet.balance) : 0,
                currency,
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-400">
            {user.wallet?.hasInactive ? (
              <span className="text-amber-400">Wallet Inactive Flagged</span>
            ) : (
              <span className="text-emerald-400">Active & Operational</span>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#0d1527] border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400 font-medium">
              Bonus Wallet
            </CardDescription>
            <CardTitle className="text-2xl font-black text-amber-400">
              {formatCurrency(
                user.bonusWallet ? Number(user.bonusWallet.balance) : 0,
                currency,
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-400">
            Turnover Req:{" "}
            {formatCurrency(
              user.bonusWallet ? Number(user.bonusWallet.turnOver) : 0,
              currency,
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#0d1527] border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400 font-medium">
              Total Approved Deposits
            </CardDescription>
            <CardTitle className="text-2xl font-black text-emerald-400">
              {formatCurrency(financial?.totalDeposits || 0, currency)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-400">
            {financial?.depositCount} Total Approved Transactions
          </CardContent>
        </Card>

        <Card className="bg-[#0d1527] border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400 font-medium">
              Total Approved Withdrawals
            </CardDescription>
            <CardTitle className="text-2xl font-black text-purple-400">
              {formatCurrency(financial?.totalWithdraws || 0, currency)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-400">
            Net GGR:{" "}
            <span
              className={
                (financial?.netGGR || 0) >= 0
                  ? "text-emerald-400 font-bold"
                  : "text-red-400 font-bold"
              }
            >
              {formatCurrency(financial?.netGGR || 0, currency)}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Deep Information Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Identity Profile Side-Panel */}
        <Card className="bg-[#0d1527] border-slate-800 lg:col-span-1">
          <CardHeader className="border-b border-slate-800/80 pb-4">
            <CardTitle className="text-lg font-bold text-white">
              Identity & Credentials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6 text-sm">
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Email</span>
              <span className="font-mono text-slate-200">
                {user.email || "—"}
              </span>
            </div>
            <Separator className="bg-slate-800/60" />

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Phone</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-200">
                  {user.phone || "Unbound"}
                </span>
                {user.phoneVerified ? (
                  <Badge className="bg-emerald-950 text-emerald-400 border-emerald-800 text-[10px]">
                    VERIFIED
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-slate-500 border-slate-700 text-[10px]"
                  >
                    UNVERIFIED
                  </Badge>
                )}
              </div>
            </div>
            <Separator className="bg-slate-800/60" />

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Signup Method</span>
              <Badge
                variant="secondary"
                className="bg-slate-800 text-slate-300"
              >
                {user.signupMethod}
              </Badge>
            </div>
            <Separator className="bg-slate-800/60" />

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Country Code</span>
              <span className="font-bold text-blue-400">
                {user.country || "N/A"}
              </span>
            </div>
            <Separator className="bg-slate-800/60" />

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Referral ID</span>
              <div className="flex items-center gap-2">
                <span className="font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-xs text-slate-300">
                  {user.referId || "None"}
                </span>
                {user.referId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(user.referId!, "Referral Code")
                    }
                    className="h-6 w-6 p-0 text-slate-400 hover:text-white cursor-pointer"
                  >
                    📋
                  </Button>
                )}
              </div>
            </div>
            <Separator className="bg-slate-800/60" />

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Assigned Agent</span>
              {user.agent ? (
                <Link
                  href={`/agents/${user.agent.id}`}
                  className="text-blue-400 hover:underline font-medium"
                >
                  {user.agent.fullName} ({user.agent.promo})
                </Link>
              ) : (
                <span className="text-slate-500">Direct Registration</span>
              )}
            </div>
            <Separator className="bg-slate-800/60" />

            {/* Turnover Progress */}
            <div className="pt-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Active Turnover</span>
                <span className="text-slate-200 font-mono">
                  {formatCurrency(activeTurnover, currency)} /{" "}
                  {formatCurrency(requiredTurnover, currency)}
                </span>
              </div>
              <Progress value={turnoverProgress} className="h-2 bg-slate-800" />
            </div>
          </CardContent>
        </Card>

        {/* Detailed Statistics & Action Area */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="betting" className="w-full">
            <TabsList className="bg-[#0d1527] border border-slate-800 p-1 w-full justify-start rounded-xl">
              <TabsTrigger
                value="betting"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                Betting Insights & Categories
              </TabsTrigger>
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                Financial Overview
              </TabsTrigger>
              <TabsTrigger
                value="transactions"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                Recent Transactions
              </TabsTrigger>
            </TabsList>

            {/* BETTING BREAKDOWN TAB */}
            <TabsContent value="betting" className="mt-4 space-y-6">
              <div className="flex items-center justify-between bg-slate-900/80 p-4 border border-slate-800 rounded-xl">
                <div>
                  <h3 className="font-bold text-white text-sm">
                    Betting Analytics & Performance
                  </h3>
                  <p className="text-xs text-slate-400">
                    Detailed turnover, return rate, and game type insights.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setIsBettingHistoryOpen(true)}
                    variant="outline"
                    className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 text-xs cursor-pointer"
                  >
                    View History Table
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-500 text-white text-xs cursor-pointer">
                        View Charts →
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-5xl bg-[#0b1329] border-slate-800 text-white max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center justify-between">
                          <span>
                            Advanced Betting Analytics — {user.playerId}
                          </span>
                        </DialogTitle>
                      </DialogHeader>

                      <div className="flex gap-2 my-2">
                        <Button
                          size="sm"
                          variant={bettingTab === "ALL" ? "default" : "outline"}
                          onClick={() => setBettingTab("ALL")}
                          className="text-xs h-8"
                        >
                          All Categories
                        </Button>
                        <Button
                          size="sm"
                          variant={
                            bettingTab === "CASINO" ? "default" : "outline"
                          }
                          onClick={() => setBettingTab("CASINO")}
                          className="text-xs h-8 text-amber-400 border-amber-900/50"
                        >
                          Casino & Slots
                        </Button>
                        <Button
                          size="sm"
                          variant={
                            bettingTab === "SPORTS" ? "default" : "outline"
                          }
                          onClick={() => setBettingTab("SPORTS")}
                          className="text-xs h-8 text-blue-400 border-blue-900/50"
                        >
                          Sportsbook
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
                        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                          <h4 className="text-xs font-bold text-slate-300 mb-3">
                            Total Wagered vs Net Player PnL by Category
                          </h4>
                          <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={categoryChartData}>
                                <XAxis
                                  dataKey="name"
                                  stroke="#64748b"
                                  fontSize={11}
                                />
                                <YAxis stroke="#64748b" fontSize={11} />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: "#0d1527",
                                    borderColor: "#1e293b",
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                  }}
                                />
                                <Legend wrapperStyle={{ fontSize: "11px" }} />
                                <Bar
                                  dataKey="Wagered"
                                  fill="#3b82f6"
                                  radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                  dataKey="NetPnL"
                                  fill="#10b981"
                                  radius={[4, 4, 0, 0]}
                                >
                                  {categoryChartData.map(
                                    (entry: any, index: number) => (
                                      <Cell
                                        key={`cell-${index}`}
                                        fill={
                                          entry.NetPnL >= 0
                                            ? "#10b981"
                                            : "#ef4444"
                                        }
                                      />
                                    ),
                                  )}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                          <h4 className="text-xs font-bold text-slate-300 mb-3">
                            Casino vs Sportsbook Volume & PnL
                          </h4>
                          <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={casinoVsSportsChartData}>
                                <XAxis
                                  dataKey="name"
                                  stroke="#64748b"
                                  fontSize={11}
                                />
                                <YAxis stroke="#64748b" fontSize={11} />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: "#0d1527",
                                    borderColor: "#1e293b",
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                  }}
                                />
                                <Legend wrapperStyle={{ fontSize: "11px" }} />
                                <Bar
                                  dataKey="Wagered"
                                  fill="#8b5cf6"
                                  radius={[4, 4, 0, 0]}
                                />
                                <Bar dataKey="NetPnL" radius={[4, 4, 0, 0]}>
                                  {casinoVsSportsChartData.map(
                                    (entry: any, index: number) => (
                                      <Cell
                                        key={`cell-split-${index}`}
                                        fill={
                                          entry.NetPnL >= 0
                                            ? "#10b981"
                                            : "#ef4444"
                                        }
                                      />
                                    ),
                                  )}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>

                      <div className="border border-slate-800 rounded-lg overflow-hidden mt-2">
                        <Table>
                          <TableHeader className="bg-slate-900/80">
                            <TableRow className="border-slate-800">
                              <TableHead className="text-slate-400">
                                Category / Game Type
                              </TableHead>
                              <TableHead className="text-slate-400">
                                Total Bets
                              </TableHead>
                              <TableHead className="text-slate-400 text-right">
                                Total Wagered
                              </TableHead>
                              <TableHead className="text-slate-400 text-right">
                                Return / Win Amount
                              </TableHead>
                              <TableHead className="text-slate-400 text-right">
                                Net Profit / Loss
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {betting?.categories?.map((cat: any) => {
                              const wagered = cat.totalWagered || 0;
                              const returnAmt = cat.profitNLoss || 0;
                              const netPnL = returnAmt - wagered;

                              return (
                                <TableRow
                                  key={cat.category}
                                  className="border-slate-800/60 hover:bg-slate-900/40 text-xs"
                                >
                                  <TableCell className="font-bold text-white">
                                    {cat.category || "UNKNOWN"}
                                  </TableCell>
                                  <TableCell className="text-slate-400 font-mono">
                                    {cat.count}
                                  </TableCell>
                                  <TableCell className="text-right font-mono text-white">
                                    {formatCurrency(wagered, currency)}
                                  </TableCell>
                                  <TableCell className="text-right font-mono text-slate-300">
                                    {formatCurrency(returnAmt, currency)}
                                  </TableCell>
                                  <TableCell
                                    className={`text-right font-mono font-bold ${
                                      netPnL >= 0
                                        ? "text-emerald-400"
                                        : "text-red-400"
                                    }`}
                                  >
                                    {netPnL >= 0 ? "+" : ""}
                                    {formatCurrency(netPnL, currency)}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                  <p className="text-xs text-slate-400">Total Wagered</p>
                  <p className="text-xl font-bold text-blue-400">
                    {formatCurrency(betting?.grandTotalBet || 0, currency)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {betting?.totalBetsCount} Total Bets Placed
                  </p>
                </div>
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                  <p className="text-xs text-slate-400">Average Bet Size</p>
                  <p className="text-xl font-bold text-white">
                    {formatCurrency(betting?.avgBetSize || 0, currency)}
                  </p>
                </div>
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                  <p className="text-xs text-slate-400">
                    Active Sports Sessions
                  </p>
                  <p className="text-xl font-bold text-amber-400">
                    {betting?.activeSportsSessions || 0} Sessions
                  </p>
                </div>
              </div>

              <Card className="bg-[#0d1527] border-slate-800">
                <CardHeader>
                  <CardTitle className="text-md">
                    Wagering Split (Casino vs Sportsbook)
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800/80">
                    <h4 className="font-bold text-white mb-2 text-sm">
                      Casino & Slots
                    </h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Wagered:</span>
                        <span className="text-white font-mono">
                          {formatCurrency(
                            betting?.casino.totalBet || 0,
                            currency,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Casino Net PnL:</span>
                        <span
                          className={
                            (betting?.casino.pnl || 0) >= 0
                              ? "text-emerald-400 font-mono font-bold"
                              : "text-red-400 font-mono font-bold"
                          }
                        >
                          {formatCurrency(betting?.casino.pnl || 0, currency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800/80">
                    <h4 className="font-bold text-white mb-2 text-sm">
                      Sportsbook
                    </h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Wagered:</span>
                        <span className="text-white font-mono">
                          {formatCurrency(
                            betting?.sports.totalBet || 0,
                            currency,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Win:</span>
                        <span className="text-emerald-400 font-mono font-bold">
                          {formatCurrency(
                            betting?.sports.totalWin || 0,
                            currency,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* FINANCIAL OVERVIEW TAB */}
            <TabsContent value="overview" className="mt-4">
              <Card className="bg-[#0d1527] border-slate-800">
                <CardHeader>
                  <CardTitle className="text-md">
                    Deposit & Withdrawal Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-slate-900/50 rounded-lg">
                      <p className="text-xs text-slate-400">Total Deposits</p>
                      <p className="text-lg font-bold text-emerald-400">
                        {formatCurrency(
                          financial?.totalDeposits || 0,
                          currency,
                        )}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-900/50 rounded-lg">
                      <p className="text-xs text-slate-400">
                        Total Withdrawals
                      </p>
                      <p className="text-lg font-bold text-purple-400">
                        {formatCurrency(
                          financial?.totalWithdraws || 0,
                          currency,
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* RECENT TRANSACTIONS TAB (RESTORED) */}
            <TabsContent value="transactions" className="mt-4 space-y-4">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={filterType === "ALL" ? "default" : "outline"}
                  onClick={() => setFilterType("ALL")}
                  className="text-xs h-8"
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={filterType === "DEPOSIT" ? "default" : "outline"}
                  onClick={() => setFilterType("DEPOSIT")}
                  className="text-xs h-8 text-emerald-400 border-emerald-900/50"
                >
                  Deposits
                </Button>
                <Button
                  size="sm"
                  variant={filterType === "WITHDRAW" ? "default" : "outline"}
                  onClick={() => setFilterType("WITHDRAW")}
                  className="text-xs h-8 text-purple-400 border-purple-900/50"
                >
                  Withdrawals
                </Button>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0d1527]">
                <Table>
                  <TableHeader className="bg-slate-900/80">
                    <TableRow className="border-slate-800">
                      <TableHead className="text-slate-400">Type</TableHead>
                      <TableHead className="text-slate-400">Amount</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center text-slate-500 py-6"
                        >
                          No matching transactions found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((tx: any) => (
                        <TableRow
                          key={tx.id || tx.createdAt}
                          className="border-slate-800/60 hover:bg-slate-900/40 text-xs"
                        >
                          <TableCell className="font-bold text-white">
                            <Badge
                              variant="outline"
                              className={
                                tx.type === "DEPOSIT"
                                  ? "border-emerald-500/30 text-emerald-400"
                                  : "border-purple-500/30 text-purple-400"
                              }
                            >
                              {tx.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-white">
                            {formatCurrency(tx.amount || 0, currency)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                tx.status === "APPROVED" ||
                                tx.status === "SUCCESS"
                                  ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                                  : tx.status === "PENDING"
                                    ? "bg-amber-950 text-amber-400 border-amber-800"
                                    : "bg-red-950 text-red-400 border-red-800"
                              }
                            >
                              {tx.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-400 font-mono">
                            {moment(tx.createdAt).format(
                              "MMM DD, YYYY · HH:mm",
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>

          {/* SEND SYSTEM NOTIFICATION CARD (RESTORED) */}
          <Card id="notify-card" className="bg-[#0d1527] border-slate-800">
            <CardHeader>
              <CardTitle className="text-md text-white">
                Dispatch User Notification
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Send a direct inbox message or system notice to this user's
                account.
              </CardDescription>
            </CardHeader>
            <Form {...messageForm}>
              <form onSubmit={messageForm.handleSubmit(handleSendMessage)}>
                <CardContent className="space-y-4">
                  <FormField
                    control={messageForm.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-slate-300">
                          Message Body
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Type your system alert message here..."
                            className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-600 text-sm focus:border-blue-500 min-h-[90px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-end border-t border-slate-800/80 pt-4">
                  <Button
                    type="submit"
                    disabled={isSendingMsg}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs cursor-pointer"
                  >
                    {isSendingMsg ? "Sending..." : "Send Message"}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </div>
      </div>

      {/* BETTING HISTORY MODAL */}
      <BettingHistoryModal
        isOpen={isBettingHistoryOpen}
        onClose={() => setIsBettingHistoryOpen(false)}
        userId={user.id}
      />
    </div>
  );
};

export default Details;

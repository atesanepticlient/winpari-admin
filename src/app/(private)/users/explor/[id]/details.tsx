/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
// import * as echarts from "echarts";
import CookieLoader from "@/components/loader/cooki-loader";
import moment from "moment";
import Link from "next/link";
import { toast } from "sonner";
import { INTERNAL_SERVER_ERROR } from "@/error";

import {
  useCreateMessageMutation,
  useFetchUserQuery,
  useUserRechargeMutation,
} from "@/lib/features/userApiSlice";
import SuspensionModal from "./suspension-modal";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import {
  createMessageSchema,
  CreateMessageSchema,
  rechargeSignleUserSchema,
  RechargeSignleUserSchema,
} from "@/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { userDelete } from "@/action/user";

const Details = ({ id }: { id: string }) => {
  const { data, isLoading, isError, error } = useFetchUserQuery({ id });

  const user = data?.user;
  const financialOverview = data?.financialOverview;
  const bettingStatistics = data?.bettingStatistics;

  const [rechargeApi] = useUserRechargeMutation();

  const [createMessageApi] = useCreateMessageMutation();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`Copied: ${text}`);
  };

  const rechargeForm = useForm<RechargeSignleUserSchema>({
    defaultValues: {
      amount: "",
      id: user?.id || "",
      message: "",
    },
    resolver: zodResolver(rechargeSignleUserSchema),
  });

  const messageForm = useForm<CreateMessageSchema>({
    defaultValues: {
      id: "",
      message: "",
    },
    resolver: zodResolver(createMessageSchema),
  });

  const handleRecharege = (data: RechargeSignleUserSchema) => {
    const asyncAction = async () => {
      const response = await rechargeApi({
        id: data.id,
        amount: +data.amount,
        message: data.message,
      }).unwrap();
      return response.success;
    };

    toast.promise(asyncAction(), {
      loading: "Updating...",
      success: () => `${rechargeForm.watch("amount")} Added`,
      error: (error: any) => {
        if (error?.data?.error) {
          return `Error: ${error.data.error}`;
        } else {
          return INTERNAL_SERVER_ERROR;
        }
      },
    });
  };

  const handleMessageCreate = (data: CreateMessageSchema) => {
    const asyncAction = async () => {
      const response = await createMessageApi({
        userId: data.id,
        message: data.message,
      }).unwrap();
      return response.success;
    };

    toast.promise(asyncAction(), {
      loading: "Sending...",
      success: () => `Message sent to the user`,
      error: (error: any) => {
        if (error?.data?.error) {
          return `Error: ${error.data.error}`;
        } else {
          return INTERNAL_SERVER_ERROR;
        }
      },
    });
  };

  useEffect(() => {
    if (user) {
      rechargeForm.reset({
        amount: "",
        id: user.id,
        message: "",
      });
      messageForm.reset({
        id: user.id,
        message: "",
      });
    }
  }, [user]);

  const handleDelete = () => {
    if (!user?.id) {
      return 0;
    }
    const confirm = window.confirm("Are You Sure to delete this user?");
    if (confirm) {
      const asyncAction = async () => {
        const res = await userDelete(user!.id);
        if (res.success) {
          location.reload();
          return true;
        } else if (res.error) {
          throw res.error;
        }
      };

      toast.promise(asyncAction(), {
        loading: "Deleting...",
        error: (error) => {
          return `${error.message}`;
        },
      });
    }
  };

  if (isError) {
    if ((error as any)?.status === 404) {
      return <p>User not found.</p>;
    }

    return <p>An error occurred</p>;
  }

  return (
    <div>
      {data && !isLoading && (
        <div>
          <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-2">
                User Details
                <Badge
                  className={`ml-2 ${
                    user!.isBanned ? "bg-red-600" : "bg-green-600"
                  }`}
                >
                  {user?.isBanned ? "Banned" : "Active"}
                </Badge>
              </h2>
              <p className="text-xl text-[#9CA3AF]">
                Player ID: {user?.playerId}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleDelete}
                variant={"destructive"}
                className={`!rounded-button flex items-center whitespace-nowrap cursor-pointer`}
              >
                Delete
              </Button>
              <SuspensionModal id={user!.id} currentStatus={user!.isBanned}>
                <Button
                  variant={user!.isBanned ? "success" : "destructive"}
                  className={`!rounded-button flex items-center whitespace-nowrap cursor-pointer`}
                >
                  {user!.isBanned ? "Unban User" : "Ban User"}
                </Button>
              </SuspensionModal>

              <Button
                variant="outline"
                onClick={() =>
                  document
                    .getElementById("notification-section")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="!rounded-button whitespace-nowrap cursor-pointer"
              >
                <i className="fas fa-bell mr-2"></i>
                Notify
              </Button>
              <Button
                variant="default"
                onClick={() =>
                  document
                    .getElementById("recharge-section")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="bg-[#007AFF] hover:bg-[#0056b3] !rounded-button whitespace-nowrap cursor-pointer"
              >
                <i className="fas fa-wallet mr-2"></i>
                Recharge
              </Button>
            </div>
          </div>

          {/* User Info Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className=" border-gray-800 col-span-1">
              <CardHeader className="pb-2">
                <CardTitle>User Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center mb-4">
                  <Avatar className="w-24 h-24 mb-4">
                    <AvatarImage src={""} />
                    <AvatarFallback className="text-2xl">US</AvatarFallback>
                  </Avatar>
                  <h3 className="text-xl font-bold">{user?.playerId}</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Phone:</span>
                    <span>{user?.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Joined:</span>
                    <span>{moment(user?.createdAt).calendar()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Status:</span>
                    <span
                      className={
                        user!.isBanned ? "text-red-500" : "text-green-500"
                      }
                    >
                      {user!.isBanned ? "Banned" : "Active"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Current Balance:</span>
                    <span className="font-bold text-[#007AFF]">
                      {+user!.wallet!.balance}
                    </span>
                  </div>
                  <Separator className="bg-gray-800" />
                  {user!.referredById && (
                    <div className="flex justify-between items-center">
                      <span className="text-[#9CA3AF]">Referrer ID:</span>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/users/${user!.referredById}`}
                          className="text-blue-600 hover:underline"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-[#9CA3AF]">Refer Code:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{user!.referId}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(user!.referId!)}
                        className="h-6 w-6 p-0 !rounded-button cursor-pointer"
                      >
                        <i className="fas fa-copy text-xs"></i>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className=" border-gray-800 col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-[#0F172B] border-gray-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Total Deposit</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-500">
                        {financialOverview!.totalDeposits}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#0F172B] border-gray-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Total Withdraw</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-500">
                        {financialOverview!.totalWithdraws}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#0F172B] border-gray-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Last Deposit</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-500">
                        {financialOverview!.lastDeposits}
                      </p>
                      <p className="text-sm text-[#9CA3AF]">
                        {financialOverview!.lastWithdraws}
                        Today
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#0F172B] border-gray-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Last Withdraw</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-500">
                        {financialOverview!.lastWithdraws}
                      </p>
                      <p className="text-sm text-[#9CA3AF]">Today</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Betting Statistics */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">Betting Statistics</h3>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <Card className=" border-gray-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Bets</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {bettingStatistics?.totalBet}
                  </p>
                </CardContent>
              </Card>

              <Card className=" border-gray-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Wins</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-500">
                    {bettingStatistics?.totalWin}
                  </p>
                </CardContent>
              </Card>

              <Card className=" border-gray-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Losses</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-500">
                    {bettingStatistics?.totalLosss}
                  </p>
                </CardContent>
              </Card>

              <Card className=" border-gray-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Win Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-[#007AFF]">
                    {bettingStatistics?.winRate}%
                  </p>
                  <Progress
                    value={bettingStatistics?.winRate}
                    className="h-2 mt-2"
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Betting Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className=" border-gray-800">
              <CardHeader>
                <CardTitle>Betting Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div id="bettingChart" className="h-[300px]"></div>
              </CardContent>
            </Card>

            {/* Action Panel */}
            <div className="space-y-6">
              {/* Recharge Section */}
              <Form {...rechargeForm}>
                <form
                  onSubmit={rechargeForm.handleSubmit(
                    handleRecharege,
                    (error) => console.log({ error })
                  )}
                >
                  <Card className=" border-gray-800" id="recharge-section">
                    <CardHeader>
                      <CardTitle>Recharge Wallet</CardTitle>
                      <CardDescription className="text-[#9CA3AF]">
                        Add funds to user&apos;s account
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <FormField
                            control={rechargeForm.control}
                            name="amount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Amount</FormLabel>
                                <FormControl>
                                  <Input
                                    id="amount"
                                    type="number"
                                    min={1}
                                    placeholder="Enter amount"
                                    {...field}
                                    className=" border-gray-800 bg-input/30 focus:border-[#007AFF] text-white"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={rechargeForm.control}
                            name="message"
                            render={({ field }) => (
                              <FormItem className="space-y-2">
                                <FormLabel>Message</FormLabel>
                                <FormControl>
                                  <Textarea
                                    id="message"
                                    placeholder="Enter your message here"
                                    {...field}
                                    className=" border-gray-800 focus:border-[#007AFF] text-white min-h-[100px]"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        type="submit"
                        className="w-full bg-[#007AFF] hover:bg-[#0056b3] !rounded-button whitespace-nowrap cursor-pointer"
                        disabled={rechargeForm.watch("amount") == ""}
                      >
                        <i className="fas fa-plus-circle mr-2"></i>
                        Add Balance
                      </Button>
                    </CardFooter>
                  </Card>
                </form>
              </Form>
              {/* Notification Section */}

              <Form {...messageForm}>
                <form onSubmit={messageForm.handleSubmit(handleMessageCreate)}>
                  <Card className=" border-gray-800" id="notification-section">
                    <CardHeader>
                      <CardTitle>Send Notification</CardTitle>
                      <CardDescription className="text-[#9CA3AF]">
                        Send a message to this user
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <FormField
                            name="message"
                            control={messageForm.control}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Message</FormLabel>
                                <FormControl>
                                  <Textarea
                                    id="message"
                                    placeholder="Enter your message here"
                                    {...field}
                                    className=" border-gray-800 focus:border-[#007AFF] text-white min-h-[100px]"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        type="submit"
                        className="w-full bg-[#007AFF] hover:bg-[#0056b3] !rounded-button whitespace-nowrap cursor-pointer"
                        disabled={messageForm.watch("message") == ""}
                      >
                        <i className="fas fa-paper-plane mr-2"></i>
                        Send Notification
                      </Button>
                    </CardFooter>
                  </Card>
                </form>
              </Form>
            </div>
          </div>

          {/* Recent Transactions */}
          <div
            style={{
              border: "1px dashed #4F39F6",
            }}
            className="w-full h-[100px] rounded-2xl  bg-indigo-500/15 flex justify-center items-center"
          >
            <Link
              href={`/users/${data.user.id}/transactions`}
              className=" text-indigo-500 underline rounded-2xl"
            >
              See Transactions
            </Link>
          </div>
        </div>
      )}

      {(!data || isLoading) && (
        <div className="flex w-full h-[85vh] justify-center items-center">
          <CookieLoader />
        </div>
      )}
    </div>
  );
};

export default Details;

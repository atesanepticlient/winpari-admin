"use client";

import React, { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFetchUsersQuery } from "@/lib/features/userApiSlice";
import UserItemsCheck from "./user-items-check";
import {
  Loader2,
  Search,
  Users,
  X,
  Zap,
  DollarSign,
  AlertTriangle,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  MinusCircle,
  PlusCircle,
  Globe2,
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { MultipleRecharge } from "../../../../../schema";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  multipleUsersRecharge,
  OperationType,
  RechargeCategory,
} from "@/action/recharge";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000];

const RechargeUser = () => {
  const [search, setSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [operationType, setOperationType] = useState<OperationType>("CREDIT");
  const [category, setCategory] = useState<RechargeCategory>("DIRECT_DEPOSIT");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pending, startTransition] = useTransition();

  const { data, isFetching } = useFetchUsersQuery({
    search: search,
    limit: search ? 15 : 0,
    status: "ALL",
    page: 1,
  });

  const users = data?.payload?.users || [];

  const form = useForm<MultipleRecharge>({
    defaultValues: {
      amount: "",
      message: "",
      users: [],
    },
  });

  const watchAmount = Number(form.watch("amount")) || 0;
  const totalExposure = selectedUsers.length * watchAmount;

  // DERIVED STATE: Find the locked currency code based on the first selected user
  const lockedUser = users.find((u) => selectedUsers.includes(u.id));
  const activeBatchCurrency = lockedUser?.wallet?.currencyCode || null;

  const handleOperationToggle = (type: OperationType) => {
    setOperationType(type);
    if (type === "CREDIT") {
      setCategory("DIRECT_DEPOSIT");
    } else {
      setCategory("CHARGEBACK");
    }
  };

  useEffect(() => {
    form.setValue("users", selectedUsers, { shouldValidate: true });
  }, [selectedUsers, form]);

  const toggleSelectUser = (id: string) => {
    const targetUser = users.find((u) => u.id === id);
    if (!targetUser) return;

    // Reject selection if currency doesn't match the current locked batch currency
    if (
      activeBatchCurrency &&
      targetUser.wallet?.currencyCode !== activeBatchCurrency &&
      !selectedUsers.includes(id)
    ) {
      toast.error(
        `Currency Mismatch! Current batch is locked to ${activeBatchCurrency}. Cannot mix with ${targetUser.wallet?.currencyCode}.`,
      );
      return;
    }

    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (!users.length) return;

    // Filter available users that match the current batch currency (or all if none locked)
    const validUsers = users.filter((u) =>
      activeBatchCurrency
        ? u.wallet?.currencyCode === activeBatchCurrency
        : true,
    );

    const validUserIds = validUsers.map((u) => u.id);
    const allSelected = validUserIds.every((id) => selectedUsers.includes(id));

    if (allSelected) {
      setSelectedUsers((prev) =>
        prev.filter((id) => !validUserIds.includes(id)),
      );
    } else {
      setSelectedUsers((prev) =>
        Array.from(new Set([...prev, ...validUserIds])),
      );
    }
  };

  const executeBulkRecharge = () => {
    const formData = form.getValues();
    setShowConfirmModal(false);

    startTransition(async () => {
      const actionText = operationType === "CREDIT" ? "crediting" : "deducting";
      const toastId = toast.loading(`Executing wallet ${actionText}...`);

      try {
        const response = await multipleUsersRecharge({
          ...formData,
          operationType,
          category,
        });

        if (response.error) {
          toast.error(response.error, { id: toastId });
          return;
        }

        const verb =
          operationType === "CREDIT" ? "credited to" : "deducted from";
        toast.success(
          `Successfully ${verb} ${response.currencyCode} ${response.totalAmount?.toLocaleString()} across ${response.count} players.`,
          { id: toastId },
        );
        setSelectedUsers([]);
        form.reset({ amount: "", message: "", users: [] });
      } catch (err: any) {
        toast.error(err.message || "Execution failed", { id: toastId });
      }
    });
  };

  const selectableUsers = users.filter((u) =>
    activeBatchCurrency ? u.wallet?.currencyCode === activeBatchCurrency : true,
  );

  const allCurrentSelected =
    selectableUsers.length > 0 &&
    selectableUsers.every((u) => selectedUsers.includes(u.id));

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto text-foreground">
      {/* Top Banner Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="h-6 w-6 text-emerald-500 fill-emerald-500/20" />
            Multi-Currency Cashier & Balance Operations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Execute batch balance adjustments in BDT, INR, or PKR with strict
            currency segregation locks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeBatchCurrency && (
            <Badge className="bg-primary/20 text-primary border-primary/30 py-1.5 px-3 font-mono text-xs flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5" />
              Batch Currency Locked:{" "}
              <span className="font-extrabold">{activeBatchCurrency}</span>
            </Badge>
          )}
          <Badge variant="outline" className="py-1.5 px-3 font-mono text-xs">
            <History className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            Session: Cashier-Admin-01
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Player Lookup Table */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-border/60 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Player Directory Lookup
                </CardTitle>
                <span className="text-xs text-muted-foreground font-mono">
                  {selectedUsers.length} Targets Selected
                </span>
              </div>
              <CardDescription>Search player IDs or emails</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Search Control */}
              <div className="relative flex items-center">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-9 bg-background"
                  placeholder="Enter Player ID or Email (e.g. PLR-88492)..."
                />
                {search && (
                  <X
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => setSearch("")}
                  />
                )}
              </div>

              {/* Data Table Container */}
              <div className="rounded-md border border-border/80 overflow-hidden bg-background">
                <div className="max-h-[500px] overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-muted/80 sticky top-0 z-10 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b">
                      <tr>
                        <th className="p-3 text-center w-10">
                          <Checkbox
                            checked={allCurrentSelected}
                            onCheckedChange={toggleSelectAll}
                          />
                        </th>
                        <th className="p-3">Player ID</th>
                        <th className="p-3">Account Email</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!isFetching &&
                        users.map((user) => (
                          <UserItemsCheck
                            key={user.id}
                            id={user.id}
                            playerId={user.playerId}
                            email={user.email}
                            balance={+user.wallet?.balance || 0}
                            currencyCode={user.wallet?.currencyCode || "BDT"}
                            batchCurrency={activeBatchCurrency}
                            isSelected={selectedUsers.includes(user.id)}
                            onToggle={toggleSelectUser}
                          />
                        ))}
                    </tbody>
                  </table>

                  {!isFetching && users.length === 0 && (
                    <div className="p-12 text-center text-sm text-muted-foreground">
                      {search
                        ? `No player accounts found matching "${search}"`
                        : "Type a Player ID or Email above to query records."}
                    </div>
                  )}

                  {isFetching && (
                    <div className="p-12 text-center flex justify-center items-center">
                      <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Execution & Currency Console */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-border/60 shadow-md">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <CardTitle className="text-base font-semibold flex items-center justify-between">
                <span>Batch Operation Console</span>
                <div className="flex items-center gap-2">
                  {activeBatchCurrency && (
                    <Badge
                      variant="outline"
                      className="font-mono text-xs border-primary/50 text-primary"
                    >
                      {activeBatchCurrency}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="font-mono text-xs">
                    {selectedUsers.length} Targets
                  </Badge>
                </div>
              </CardTitle>
              <CardDescription>
                Select operation mode, currency amount, and audit category.
              </CardDescription>
            </CardHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(() => setShowConfirmModal(true))}
              >
                <CardContent className="space-y-5 pt-5">
                  {/* Operation Toggle */}
                  <div className="space-y-2">
                    <FormLabel>Operation Action</FormLabel>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg border">
                      <button
                        type="button"
                        onClick={() => handleOperationToggle("CREDIT")}
                        className={cn(
                          "flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-bold transition-all",
                          operationType === "CREDIT"
                            ? "bg-emerald-600! text-white shadow"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <PlusCircle className="w-4 h-4" /> Credit (+ Add)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOperationToggle("DEBIT")}
                        className={cn(
                          "flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-bold transition-all",
                          operationType === "DEBIT"
                            ? "bg-destructive text-destructive-foreground shadow"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <MinusCircle className="w-4 h-4" /> Debit (- Deduct)
                      </button>
                    </div>
                  </div>

                  {/* Category Selector */}
                  <div className="space-y-2">
                    <FormLabel>Audit Tag / Category</FormLabel>
                    <Select
                      value={category}
                      onValueChange={(val: RechargeCategory) =>
                        setCategory(val)
                      }
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {operationType === "CREDIT" ? (
                          <>
                            <SelectItem value="DIRECT_DEPOSIT">
                              Direct Deposit (Cashier)
                            </SelectItem>
                            <SelectItem value="VIP_COMP">
                              VIP Loyalty Comp
                            </SelectItem>
                            <SelectItem value="BONUS_CREDIT">
                              Promotional Bonus Credit
                            </SelectItem>
                            <SelectItem value="CORRECTION">
                              System Correction
                            </SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="CHARGEBACK">
                              Chargeback Deduction
                            </SelectItem>
                            <SelectItem value="CLAWBACK">
                              Bonus Clawback
                            </SelectItem>
                            <SelectItem value="MANUAL_DEDUCTION">
                              Manual Fine / Adjustment
                            </SelectItem>
                            <SelectItem value="CORRECTION">
                              System Correction
                            </SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Selected Accounts Pills */}
                  {selectedUsers.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-xs text-muted-foreground">
                          Selected Queue
                        </FormLabel>
                        <span className="text-[10px] font-mono font-bold text-primary">
                          Currency Locked: {activeBatchCurrency}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 border rounded-md bg-muted/20">
                        {selectedUsers.map((id) => (
                          <Badge
                            key={id}
                            variant="secondary"
                            className="gap-1 font-mono text-[11px] bg-background border"
                          >
                            {id.slice(0, 8)}...
                            <X
                              className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-destructive"
                              onClick={() => toggleSelectUser(id)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Amount Input with Dynamic Currency Symbol */}
                  <FormField
                    name="amount"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {operationType === "CREDIT"
                            ? "Credit Amount Per Account"
                            : "Deduction Amount Per Account"}{" "}
                          ({activeBatchCurrency || "Currency"})
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-muted-foreground">
                              {activeBatchCurrency || "$"}
                            </span>
                            <Input
                              {...field}
                              type="number"
                              placeholder="0.00"
                              className="pl-12 font-mono text-base bg-background font-semibold"
                              disabled={pending}
                            />
                          </div>
                        </FormControl>

                        {/* Presets */}
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {QUICK_AMOUNTS.map((amt) => (
                            <Button
                              key={amt}
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-xs font-mono h-7 px-2"
                              onClick={() =>
                                form.setValue("amount", amt.toString(), {
                                  shouldValidate: true,
                                })
                              }
                            >
                              {operationType === "CREDIT"
                                ? `+${activeBatchCurrency || ""} ${amt}`
                                : `-${activeBatchCurrency || ""} ${amt}`}
                            </Button>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Message Audit Note */}
                  <FormField
                    name="message"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Audit Note & Player Notification</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Reason for adjustment or transaction reference..."
                            disabled={pending}
                            rows={2}
                            className="bg-background text-xs"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Outflow Box */}
                  <div
                    className={cn(
                      "rounded-lg border p-3 flex items-center justify-between text-xs transition-colors",
                      operationType === "CREDIT"
                        ? "bg-emerald-500/10 border-emerald-500/20"
                        : "bg-destructive/10 border-destructive/20",
                    )}
                  >
                    <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                      {operationType === "CREDIT" ? (
                        <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4 text-destructive" />
                      )}
                      Total Aggregate{" "}
                      {operationType === "CREDIT" ? "Credit" : "Debit"}
                    </span>
                    <span
                      className={cn(
                        "font-mono text-base font-bold",
                        operationType === "CREDIT"
                          ? "text-emerald-400"
                          : "text-destructive",
                      )}
                    >
                      {activeBatchCurrency || ""}{" "}
                      {totalExposure.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="pt-2">
                  <Button
                    type="submit"
                    disabled={
                      watchAmount <= 0 || selectedUsers.length === 0 || pending
                    }
                    className={cn(
                      "w-full text-white font-semibold transition-colors",
                      operationType === "CREDIT"
                        ? "bg-emerald-600! hover:bg-emerald-700"
                        : "bg-destructive hover:bg-destructive/90",
                    )}
                  >
                    {pending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Confirm & {operationType === "CREDIT" ? "Credit" : "Deduct"}{" "}
                    ({selectedUsers.length} Players)
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </div>
      </div>

      {/* CONFIRMATION SAFETY MODAL */}
      <AlertDialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Confirm Currency Adjustment
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p>
                You are executing a <strong>{operationType}</strong> of{" "}
                <strong>
                  {activeBatchCurrency} {watchAmount.toLocaleString()}
                </strong>{" "}
                per account for{" "}
                <strong>{selectedUsers.length} player(s)</strong>.
              </p>
              <div className="bg-muted p-3 rounded-md text-xs font-mono space-y-1">
                <div className="flex justify-between">
                  <span>Batch Currency:</span>
                  <span className="font-bold text-primary">
                    {activeBatchCurrency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Category Tag:</span>
                  <span className="font-bold text-foreground">{category}</span>
                </div>
                <div className="flex justify-between border-t pt-1 mt-1 font-bold">
                  <span>Total Amount Impact:</span>
                  <span>
                    {activeBatchCurrency} {totalExposure.toLocaleString()}
                  </span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeBulkRecharge}
              className={cn(
                "text-white",
                operationType === "CREDIT"
                  ? "bg-emerald-600! hover:bg-emerald-700"
                  : "bg-red-500! hover:bg-destructive/90",
              )}
            >
              Execute {operationType} Action
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RechargeUser;

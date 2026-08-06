"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface RecentTransactionsTableProps {
  transactions: Array<{
    id: string;
    type: "DEPOSIT" | "WITHDRAW";
    status: "PENDING" | "SUCCESS" | "FAILED";
    amount: number;
    user: {
      email: string;
      playerId: string;
    };
    createdAt: string;
  }>;
}

export default function RecentTransactionsTable({
  transactions,
}: RecentTransactionsTableProps) {
  // Ensure value is a valid number
  const ensureNumber = (value: any): number => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  const formatCurrency = (value: number) => {
    const validValue = ensureNumber(value);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(validValue);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return (
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">
              SUCCESS
            </span>
          </div>
        );
      case "PENDING":
        return (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-medium text-yellow-400">PENDING</span>
          </div>
        );
      case "FAILED":
        return (
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="text-xs font-medium text-red-400">FAILED</span>
          </div>
        );
      default:
        return <span className="text-xs text-slate-400">UNKNOWN</span>;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === "DEPOSIT" ? (
      <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
    ) : (
      <ArrowUpRight className="w-4 h-4 text-red-400" />
    );
  };

  // Validate transactions data
  const validTransactions = transactions
    .filter((t) => t && t.id)
    .map((t) => ({
      ...t,
      amount: ensureNumber(t.amount),
    }));

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Recent Transactions</CardTitle>
        <p className="text-sm text-slate-400 mt-1">Latest 15 payments</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400">
                  TYPE
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400">
                  USER
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400">
                  STATUS
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400">
                  AMOUNT
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400">
                  DATE
                </th>
              </tr>
            </thead>
            <tbody>
              {validTransactions.map((txn) => (
                <tr
                  key={txn.id}
                  className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(txn.type)}
                      <span className="text-xs font-medium text-slate-300">
                        {txn.type === "DEPOSIT" ? "Deposit" : "Withdraw"}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      <p className="font-medium text-white text-sm truncate max-w-xs">
                        {txn.user?.email || "N/A"}
                      </p>
                      <p className="text-xs text-slate-400">
                        Player: {txn.user?.playerId || "N/A"}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-4">{getStatusIcon(txn.status)}</td>
                  <td className="py-4 px-4 text-right">
                    <p
                      className={`font-bold text-sm ${
                        txn.type === "DEPOSIT"
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {txn.type === "DEPOSIT" ? "+" : "-"}
                      {formatCurrency(txn.amount)}
                    </p>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-xs text-slate-400">
                      {format(parseISO(txn.createdAt), "MMM d, HH:mm")}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {validTransactions.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-slate-400 text-sm">
              No transaction data available
            </p>
          </div>
        )}

        {/* Summary */}
        <div className="mt-6 pt-6 border-t border-slate-700">
          <p className="text-xs text-slate-400">
            Showing {validTransactions.length} transactions
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

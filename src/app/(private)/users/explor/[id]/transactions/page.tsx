// app/users/[userId]/transactions/page.tsx
"use client";

import { useGetTransactionsQuery } from "@/lib/features/transactionsApi";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Transaction } from "@/types/transaction";
import Link from "next/link";

const LIMIT = 10;

export default function UserTransactions() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useGetTransactionsQuery({
    userId,
    page,
    limit: LIMIT,
  });
  console.log({ data });
  const renderStatusBadge = (status?: string) => {
    if (!status) return null;

    const variantMap = {
      PENDING: "secondary",
      APPROVED: "default",
      REJECTED: "destructive",
      CLEARED: "default",
      UNCLEARED: "destructive",
    };

    return <Badge>{status}</Badge>;
  };

  const renderAgentLink = (agentId?: string, agentName?: string) => {
    if (!agentId || !agentName) return "-";

    return (
      <Link
        href={`/agents/${agentId}`}
        className="text-blue-600 hover:text-blue-800 hover:underline"
      >
        {agentName}
      </Link>
    );
  };

  const renderTransactionDetails = (transaction: Transaction) => {
    switch (transaction.type) {
      case "DEPOSIT":
        return (
          <>
            <TableCell>Deposit</TableCell>
            <TableCell>
              {typeof transaction.amount === "number"
                ? transaction.amount.toFixed(2)
                : transaction.amount.toString()}
            </TableCell>
            <TableCell>{transaction.payFrom}</TableCell>
            <TableCell>{renderStatusBadge(transaction.status)}</TableCell>
          </>
        );
      case "WITHDRAWAL":
        return (
          <>
            <TableCell>Withdrawal</TableCell>
            <TableCell>
              {typeof transaction.amount === "number"
                ? transaction.amount.toFixed(2)
                : transaction.amount.toString()}
            </TableCell>
            <TableCell>{transaction.paymentWalletNumber}</TableCell>
            <TableCell>{renderStatusBadge(transaction.status)}</TableCell>
          </>
        );
      case "AGENT_DEPOSIT":
        return (
          <>
            <TableCell>Agent Deposit</TableCell>
            <TableCell>
              {typeof transaction.amount === "number"
                ? transaction.amount.toFixed(2)
                : transaction.amount.toString()}
            </TableCell>
            <TableCell>
              {renderAgentLink(
                transaction.agent?.id,
                transaction.agent?.fullName
              )}
            </TableCell>
            <TableCell>-</TableCell>
          </>
        );
      case "AGENT_WITHDRAWAL":
        return (
          <>
            <TableCell>Agent Withdrawal</TableCell>
            <TableCell>
              {typeof transaction.amount === "number"
                ? transaction.amount.toFixed(2)
                : transaction.amount.toString()}
            </TableCell>
            <TableCell>
              {renderAgentLink(
                transaction.agent?.id,
                transaction.agent?.fullName
              )}
            </TableCell>
            <TableCell>{renderStatusBadge(transaction.status)}</TableCell>
          </>
        );
      default:
        return null;
    }
  };

  if (isError) return <div>Failed to load transactions</div>;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">User Transactions</h1>

      <Table>
        <TableCaption>
          {data?.pagination.total
            ? `Total of ${data.pagination.total} transactions`
            : "No transactions found"}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Source/Agent</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: LIMIT }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                </TableRow>
              ))
            : data?.transactions.map((transaction: any) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {format(
                      new Date(transaction.createdAt),
                      "MMM dd, yyyy HH:mm"
                    )}
                  </TableCell>
                  {renderTransactionDetails(transaction)}
                </TableRow>
              ))}
        </TableBody>
      </Table>

      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-muted-foreground">
            Page {data.pagination.currentPage} of {data.pagination.totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            {Array.from({
              length: Math.min(5, data.pagination.totalPages),
            }).map((_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            {data.pagination.totalPages > 5 && (
              <span className="px-2">...</span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPage((p) => Math.min(data.pagination.totalPages, p + 1))
              }
              disabled={page === data.pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

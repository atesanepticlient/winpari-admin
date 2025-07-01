// app/api/transactions/[userId]/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;
  const { id } = await params;
  try {
    // Fetch direct deposits and withdrawals
    const directDeposits = await db.deposit.findMany({
      where: { userId: id },
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
        transactionId: true,
        payFrom: true,
        transactions: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });
    const directWithdrawals = await db.withdraw.findMany({
      where: { userId: id },
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
        paymentWalletNumber: true,
        transactions: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });
    // Fetch agent-mediated transactions
    const agentDeposits = await db.agentDepositRecord.findMany({
      where: { userId: id },
      select: {
        id: true,
        amount: true,
        createdAt: true,

        agent: {
          select: {
            fullName: true,
            id: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });
    const agentWithdrawals = await db.agentWithdrawRecord.findMany({
      where: { userId: id },
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
        withdrawCode: true,
        agent: {
          select: {
            fullName: true,
            id: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });
    // Combine all transactions with type indicators
    const transactions = [
      ...directDeposits.map((t) => ({ ...t, type: "DEPOSIT" as const })),
      ...directWithdrawals.map((t) => ({ ...t, type: "WITHDRAWAL" as const })),
      ...agentDeposits.map((t) => ({ ...t, type: "AGENT_DEPOSIT" as const })),
      ...agentWithdrawals.map((t) => ({
        ...t,
        type: "AGENT_WITHDRAWAL" as const,
      })),
    ];

    // Sort combined transactions by createdAt (newest first)
    transactions.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Get total counts for pagination
    const totalDirectDeposits = await db.deposit.count({
      where: { userId: id },
    });
    const totalDirectWithdrawals = await db.withdraw.count({
      where: { userId: id },
    });
    const totalAgentDeposits = await db.agentDepositRecord.count({
      where: { userId: id },
    });
    const totalAgentWithdrawals = await db.agentWithdrawRecord.count({
      where: { userId: id },
    });
    const total =
      totalDirectDeposits +
      totalDirectWithdrawals +
      totalAgentDeposits +
      totalAgentWithdrawals;

    return NextResponse.json({
      transactions,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

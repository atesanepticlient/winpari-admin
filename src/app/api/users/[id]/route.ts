import { INTERNAL_SERVER_ERROR } from "@/error";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;

    // 1. Fetch main user identity first
    const user = await db.users.findUnique({
      where: { id },
      include: {
        wallet: true,
        bonusWallet: true,
        turnOver: true,
        agent: { select: { id: true, fullName: true, promo: true } },
        referredBy: {
          include: {
            user: { select: { id: true, playerId: true, email: true } },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currencyCode = user.wallet?.currencyCode || "BDT";

    // 2. Batch 1: Core Financial & Betting Aggregates (4 connections max)
    const [depositAgg, withdrawAgg, casinoBetAgg, sportsBetAgg] =
      await Promise.all([
        db.deposit.aggregate({
          where: { userId: id, status: "ACCEPTED" },
          _sum: { amount: true },
          _count: { id: true },
        }),
        db.withdraw.aggregate({
          where: { userId: id, status: "ACCEPTED" },
          _sum: { amount: true },
          _count: { id: true },
        }),
        db.bettingRecord.aggregate({
          where: { userId: id },
          _sum: { betAmount: true, profitNLoss: true },
          _count: { _all: true },
        }),
        db.bettingRecordSports.aggregate({
          where: { userId: id },
          _sum: { betAmount: true, winAmount: true, netAmount: true },
          _count: { _all: true },
        }),
      ]);

    // 3. Batch 2: Category Breakdown, Active Sessions, and Last Tx (4 connections max)
    const [lastDeposit, lastWithdraw, categoryBreakdown, activeSportsSessions] =
      await Promise.all([
        db.deposit.findFirst({
          where: { userId: id, status: "ACCEPTED" },
          select: { amount: true, createdAt: true },
          orderBy: { createdAt: "desc" },
        }),
        db.withdraw.findFirst({
          where: { userId: id, status: "ACCEPTED" },
          select: { amount: true, createdAt: true },
          orderBy: { createdAt: "desc" },
        }),
        db.bettingRecord.groupBy({
          by: ["category"],
          where: { userId: id },
          _sum: { betAmount: true, profitNLoss: true },
          _count: { _all: true },
        }),
        db.sportsGameSession.count({
          where: { userId: id },
        }),
      ]);

    // 4. Batch 3: Recent Activity Lists (4 connections max)
    const [
      recentCasinoBets,
      recentSportsBets,
      recentDeposits,
      recentWithdraws,
    ] = await Promise.all([
      db.bettingRecord.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      db.bettingRecordSports.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      db.deposit.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { ewallet: { select: { walletName: true } } },
      }),
      db.withdraw.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { withdrawEWallet: { select: { walletName: true } } },
      }),
    ]);

    // Calculations
    const totalDeposits = Number(depositAgg._sum.amount || 0);
    const totalWithdraws = Number(withdrawAgg._sum.amount || 0);
    const netGGR = totalDeposits - totalWithdraws;

    const totalCasinoBet = Number(casinoBetAgg._sum.betAmount || 0);
    const totalCasinoPnL = Number(casinoBetAgg._sum.profitNLoss || 0);

    const totalSportsBet = Number(sportsBetAgg._sum.betAmount || 0);
    const totalSportsWin = Number(sportsBetAgg._sum.winAmount || 0);
    const totalSportsNetPnL = Number(sportsBetAgg._sum.netAmount || 0);

    const grandTotalBet = totalCasinoBet + totalSportsBet;
    const totalBetsCount =
      (casinoBetAgg._count._all || 0) + (sportsBetAgg._count._all || 0);
    const avgBetSize = totalBetsCount > 0 ? grandTotalBet / totalBetsCount : 0;

    const categories = categoryBreakdown.map((cat) => ({
      category: cat.category || "OTHER",
      totalWagered: Number(cat._sum.betAmount || 0),
      profitNLoss: Number(cat._sum.profitNLoss || 0),
      count: cat._count._all,
    }));

    const taggedDeposits = recentDeposits.map((d) => ({
      id: d.id,
      amount: Number(d.amount),
      status: d.status,
      createdAt: d.createdAt,
      type: "DEPOSIT",
      gateway: d.ewallet?.walletName || "Direct / Admin",
    }));

    const taggedWithdraws = recentWithdraws.map((w) => ({
      id: w.id,
      amount: Number(w.amount),
      status: w.status,
      createdAt: w.createdAt,
      type: "WITHDRAW",
      gateway: w.withdrawEWallet?.walletName || "Direct / Admin",
    }));

    const latestTransactions = [...taggedDeposits, ...taggedWithdraws]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 8);

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        wallet: user.wallet
          ? { ...user.wallet, balance: Number(user.wallet.balance) }
          : null,
        bonusWallet: user.bonusWallet
          ? {
              ...user.bonusWallet,
              balance: Number(user.bonusWallet.balance),
              turnOver: Number(user.bonusWallet.turnOver),
            }
          : null,
        turnOver: user.turnOver
          ? {
              ...user.turnOver,
              totalTurnOver: Number(user.turnOver.totalTurnOver),
              activeTurnOver: Number(user.turnOver.activeTurnOver),
            }
          : null,
      },
      currencyCode,
      financialOverview: {
        totalDeposits,
        depositCount: depositAgg._count.id,
        totalWithdraws,
        withdrawCount: withdrawAgg._count.id,
        lastDeposit: Number(lastDeposit?.amount || 0),
        lastDepositDate: lastDeposit?.createdAt || null,
        lastWithdraw: Number(lastWithdraw?.amount || 0),
        lastWithdrawDate: lastWithdraw?.createdAt || null,
        netGGR,
      },
      bettingStatistics: {
        grandTotalBet,
        totalBetsCount,
        avgBetSize,
        activeSportsSessions,
        casino: {
          totalBet: totalCasinoBet,
          pnl: totalCasinoPnL,
          count: casinoBetAgg._count._all,
        },
        sports: {
          totalBet: totalSportsBet,
          totalWin: totalSportsWin,
          netPnL: totalSportsNetPnL,
          count: sportsBetAgg._count._all,
        },
        categories,
        recentCasinoBets: recentCasinoBets.map((b) => ({
          ...b,
          betAmount: Number(b.betAmount),
          profitNLoss: Number(b.profitNLoss || 0),
        })),
        recentSportsBets: recentSportsBets.map((sb) => ({
          ...sb,
          betAmount: Number(sb.betAmount),
          winAmount: Number(sb.winAmount),
          netAmount: Number(sb.netAmount),
        })),
      },
      latestTransactions,
    });
  } catch (error) {
    console.error("GET User Error:", error);
    return NextResponse.json({ error: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
};

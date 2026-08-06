import { INTERNAL_SERVER_ERROR } from "@/error";
import { db } from "@/lib/db";
import { endOfYear, startOfYear, subDays, format } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

// Helper: convert a positive-only amount to USD (floors invalid/negative to 0).
// Use for amounts that should never be negative: bet stakes, deposits, withdraws,
// claimed bonuses, cashback amounts, turnover.
const convertToUSD = (
  amount: number,
  currencyCode: string | null | undefined,
  rates: any,
): number => {
  if (!amount || amount <= 0 || isNaN(amount)) return 0;

  if (!currencyCode || typeof currencyCode !== "string") return amount;

  const upperCurrency = currencyCode.toUpperCase().trim();
  const rate = rates[upperCurrency];

  if (!rate) return amount;

  let rateValue = 0;
  try {
    rateValue = typeof rate === "number" ? rate : parseFloat(rate.toString());
  } catch (e) {
    return amount;
  }

  if (rateValue <= 0) return amount;

  const converted = amount / rateValue;
  return isNaN(converted) ? 0 : converted;
};

// Helper: convert an amount to USD while PRESERVING its sign.
// Use for anything that can legitimately be negative: profitNLoss, winAmount/netAmount.
// convertToUSD() would silently zero out every negative value, which is wrong here.
const convertToUSDSigned = (
  amount: number,
  currencyCode: string | null | undefined,
  rates: any,
): number => {
  if (
    amount === null ||
    amount === undefined ||
    isNaN(amount) ||
    amount === 0
  ) {
    return 0;
  }

  if (!currencyCode || typeof currencyCode !== "string") return amount;

  const upperCurrency = currencyCode.toUpperCase().trim();
  const rate = rates[upperCurrency];

  if (!rate) return amount;

  let rateValue = 0;
  try {
    rateValue = typeof rate === "number" ? rate : parseFloat(rate.toString());
  } catch (e) {
    return amount;
  }

  if (rateValue <= 0) return amount;

  const converted = amount / rateValue;
  return isNaN(converted) ? 0 : converted;
};

// Helper: safely coerce a Prisma Decimal | number | null | undefined to a number.
const toNum = (v: any): number => {
  if (v === null || v === undefined) return 0;
  try {
    const n = typeof v === "number" ? v : parseFloat(v.toString());
    return isNaN(n) ? 0 : n;
  } catch (e) {
    return 0;
  }
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentFilter = searchParams.get("payment-filter") || "7days";
    const year = searchParams.get("year");

    const now = new Date();
    const last7Days = subDays(now, 7);
    const last30Days = subDays(now, 30);

    // ============ FETCH EXCHANGE RATES ============
    const exchangeRates = await db.dollerRate.findUnique({
      where: { id: "global" },
    });

    const rates = {
      BDT: exchangeRates?.bdt || 122,
      PKR: exchangeRates?.pkr || 277,
      INR: exchangeRates?.inr || 95,
    };

    // ============ KEY PERFORMANCE INDICATORS ============
    // NOTE: betting, bonus, and cashback records are now fetched as full rows
    // (with user -> wallet included) instead of DB-side aggregate(), because
    // aggregate() sums raw amounts across mixed currencies before conversion
    // is possible. Everything gets converted per-record below, then summed.
    const kpis = await Promise.all([
      // User Metrics
      db.users.count({ where: { createdAt: { gte: last7Days } } }),
      db.users.count({ where: { isBanned: false } }),
      db.users.count({ where: { isNewUser: true } }),
      db.users.count(),

      // Revenue Metrics - fetch deposits with user wallet info
      db.deposit.findMany({
        where: { status: "ACCEPTED", createdAt: { gte: last7Days } },
        include: { user: { include: { wallet: true } } },
      }),
      db.deposit.findMany({
        where: { status: "ACCEPTED" },
        include: { user: { include: { wallet: true } } },
      }),

      // Payout Metrics - fetch withdraws with user wallet info
      db.withdraw.findMany({
        where: { status: "ACCEPTED", createdAt: { gte: last7Days } },
        include: { user: { include: { wallet: true } } },
      }),
      db.withdraw.findMany({
        where: { status: "ACCEPTED" },
        include: { user: { include: { wallet: true } } },
      }),

      // Pending Metrics
      db.withdraw.findMany({
        where: { status: "PENDING" },
        include: { user: { include: { wallet: true } } },
      }),

      // Betting Metrics - fetch full records (was aggregate()) so each bet can
      // be converted using that bettor's own wallet currency before summing.
      db.bettingRecord.findMany({
        where: { createdAt: { gte: last7Days } },
        include: { user: { include: { wallet: true } } },
      }),
      db.bettingRecordSports.findMany({
        where: { createdAt: { gte: last7Days } },
        include: { user: { include: { wallet: true } } },
      }),

      // Bonus Metrics - fetch full records (was aggregate()) for per-user conversion
      db.payinBonus.findMany({
        where: { createdAt: { gte: last7Days } },
        include: { user: { include: { wallet: true } } },
      }),
      db.cashback.findMany({
        include: { user: { include: { wallet: true } } },
      }),

      // Referral Metrics
      db.referral.count(),
      db.payinBonus.aggregate({
        where: { type: "INVITATION", createdAt: { gte: last7Days } },
        _count: true,
      }),
    ]);

    const [
      newUsersLast7,
      activeUsers,
      newUsers,
      totalUsers,
      depositsLast7Raw,
      totalDepositsRaw,
      payoutsLast7Raw,
      totalPayoutsRaw,
      pendingWithdrawsRaw,
      casinoBetsRaw,
      sportsBetsRaw,
      payinBonusesRaw,
      cashbacksRaw,
      totalReferrals,
      invitationBonuses,
    ] = kpis;

    // ============ CONVERT DEPOSITS TO USD ============
    const depositsLast7Convert = depositsLast7Raw.reduce((sum, d) => {
      const currency = d.user?.wallet?.currencyCode || "BDT";
      const convertedAmount = convertToUSD(toNum(d.amount), currency, rates);
      return sum + convertedAmount;
    }, 0);

    const totalDepositsConvert = totalDepositsRaw.reduce((sum, d) => {
      const currency = d.user?.wallet?.currencyCode || "BDT";
      const convertedAmount = convertToUSD(toNum(d.amount), currency, rates);
      return sum + convertedAmount;
    }, 0);

    // ============ CONVERT WITHDRAWS TO USD ============
    const payoutsLast7Convert = payoutsLast7Raw.reduce((sum, w) => {
      const currency = w.user?.wallet?.currencyCode || "BDT";
      const convertedAmount = convertToUSD(toNum(w.amount), currency, rates);
      return sum + convertedAmount;
    }, 0);

    const totalPayoutsConvert = totalPayoutsRaw.reduce((sum, w) => {
      const currency = w.user?.wallet?.currencyCode || "BDT";
      const convertedAmount = convertToUSD(toNum(w.amount), currency, rates);
      return sum + convertedAmount;
    }, 0);

    const pendingWithdrawsConvert = pendingWithdrawsRaw.reduce((sum, w) => {
      const currency = w.user?.wallet?.currencyCode || "BDT";
      const convertedAmount = convertToUSD(toNum(w.amount), currency, rates);
      return sum + convertedAmount;
    }, 0);

    // ============ CONVERSION & PERFORMANCE METRICS ============
    const acceptedWithdrawsCount =
      payoutsLast7Raw.length +
      (totalPayoutsRaw.length - payoutsLast7Raw.length);

    // Get unique depositors
    const uniqueDepositorIds = new Set(totalDepositsRaw.map((d) => d.userId));
    const uniqueDepositors = Array.from(uniqueDepositorIds);

    const conversionMetrics = {
      depositConversionRate: totalUsers
        ? ((uniqueDepositors.length / totalUsers) * 100).toFixed(2)
        : "0.00",
      repeatUserRate: totalUsers
        ? ((uniqueDepositors.length / totalUsers) * 100).toFixed(2)
        : "0.00",
      avgDepositValue:
        totalDepositsConvert && uniqueDepositors.length
          ? (totalDepositsConvert / uniqueDepositors.length).toFixed(2)
          : "0",
      avgWithdrawValue:
        totalPayoutsConvert && acceptedWithdrawsCount
          ? (totalPayoutsConvert / acceptedWithdrawsCount).toFixed(2)
          : "0",
    };

    // ============ BETTING ANALYTICS ============
    // Per-record conversion using each bettor's own wallet currency.
    // betAmount uses convertToUSD (always positive). profitNLoss / winAmount use
    // convertToUSDSigned because they can legitimately be negative (player losses
    // for profitNLoss, and winAmount can be 0 or non-negative but keep signed for safety).
    let casinoBetAmount = 0;
    let casinoProfitNLoss = 0;
    for (const b of casinoBetsRaw) {
      const currency = b.user?.wallet?.currencyCode || "BDT";
      casinoBetAmount += convertToUSD(toNum(b.betAmount), currency, rates);
      casinoProfitNLoss += convertToUSDSigned(
        toNum(b.profitNLoss),
        currency,
        rates,
      );
    }

    let sportsBetAmount = 0;
    let sportsWinAmount = 0;
    for (const b of sportsBetsRaw) {
      const currency = b.user?.wallet?.currencyCode || "BDT";
      sportsBetAmount += convertToUSD(toNum(b.betAmount), currency, rates);
      sportsWinAmount += convertToUSDSigned(
        toNum(b.winAmount),
        currency,
        rates,
      );
    }

    const bettingAnalytics = {
      totalBetsPlaced: casinoBetsRaw.length + sportsBetsRaw.length,
      totalBetAmount: casinoBetAmount + sportsBetAmount,
      totalWinAmount: casinoProfitNLoss + sportsWinAmount,
      casinoBetsCount: casinoBetsRaw.length,
      sportsBetsCount: sportsBetsRaw.length,
      houseEdge: Math.abs(casinoProfitNLoss),
    };

    // ============ BONUS & PROMOTION METRICS ============
    // Per-record conversion using each user's own wallet currency.
    const totalBonusClaimedLast7 = payinBonusesRaw.reduce((sum, b) => {
      const currency = b.user?.wallet?.currencyCode || "BDT";
      return sum + convertToUSD(toNum(b.claimedBonus), currency, rates);
    }, 0);

    const totalCashbackLast7 = cashbacksRaw.reduce((sum, c) => {
      const currency = c.user?.wallet?.currencyCode || "BDT";
      return sum + convertToUSD(toNum(c.amount), currency, rates);
    }, 0);

    const bonusMetrics = {
      totalBonusClaimedLast7,
      totalCashbackLast7,
      activeBonusesCount: await db.payinBonus.count({
        where: { isActive: true },
      }),
      pendingBonusesCount: await db.payinBonus.count({
        where: { isActive: false },
      }),
      referralConversions:
        invitationBonuses._count?._all ?? invitationBonuses._count ?? 0,
    };

    // ============ AGENT METRICS ============
    // Deposit/withdraw records are made on behalf of a user, so they're converted
    // using that user's wallet currency (was previously summed raw, uncoverted).
    const agentDepositRecords = await db.agentDepositRecord.findMany({
      include: { user: { include: { wallet: true } } },
    });
    const agentWithdrawRecords = await db.agentWithdrawRecord.findMany({
      where: { status: "ACCEPTED" },
      include: { user: { include: { wallet: true } } },
    });
    const agentWithdrawRecordsPending = await db.agentWithdrawRecord.findMany({
      where: { status: "PENDING" },
      include: { user: { include: { wallet: true } } },
    });

    const agentMetrics = {
      totalAgents: await db.agent.count({ where: { isActive: true } }),
      verifiedAgents: await db.agent.count({ where: { isVerified: true } }),
      agentDepositsTotal: agentDepositRecords.reduce((sum, r) => {
        const currency = r.user?.wallet?.currencyCode || "BDT";
        return sum + convertToUSD(toNum(r.amount), currency, rates);
      }, 0),
      agentWithdrawsTotal: agentWithdrawRecords.reduce((sum, r) => {
        const currency = r.user?.wallet?.currencyCode || "BDT";
        return sum + convertToUSD(toNum(r.amount), currency, rates);
      }, 0),
      pendingAgentWithdraws: agentWithdrawRecordsPending.reduce((sum, r) => {
        const currency = r.user?.wallet?.currencyCode || "BDT";
        return sum + convertToUSD(toNum(r.amount), currency, rates);
      }, 0),
    };

    // ============ DEPOSIT/WITHDRAW CHART DATA ============
    let fromDate: Date = new Date(0);
    let toDate: Date = new Date();

    if (paymentFilter === "7days") {
      fromDate = subDays(toDate, 6);
    } else if (paymentFilter === "lastMonth") {
      toDate = subDays(new Date(), 1);
      fromDate = subDays(toDate, 29);
    } else if (paymentFilter === "year" && year) {
      fromDate = startOfYear(new Date(parseInt(year), 0));
      toDate = endOfYear(fromDate);
    }

    const [deposits, withdraws] = await Promise.all([
      db.deposit.findMany({
        where: {
          status: "ACCEPTED",
          createdAt: { gte: fromDate, lte: toDate },
        },
        include: { user: { include: { wallet: true } } },
      }),
      db.withdraw.findMany({
        where: {
          status: "ACCEPTED",
          createdAt: { gte: fromDate, lte: toDate },
        },
        include: { user: { include: { wallet: true } } },
      }),
    ]);

    const getLabel = (date: Date) => {
      if (paymentFilter === "7days") return format(date, "EEE");
      if (paymentFilter === "lastMonth") return format(date, "MMM dd");
      if (paymentFilter === "year") return format(date, "MMM");
      return format(date, "yyyy-MM-dd");
    };

    const dayCount =
      paymentFilter === "7days"
        ? 7
        : paymentFilter === "lastMonth"
          ? 30
          : paymentFilter === "year" && year
            ? 12
            : 0;

    const chartData = [];
    for (let i = 0; i < dayCount; i++) {
      const date =
        paymentFilter === "year"
          ? new Date(
              parseInt(year || new Date().getFullYear().toString()),
              i,
              1,
            )
          : subDays(toDate, dayCount - 1 - i);

      const dayDeposits = deposits
        .filter((d) => getLabel(d.createdAt) === getLabel(date))
        .reduce((sum, d) => {
          const currency = d.user?.wallet?.currencyCode || "BDT";
          const convertedAmount = convertToUSD(
            toNum(d.amount),
            currency,
            rates,
          );
          return sum + convertedAmount;
        }, 0);

      const dayWithdraws = withdraws
        .filter((w) => getLabel(w.createdAt) === getLabel(date))
        .reduce((sum, w) => {
          const currency = w.user?.wallet?.currencyCode || "BDT";
          const convertedAmount = convertToUSD(
            toNum(w.amount),
            currency,
            rates,
          );
          return sum + convertedAmount;
        }, 0);

      chartData.push({
        date: format(date, "yyyy-MM-dd"),
        label: getLabel(date),
        deposits: dayDeposits,
        withdraws: dayWithdraws,
        revenue: dayDeposits - dayWithdraws,
      });
    }

    // ============ BETTING CATEGORY BREAKDOWN ============
    // Was 4x aggregate() (currency-blind). Now fetches full rows per category
    // (with user -> wallet) and converts each bet using the bettor's currency.
    const [slotBets, liveCasinoBets, pokerBets, fishBets] = await Promise.all([
      db.bettingRecord.findMany({
        where: { category: "SLOT" },
        include: { user: { include: { wallet: true } } },
      }),
      db.bettingRecord.findMany({
        where: { category: "LIVE_CASINO" },
        include: { user: { include: { wallet: true } } },
      }),
      db.bettingRecord.findMany({
        where: { category: "POKER" },
        include: { user: { include: { wallet: true } } },
      }),
      db.bettingRecord.findMany({
        where: { category: "FISH" },
        include: { user: { include: { wallet: true } } },
      }),
    ]);

    const summarizeCategory = (name: string, records: typeof slotBets) => {
      let revenue = 0;
      let winnings = 0;
      for (const r of records) {
        const currency = r.user?.wallet?.currencyCode || "BDT";
        revenue += convertToUSD(toNum(r.betAmount), currency, rates);
        winnings += convertToUSDSigned(toNum(r.profitNLoss), currency, rates);
      }
      return {
        name,
        bets: records.length,
        revenue,
        winnings,
      };
    };

    const bettingCategories = [
      summarizeCategory("Slots", slotBets),
      summarizeCategory("Live Casino", liveCasinoBets),
      summarizeCategory("Poker", pokerBets),
      summarizeCategory("Fish", fishBets),
    ];

    // ============ TOP USERS (BY VOLUME) ============
    const allDeposits = await db.deposit.findMany({
      where: { status: "ACCEPTED", createdAt: { gte: last30Days } },
      include: { user: { include: { wallet: true } } },
    });

    const userVolumeMap: Record<string, { amount: number; user: any }> = {};
    allDeposits.forEach((d) => {
      const currency = d.user?.wallet?.currencyCode || "BDT";
      const amountNum = toNum(d.amount);

      if (amountNum <= 0) {
        return;
      }

      const convertedAmount = convertToUSD(amountNum, currency, rates);

      if (!userVolumeMap[d.userId]) {
        userVolumeMap[d.userId] = { amount: 0, user: d.user };
      }
      userVolumeMap[d.userId].amount += convertedAmount;
    });

    const topUsersData = Object.entries(userVolumeMap)
      .sort(([, a], [, b]) => b.amount - a.amount)
      .slice(0, 10)
      .map(([userId, data]) => ({
        userId,
        email: data.user?.email || "N/A",
        playerId: data.user?.playerId || "N/A",
        totalDeposits: isNaN(data.amount)
          ? 0
          : parseFloat(data.amount.toFixed(2)),
      }));

    // ============ RECENT TRANSACTIONS ============
    const recentTransactions = await db.paymentHistory.findMany({
      take: 15,
      orderBy: { createdAt: "desc" },
      include: {
        user: { include: { wallet: true } },
        deposit: { select: { amount: true } },
        withdraw: { select: { amount: true } },
      },
    });

    const recentTransactionsConverted = recentTransactions
      .map((t) => {
        const currency = t.user?.wallet?.currencyCode || "BDT";

        const depositAmount = toNum(t.deposit?.amount);
        const withdrawAmount = toNum(t.withdraw?.amount);

        const amount = depositAmount || withdrawAmount;

        if (amount <= 0) {
          return null;
        }

        const convertedAmount = convertToUSD(amount, currency, rates);

        return {
          id: t.id,
          type: t.type,
          status: t.status,
          amount: isNaN(convertedAmount)
            ? 0
            : parseFloat(convertedAmount.toFixed(2)),
          user: {
            email: t.user?.email || "N/A",
            playerId: t.user?.playerId || "N/A",
          },
          createdAt: t.createdAt,
        };
      })
      .filter((t) => t !== null);

    // ============ TURNOVER METRICS ============
    // UsersTurnOver is per-user and was previously summed raw, uncoverted.
    // Now includes user -> wallet and converts each row by that user's currency.
    const turnoverData = await db.usersTurnOver.findMany({
      include: { user: { include: { wallet: true } } },
    });
    const totalTurnOver = turnoverData.reduce((sum, t) => {
      const currency = t.user?.wallet?.currencyCode || "BDT";
      return sum + convertToUSD(toNum(t.totalTurnOver), currency, rates);
    }, 0);
    const activeTurnOver = turnoverData.reduce((sum, t) => {
      const currency = t.user?.wallet?.currencyCode || "BDT";
      return sum + convertToUSD(toNum(t.activeTurnOver), currency, rates);
    }, 0);

    // Final response
    return NextResponse.json({
      timestamp: new Date(),
      exchangeRates: rates,
      currency: "USD",
      kpis: {
        users: {
          new7Days: newUsersLast7,
          active: activeUsers,
          newTotal: newUsers,
          total: totalUsers,
          growth: totalUsers
            ? ((newUsersLast7 / (totalUsers / 52)) * 100).toFixed(2)
            : "0.00",
        },
        revenue: {
          depositsLast7: parseFloat(depositsLast7Convert.toFixed(2)),
          depositsTotal: parseFloat(totalDepositsConvert.toFixed(2)),
          payoutsLast7: parseFloat(payoutsLast7Convert.toFixed(2)),
          payoutsTotal: parseFloat(totalPayoutsConvert.toFixed(2)),
          pendingPayouts: parseFloat(pendingWithdrawsConvert.toFixed(2)),
          netRevenue: parseFloat(
            (totalDepositsConvert - totalPayoutsConvert).toFixed(2),
          ),
        },
        betting: {
          ...bettingAnalytics,
          totalBetAmount: parseFloat(
            bettingAnalytics.totalBetAmount.toFixed(2),
          ),
          totalWinAmount: parseFloat(
            bettingAnalytics.totalWinAmount.toFixed(2),
          ),
          houseEdge: parseFloat(bettingAnalytics.houseEdge.toFixed(2)),
        },
        bonuses: {
          ...bonusMetrics,
          totalBonusClaimedLast7: parseFloat(
            bonusMetrics.totalBonusClaimedLast7.toFixed(2),
          ),
          totalCashbackLast7: parseFloat(
            bonusMetrics.totalCashbackLast7.toFixed(2),
          ),
        },
        agents: {
          ...agentMetrics,
          agentDepositsTotal: parseFloat(
            agentMetrics.agentDepositsTotal.toFixed(2),
          ),
          agentWithdrawsTotal: parseFloat(
            agentMetrics.agentWithdrawsTotal.toFixed(2),
          ),
          pendingAgentWithdraws: parseFloat(
            agentMetrics.pendingAgentWithdraws.toFixed(2),
          ),
        },
        turnover: {
          total: parseFloat(totalTurnOver.toFixed(2)),
          active: parseFloat(activeTurnOver.toFixed(2)),
        },
      },
      conversions: conversionMetrics,
      chartData: {
        filter: paymentFilter,
        period: { from: fromDate, to: toDate },
        data: chartData,
      },
      bettingCategories: bettingCategories.map((c) => ({
        ...c,
        revenue: parseFloat(c.revenue.toFixed(2)),
        winnings: parseFloat(c.winnings.toFixed(2)),
      })),
      topUsers: topUsersData,
      recentTransactions: recentTransactionsConverted,
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { error: INTERNAL_SERVER_ERROR, details: String(error) },
      { status: 500 },
    );
  }
}

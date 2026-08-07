import { INTERNAL_SERVER_ERROR } from "@/error";
import { db } from "@/lib/db";
import { PaymentStatus, Prisma, WalletCategory } from "@prisma/client";
import { NextRequest } from "next/server";

const toNum = (v: any): number => {
  if (v === null || v === undefined) return 0;
  try {
    const n = typeof v === "number" ? v : parseFloat(v.toString());
    return isNaN(n) ? 0 : n;
  } catch (e) {
    return 0;
  }
};

export const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const card = searchParams.get("card");
    const minAmount = searchParams.get("minAmount");
    const maxAmount = searchParams.get("maxAmount");
    const status = searchParams.get("status") as PaymentStatus & "ALL";
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");

    const where: Prisma.WithdrawWhereInput = {};

    // Search across withdrawal ID, phone, player ID, and email
    if (search) {
      where.OR = [
        { id: { contains: search, mode: "insensitive" } },
        { user: { phone: { contains: search, mode: "insensitive" } } },
        { user: { playerId: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Date range filtering
    if (from || to) {
      where.createdAt = {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      };
    }

    // Card/payment method filtering - handles optional relation correctly
    if (card) {
      where.withdrawEWallet = { is: { walletName: card } };
    }

    // Amount range filtering
    if (minAmount || maxAmount) {
      where.amount = {
        ...(minAmount && { gte: parseFloat(minAmount) }),
        ...(maxAmount && { lte: parseFloat(maxAmount) }),
      };
    }

    // Status filtering
    if (status && status !== "ALL") {
      where.status = status;
    }

    const withdraws = await db.withdraw.findMany({
      where,
      include: { user: { include: { wallet: true } }, withdrawEWallet: true },
      orderBy: { createdAt: "desc" }, // ✅ FIX: Most recent first (was "asc")
      take: limit,
      skip: limit * (page - 1),
    });

    // Count total matching the filter criteria
    const totalFound = await db.withdraw.count({ where });

    // Crypto withdrawals are denominated in USD. Attach the equivalent amount
    // in the user's own wallet currency so the admin can see both figures
    // without doing the math by hand in the status modal.
    const hasCrypto = withdraws.some(
      (w) => w.withdrawEWallet?.category === WalletCategory.CRYPTO,
    );

    let rateMap: Record<string, number> = {};
    if (hasCrypto) {
      const exchangeRates = await db.dollerRate.findUnique({
        where: { id: "global" },
      });
      rateMap = {
        BDT: exchangeRates ? toNum(exchangeRates.bdt) || 122 : 122,
        PKR: exchangeRates ? toNum(exchangeRates.pkr) || 277 : 277,
        INR: exchangeRates ? toNum(exchangeRates.inr) || 95 : 95,
      };
    }

    const withdrawsWithConversion = withdraws.map((w) => {
      if (w.withdrawEWallet?.category !== WalletCategory.CRYPTO) {
        return w;
      }

      const walletCurrency = (
        w.user?.wallet?.currencyCode || "BDT"
      ).toUpperCase();
      const usdAmount = toNum(w.amount);
      const rate =
        walletCurrency === "USD" ? 1 : (rateMap[walletCurrency] ?? 1);
      const convertedAmount = parseFloat((usdAmount * rate).toFixed(2));

      return { ...w, convertedAmount, walletCurrency };
    });

    return Response.json(
      { payload: { withdraws: withdrawsWithConversion, totalFound } },
      { status: 200 },
    );
  } catch (error) {
    console.log({ error });
    return Response.json({ message: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
};

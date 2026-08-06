import { INTERNAL_SERVER_ERROR } from "@/error";
import { db } from "@/lib/db";
import { Prisma, WalletCategory } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { NextRequest } from "next/server";

export const PUT = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;
    const change = new URL(req.url).searchParams.get("change") as
      | "accept"
      | "reject";

    if (change !== "accept" && change !== "reject") {
      return Response.json({ message: "Invalid Route" }, { status: 400 });
    }

    // customRate is an optional admin override (e.g. a negotiated rate for
    // this specific payment). If omitted, we fall back to the global
    // DollerRate for the user's wallet currency.
    const { message, customRate } = await req.json();

    // Fetch the deposit with its e-wallet AND the user's wallet currency —
    // both are needed to decide whether/how to convert before crediting.
    const deposit = await db.deposit.findUnique({
      where: { id },
      include: { ewallet: true, user: { include: { wallet: true } } },
    });

    if (!deposit) {
      return Response.json({ message: "Deposit not found" }, { status: 404 });
    }

    // Only crypto deposits can be manually accepted/rejected by an admin.
    // Mobile banking (e-wallet) deposits are view-only here — they're
    // handled elsewhere (e.g. auto-verified via provider callback).
    if (deposit.ewallet.category !== WalletCategory.CRYPTO) {
      return Response.json(
        { message: "Only crypto deposits can be approved or rejected here" },
        { status: 403 },
      );
    }

    if (deposit.status !== "PENDING") {
      return Response.json(
        { message: "This deposit has already been processed" },
        { status: 400 },
      );
    }

    const updateData: Prisma.DepositUpdateInput = {};

    if (change === "accept") {
      updateData.status = "ACCEPTED";
    } else if (change === "reject") {
      updateData.status = "REJECTED";
    }

    // BUG FIX: previously credited `wallet.balance` with the raw deposit
    // amount. Crypto deposits are made in USD, but wallet.balance is tracked
    // in the user's own currency (wallet.currencyCode — BDT/PKR/INR/...).
    // Crediting the USD figure straight into a BDT balance under- or
    // over-credits the user by the exchange rate factor. We now convert
    // USD -> wallet currency before incrementing.
    let creditAmount: Decimal | null = null;

    if (change === "accept") {
      const wallet = deposit.user?.wallet;

      if (!wallet) {
        return Response.json(
          { message: "User has no wallet to credit" },
          { status: 400 },
        );
      }

      const walletCurrency = (wallet.currencyCode || "BDT").toUpperCase();

      let depositAmountUsd = 0;
      try {
        depositAmountUsd = deposit.amount
          ? typeof deposit.amount === "number"
            ? deposit.amount
            : parseFloat(deposit.amount.toString())
          : 0;
      } catch (e) {
        depositAmountUsd = 0;
      }

      if (
        !depositAmountUsd ||
        isNaN(depositAmountUsd) ||
        depositAmountUsd <= 0
      ) {
        return Response.json(
          { message: "Deposit has an invalid amount" },
          { status: 400 },
        );
      }

      let rate = 1; // wallet currency units per 1 USD

      if (walletCurrency !== "USD") {
        if (
          customRate !== undefined &&
          customRate !== null &&
          customRate !== ""
        ) {
          const parsedCustomRate = parseFloat(customRate);
          if (isNaN(parsedCustomRate) || parsedCustomRate <= 0) {
            return Response.json(
              { message: "Invalid custom rate" },
              { status: 400 },
            );
          }
          rate = parsedCustomRate;
        } else {
          const exchangeRates = await db.dollerRate.findUnique({
            where: { id: "global" },
          });

          const rateMap: Record<string, number> = {
            BDT: exchangeRates ? parseFloat(exchangeRates.bdt.toString()) : 122,
            PKR: exchangeRates ? parseFloat(exchangeRates.pkr.toString()) : 277,
            INR: exchangeRates ? parseFloat(exchangeRates.inr.toString()) : 95,
          };

          // Unknown wallet currency with no rate configured: fall back to 1
          // (i.e. treat as already in that currency) rather than guessing.
          rate = rateMap[walletCurrency] ?? 1;
        }
      }

      const convertedAmount = depositAmountUsd * rate;
      creditAmount = new Decimal(convertedAmount);
    }

    const updatedDeposit = await db.deposit.update({
      where: { id },
      data: { ...updateData },
    });

    if (change === "accept" && creditAmount) {
      await db.wallet.update({
        where: { userId: updatedDeposit.userId },
        data: { balance: { increment: creditAmount } },
      });
    }

    if (message) {
      await db.message.create({
        data: {
          title: message,
          user: { connect: { id: updatedDeposit.userId } },
        },
      });
    }

    return Response.json({ message: "Deposit Updated" });
  } catch (error) {
    console.log({ error });
    return Response.json({ message: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
};

export const DELETE = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;

    await db.deposit.delete({ where: { id } });
    return Response.json({ message: "Deposit Deleted" }, { status: 200 });
  } catch {
    return Response.json({ message: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
};

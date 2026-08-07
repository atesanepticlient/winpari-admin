"use server";

import { INTERNAL_SERVER_ERROR } from "@/error";
import { db } from "@/lib/db";
import { MultipleRecharge } from "../../schema";
import { Prisma } from "@prisma/client";

export type OperationType = "CREDIT" | "DEBIT";

export type RechargeCategory =
  | "DIRECT_DEPOSIT"
  | "VIP_COMP"
  | "BONUS_CREDIT"
  | "CORRECTION"
  | "CHARGEBACK"
  | "CLAWBACK"
  | "MANUAL_DEDUCTION";

export interface EnhancedMultipleRecharge extends MultipleRecharge {
  operationType: OperationType;
  category?: RechargeCategory;
  agentId?: string;
}

export const multipleUsersRecharge = async (data: EnhancedMultipleRecharge) => {
  try {
    const {
      amount,
      users,
      message,
      operationType = "CREDIT",
      category = "DIRECT_DEPOSIT",
    } = data;

    const numericAmount = Number(amount);
    if (
      isNaN(numericAmount) ||
      numericAmount <= 0 ||
      !users ||
      users.length === 0
    ) {
      return {
        error:
          "Invalid parameters. Please select at least 1 player and a valid amount.",
      };
    }

    const result = await db.$transaction(async (tx) => {
      // 1. Fetch target wallets to validate currency uniformity
      const targetWallets = await tx.wallet.findMany({
        where: { userId: { in: users } },
        select: { userId: true, balance: true, currencyCode: true },
      });

      if (targetWallets.length === 0) {
        throw new Error("No valid wallets found for the selected users.");
      }

      // 2. SERVER-SIDE GUARD: Ensure ALL selected wallets share the EXACT SAME currencyCode
      const currencies = new Set(targetWallets.map((w) => w.currencyCode));
      if (currencies.size > 1) {
        throw new Error(
          "Currency mismatch detected! All players in a batch must share the same currency.",
        );
      }

      const activeCurrency = Array.from(currencies)[0];

      // 3. Balance sufficiency guard for DEBIT operations
      if (operationType === "DEBIT") {
        const insufficientWallets = targetWallets.filter(
          (w) => Number(w.balance) < numericAmount,
        );
        if (insufficientWallets.length > 0) {
          throw new Error(
            `Cannot deduct balance: ${insufficientWallets.length} player(s) have insufficient funds.`,
          );
        }
      }

      // 4. Atomic Wallet Balance Update
      const updatedWallets = await tx.wallet.updateMany({
        where: {
          userId: {
            in: users,
          },
        },
        data: {
          balance:
            operationType === "CREDIT"
              ? { increment: numericAmount }
              : { decrement: numericAmount },
        },
      });

      // 5. Dispatch Audit Messages using exact schema field: description
      if (message && message.trim() !== "") {
        const titleTag = operationType === "CREDIT" ? "Credited" : "Deducted";
        const messagePayload: Prisma.MessageCreateManyInput[] = users.map(
          (userId) => ({
            title: `[${category.replace("_", " ")}] Account ${titleTag}`,
            description: message,
            userId: userId,
          }),
        );

        await tx.message.createMany({
          data: messagePayload,
        });
      }

      return {
        count: updatedWallets.count,
        currencyCode: activeCurrency,
      };
    });

    return {
      success: true,
      count: result.count,
      totalAmount: result.count * numericAmount,
      currencyCode: result.currencyCode,
      operationType,
    };
  } catch (error: any) {
    console.error("BETTING_RECHARGE_CRITICAL_ERROR:", error);
    return { error: error.message || INTERNAL_SERVER_ERROR };
  }
};

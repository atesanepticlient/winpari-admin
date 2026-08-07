"use server";

import { INTERNAL_SERVER_ERROR } from "@/error";
import { db } from "@/lib/db";
import { addBankingSchema } from "../../schema";
import zod from "zod";

export const addBanking = async (data: zod.infer<typeof addBankingSchema>) => {
  try {
    const { bankingId } = data;

    const wallet = await db.eWallet.findUnique({ where: { id: bankingId } });

    await db.eWallet.create({
      data: {
        walletName: wallet!.walletName,
        image: wallet!.image,
      },
    });

    return { success: true };
  } catch {
    return { error: INTERNAL_SERVER_ERROR };
  }
};

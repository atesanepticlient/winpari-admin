"use server";

import { INTERNAL_SERVER_ERROR, TOKEN_EXPIRED, WRONG_TOKEN } from "@/error";
import { db } from "@/lib/db";
import { VerificationCodeSchema } from "../../schema";
import zod from "zod";

export const verifiyToken = async (
  data: zod.infer<typeof VerificationCodeSchema>,
) => {
  try {
    const { token } = data;

    const existingToken = await db.adminEmailVerificationToken.findFirst({
      where: {},
    });

    if (!existingToken) {
      return { error: "Invalid Try" };
    }

    if (token !== existingToken?.token) {
      return { error: WRONG_TOKEN };
    }

    if (new Date() > new Date(existingToken!.expire)) {
      return { error: TOKEN_EXPIRED };
    }

    await db.adminEmailVerificationToken.delete({
      where: { id: existingToken.id },
    });

    return { success: true };
  } catch {
    return { error: INTERNAL_SERVER_ERROR };
  }
};

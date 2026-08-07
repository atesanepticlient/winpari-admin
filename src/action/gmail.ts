"use server";

import { findAdmin } from "@/data/admin";
import { INTERNAL_SERVER_ERROR, TOKEN_EXPIRED, WRONG_TOKEN } from "@/error";
import { createAdminVerificationToken } from "@/helpers/token";
import { db } from "@/lib/db";
import { sendAdminVerificationTokenMail } from "@/lib/email";
import { generateOTP } from "@/lib/helpers";
import { gmailChangeSchema, VerificationCodeSchema } from "../../schema";
import zod from "zod";

export const sendVerificationEmail = async () => {
  try {
    const admin = await findAdmin();

    const token = generateOTP(6);
    await createAdminVerificationToken(token);

    const hasEmailSent = await sendAdminVerificationTokenMail(
      admin!.twoFAEmail,
      token,
    );

    if (!hasEmailSent) {
      throw Error;
    }

    return { success: true };
  } catch {
    return { error: INTERNAL_SERVER_ERROR };
  }
};

export const changeEmail = async (
  data: zod.infer<typeof gmailChangeSchema>,
) => {
  try {
    const { newGmail } = data;

    const admin = await findAdmin();

    await db.admin.update({
      where: {
        id: admin!.id,
      },
      data: {
        email: newGmail,
      },
    });

    return { success: true };
  } catch {
    return { error: INTERNAL_SERVER_ERROR };
  }
};

export const verify2FAEmail = async (
  data: zod.infer<typeof VerificationCodeSchema>,
) => {
  try {
    const admin = await findAdmin();

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

    await db.admin.update({
      where: {
        id: admin!.id,
      },
      data: {
        twoFAEmail: admin!.email,
      },
    });
    return { success: true };
  } catch {
    return { error: INTERNAL_SERVER_ERROR };
  }
};

export const send2FAVerificationEmail = async () => {
  try {
    const admin = await findAdmin();

    const token = generateOTP(6);
    await createAdminVerificationToken(token);

    const hasEmailSent = await sendAdminVerificationTokenMail(
      admin!.email,
      token,
    );

    if (!hasEmailSent) {
      throw Error;
    }

    return { success: true };
  } catch {
    return { error: INTERNAL_SERVER_ERROR };
  }
};

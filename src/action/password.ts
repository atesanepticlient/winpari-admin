"use server";

import { findAdmin } from "@/data/admin";
import { CREDENTICALS_INCORRECT, INTERNAL_SERVER_ERROR } from "@/error";
import { createAdminVerificationToken } from "@/helpers/token";
import { db } from "@/lib/db";
import { sendAdminVerificationTokenMail } from "@/lib/email";
import { generateOTP } from "@/lib/helpers";
import { passwordChangeSchema, passwordMatcherSchema } from "../../schema";
import bcrypt from "bcryptjs";
import zod from "zod";

export const matchCurrentPassword = async (
  data: zod.infer<typeof passwordMatcherSchema>,
) => {
  try {
    const { currentPassword } = data;

    const admin = await findAdmin();

    const isPasswordMatch = await bcrypt.compare(
      currentPassword,
      admin!.password,
    );

    if (!isPasswordMatch) {
      return { error: CREDENTICALS_INCORRECT };
    }
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

export const changePassword = async (
  data: zod.infer<typeof passwordChangeSchema>,
) => {
  try {
    const { newPassword } = data;

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const admin = await findAdmin();

    await db.admin.update({
      where: { id: admin!.id },
      data: { password: hashedPassword },
    });

    return { success: true };
  } catch {
    return { error: INTERNAL_SERVER_ERROR };
  }
};

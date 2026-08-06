"use server";

import { signIn } from "@/auth";
import {
  CREDENTICALS_INCORRECT,
  INTERNAL_SERVER_ERROR,
  IP_NOT_WHITELISTED,
} from "@/error";
import { db } from "@/lib/db";
import { generateTOTPSecret, generateQRCode } from "@/lib/totp";
import { getClientIp, isIpWhitelisted } from "@/lib/ip";
import { loginSchema } from "@/schema";
import bcrypt from "bcryptjs";
import { CredentialsSignin } from "next-auth";
import zod from "zod";

export const createVerification = async (
  data: zod.infer<typeof loginSchema>,
) => {
  try {
    const { password, email } = data;
    const ip = await getClientIp();

    const admin = await db.admin.findUnique({ where: { email } });
    if (!admin) return { error: CREDENTICALS_INCORRECT };

    if (!isIpWhitelisted(ip, admin.ipWhitelist)) {
      return { error: IP_NOT_WHITELISTED };
    }

    const hasPasswordMatched = await bcrypt.compare(password, admin.password);
    if (!hasPasswordMatched) return { error: CREDENTICALS_INCORRECT };

    // First login ever → generate secret + QR
    if (!admin.twoFactorSecret) {
      const secret = generateTOTPSecret();
      const qrCodeEmail = admin.twoFAEmail || admin.email;
      const qrCodeDataUrl = await generateQRCode(qrCodeEmail, secret);

      await db.admin.update({
        where: { id: admin.id },
        data: { twoFactorSecret: secret },
      });

      return { success: true, qrCode: qrCodeDataUrl, isFirstSetup: true };
    }

    return { success: true, isFirstSetup: false };
  } catch (error) {
    console.error("LOGIN ERROR ", error);
    return { error: INTERNAL_SERVER_ERROR };
  }
};

export const verifyAdmin = async (data: zod.infer<typeof loginSchema>) => {
  try {
    const { email, password, token } = data;

    // All real validation (IP, password, TOTP) happens inside
    // authorize() in auth.config.ts — single source of truth.
    await signIn("credentials", {
      email,
      password,
      token,
      redirect: false,
    });

    return { success: "Login successful" };
  } catch (error) {
    if (error instanceof Error && error.name !== "AccessDenied") {
      const credentialsError = error as CredentialsSignin;
      return { error: credentialsError?.cause?.err?.message ?? error.message };
    }
    return { error: INTERNAL_SERVER_ERROR };
  }
};

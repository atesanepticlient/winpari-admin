"use server";

import { findAdmin } from "@/data/admin";
import { INTERNAL_SERVER_ERROR } from "@/error";
import { createAdminVerificationToken } from "@/helpers/token";
import { findCurrentUser } from "@/lib/admin";
import { db } from "@/lib/db";
import { sendAdminVerificationTokenMail } from "@/lib/email";
import { generateOTP } from "@/lib/helpers";
import {
  EmailChangeSchema,
  NameChangeSchema,
  PasswordChangeSchema,
} from "../../schema";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

/**
 * Update Admin IP Whitelist
 */
export const updateIpWhitelist = async (ipWhitelist: string[]) => {
  try {
    const admin = await findCurrentUser();
    if (!admin) return { error: "Authentication failed" };

    // Clean up IPs and validate basic format
    const cleanedIps = ipWhitelist
      .map((ip) => ip.trim())
      .filter((ip) => ip.length > 0);

    await db.admin.update({
      where: { id: admin.id },
      data: { ipWhitelist: cleanedIps },
    });

    revalidatePath("/account");
    return { success: "IP Whitelist updated successfully" };
  } catch (error) {
    console.error("IP Whitelist Error:", error);
    return { error: INTERNAL_SERVER_ERROR };
  }
};

/**
 * Reset 2FA Secret (Forces re-setup on next login)
 */
export const resetTwoFactorSecret = async () => {
  try {
    const admin = await findCurrentUser();
    if (!admin) return { error: "Authentication failed" };

    await db.admin.update({
      where: { id: admin.id },
      data: { twoFactorSecret: null },
    });

    revalidatePath("/account");
    return {
      success:
        "2FA secret reset. You will be prompted to scan a new QR code on your next login.",
    };
  } catch (error) {
    console.error("Reset 2FA Error:", error);
    return { error: INTERNAL_SERVER_ERROR };
  }
};

/**
 * Fetch Admin Account Overview & System Stats from DB
 */
export const getAdminOverviewData = async () => {
  try {
    const admin = await findCurrentUser();
    if (!admin) return { error: "Authentication failed" };

    // Fetch full current admin profile with connected E-Wallets
    const currentAdminData = await db.admin.findUnique({
      where: { id: admin.id },
      include: {
        eWallet: {
          include: {
            eWallet: true,
          },
        },
      },
    });

    // Fetch team admins
    const teamAdmins = await db.admin.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
        twoFactorSecret: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Fetch high-level platform stats for admin dashboard context
    const [totalUsers, totalAgents, totalEWallets] = await Promise.all([
      db.users.count(),
      db.agent.count(),
      db.eWallet.count(),
    ]);

    return {
      success: true,
      data: {
        admin: currentAdminData,
        teamAdmins,
        stats: {
          totalUsers,
          totalAgents,
          totalEWallets,
        },
      },
    };
  } catch (error) {
    console.error("Get Admin Data Error:", error);
    return { error: INTERNAL_SERVER_ERROR };
  }
};

export const nameChange = async (data: NameChangeSchema) => {
  try {
    const { name } = data;

    if (!name || name.trim() === "") {
      return { error: "Name cannot be empty" };
    }

    const admin = await findCurrentUser();
    if (!admin) return { error: "Authentication failed" };

    await db.admin.update({
      where: { id: admin.id },
      data: {
        fullName: name.trim(),
      },
    });

    revalidatePath("/account");
    return { success: "Name updated successfully" };
  } catch (error) {
    console.error("NAME_CHANGE_ERROR", error);
    return { error: INTERNAL_SERVER_ERROR };
  }
};
export const emailChange = async (data: EmailChangeSchema) => {
  try {
    const { newEmail, token } = data;

    const admin = await findCurrentUser();
    if (!admin) return { error: "Authentication failed" };

    const existingToken = await db.adminEmailVerificationToken.findFirst({
      where: { token: token },
    });

    if (!existingToken) {
      return { error: "Invalid Try" };
    }

    if (token !== existingToken?.token) {
      return { error: "Wrong token" };
    }

    if (new Date() > new Date(existingToken!.expire)) {
      return { error: "Token was Expired" };
    }

    await db.adminEmailVerificationToken.delete({
      where: { id: existingToken.id },
    });

    await db.admin.update({
      where: { id: admin.id },
      data: { email: newEmail, twoFAEmail: newEmail },
    });
    return { success: "Email updated successfully" };
  } catch {
    return { error: INTERNAL_SERVER_ERROR };
  }
};
export const sentVerificationMail = async () => {
  try {
    const admin = await findCurrentUser();
    if (!admin) return { error: "Authentication failed" };

    const token = generateOTP(6);

    const tokenHasCreated = await createAdminVerificationToken(token);

    if (!tokenHasCreated) {
      throw Error;
    }

    await sendAdminVerificationTokenMail(admin.email, token);

    return { success: "Verification email sent" };
  } catch {
    return { error: INTERNAL_SERVER_ERROR };
  }
};

export const passwordChange = async (data: PasswordChangeSchema) => {
  try {
    const { currentPassword, newPassword } = data;
    const admin = await findAdmin();
    if (!admin) return { error: "Authentication failed" };

    const isPasswordMatch = await bcrypt.compare(
      currentPassword,
      admin.password,
    );

    if (!isPasswordMatch) {
      return { error: "Current password is incorrect" };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.admin.update({
      where: { id: admin.id },
      data: {
        password: hashedPassword,
      },
    });

    return { success: "Password changed successfully" };
  } catch {
    return { error: INTERNAL_SERVER_ERROR };
  }
};

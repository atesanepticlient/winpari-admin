"use server";

import { findAdmin } from "@/data/admin";
import { INTERNAL_SERVER_ERROR } from "@/error";
import { createAdminVerificationToken } from "@/helpers/token";
import { findCurrentUser } from "@/lib/admin";
import { db } from "@/lib/db";
import { sendAdminVerificationTokenMail } from "@/lib/email";
import { generateOTP } from "@/lib/helpers";
import nodemailer from "nodemailer";
import {
  EmailChangeSchema,
  NameChangeSchema,
  PasswordChangeSchema,
  requestEmailOtpSchema,
  RequestEmailOtpSchema,
  verifyEmailOtpSchema,
  VerifyEmailOtpSchema,
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

// Configure Nodemailer with Zoho SMTP credentials
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.zoho.com",
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

/**
 * Step 1: Send OTP to admin.twoFAEmail
 */
export async function requestEmailChangeOtp(data: RequestEmailOtpSchema) {
  try {
    const validated = requestEmailOtpSchema.parse(data);
    const session = await findCurrentUser();

    if (!session?.id) {
      return { error: "Unauthorized access" };
    }

    const admin = await db.admin.findUnique({
      where: { id: session.id },
    });

    if (!admin) {
      return { error: "Admin account not found" };
    }

    if (!admin.twoFAEmail) {
      return { error: "No 2FA email configured for this account" };
    }

    // 1. Verify current password
    const isPasswordValid = await bcrypt.compare(
      validated.currentPassword,
      admin.password,
    );
    if (!isPasswordValid) {
      return { error: "Incorrect current password" };
    }

    // 2. Check if new email is already in use
    if (admin.email === validated.newEmail) {
      return { error: "New email must be different from current email" };
    }

    const existingEmail = await db.admin.findUnique({
      where: { email: validated.newEmail },
    });

    if (existingEmail) {
      return { error: "This email address is already in use" };
    }

    // 3. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Delete existing tokens for this admin
    await db.adminVerificationToken.deleteMany({
      where: { adminId: admin.id },
    });

    // Save token to DB
    await db.adminVerificationToken.create({
      data: {
        adminId: admin.id,
        newEmail: validated.newEmail,
        token: otp,
        expiresAt,
      },
    });

    // 4. Send Email via SMTP directly to twoFAEmail
    await transporter.sendMail({
      from: `"Admin Security" <${process.env.SMTP_USER || "admin@winparibet.com"}>`,
      to: admin.twoFAEmail, // <--- Sent to registered twoFAEmail
      subject: "Email Change Security Authorization OTP",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a;">Email Change Security Authorization</h2>
          <p>A request was made to update your primary admin email address to <strong>${validated.newEmail}</strong>.</p>
          <p>Your 6-digit verification authorization code is:</p>
          <div style="background-color: #f1f5f9; padding: 15px; text-align: center; border-radius: 6px; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #0284c7;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
            This code will expire in 10 minutes. If you did not request this change, please secure your account immediately.
          </p>
        </div>
      `,
    });

    return {
      success: true,
      message: "OTP sent to your 2FA security email address",
    };
  } catch (error: any) {
    console.log({ error });
    return { error: error.message || "Failed to send OTP code" };
  }
}

/**
 * Step 2: Verify OTP & update the Admin's email
 */
export async function verifyAndChangeEmail(data: VerifyEmailOtpSchema) {
  try {
    const validated = verifyEmailOtpSchema.parse(data);
    const session = await findCurrentUser();

    if (!session?.id) {
      return { error: "Unauthorized access" };
    }

    // Retrieve active token
    const verificationRecord = await db.adminVerificationToken.findFirst({
      where: {
        adminId: session.id,
        token: validated.otp,
      },
    });

    if (!verificationRecord) {
      return { error: "Invalid OTP code" };
    }

    if (new Date() > verificationRecord.expiresAt) {
      await db.adminVerificationToken.delete({
        where: { id: verificationRecord.id },
      });
      return { error: "OTP code has expired. Please request a new one." };
    }

    // Update Email in DB
    await db.admin.update({
      where: { id: session.id },
      data: { email: verificationRecord.newEmail },
    });

    // Delete used verification token
    await db.adminVerificationToken.delete({
      where: { id: verificationRecord.id },
    });

    return { success: true, message: "Email updated successfully" };
  } catch (error: any) {
    return { error: error.message || "Failed to verify OTP" };
  }
}

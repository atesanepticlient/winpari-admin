import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import {
  CREDENTICALS_INCORRECT,
  IP_NOT_WHITELISTED,
  INVALID_TOTP,
} from "./error";
import { getClientIp, isIpWhitelisted } from "./lib/ip";
import { verifyTOTPToken } from "./lib/totp";

export const config = {
  runtime: "nodejs",
};

export default {
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { name: "email", type: "email" },
        password: { name: "password", type: "password" },
        token: { name: "token", type: "text" },
      },

      async authorize(credentials) {
        const { email, password, token } = credentials;

        const admin = await db.admin.findUnique({
          where: { email: email as string },
        });

        if (!admin || !admin.twoFactorSecret) {
          return null;
        }

        // Verify TOTP Token
        const isValidToken = await verifyTOTPToken(
          token as string,
          admin.twoFactorSecret,
        );

        if (!isValidToken) {
          throw new Error("Invalid 2FA authentication code.");
        }

        return admin;
      },
    }),
  ],
} satisfies NextAuthConfig;

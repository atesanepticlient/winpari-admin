"use server";
import { signIn } from "@/auth";
import {
  CREDENTICALS_INCORRECT,
  INTERNAL_SERVER_ERROR,
  WRONG_TOKEN,
  TOKEN_EXPIRED,
} from "@/error";
import { createAdminVerificationToken } from "@/helpers/token";
import { db } from "@/lib/db";
import { sendAdminVerificationTokenMail } from "@/lib/email";
import { generateOTP } from "@/lib/helpers";
import { loginSchema } from "@/schema";
import bcrypt from "bcryptjs";
import { CredentialsSignin } from "next-auth";
import zod from "zod";

export const createVerification = async (
  data: zod.infer<typeof loginSchema>
) => {
  try {
    const { password, email } = data;

    const admin = await db.admin.findUnique({ where: { email } });

    if (!admin) {
      return { error: CREDENTICALS_INCORRECT };
    }

    const hasPasswordMatched = await bcrypt.compare(password, admin.password);

    if (!hasPasswordMatched) {
      return { error: CREDENTICALS_INCORRECT };
    }

    const token = generateOTP(6);

    const hasTokenCreated = await createAdminVerificationToken(token);
    if (!hasTokenCreated) {
      throw Error;
    }

    await sendAdminVerificationTokenMail(admin.twoFAEmail, token);
    // if (!hasEmailSent) {
    //   throw Error;
    // }

    return { success: true };
  } catch (error) {
    console.error("LOGIN ERROR ", error);
    return { error: INTERNAL_SERVER_ERROR };
  }
};

export const verifyAdmin = async (data: zod.infer<typeof loginSchema>) => {
  try {
    const { email, password, token } = data;
    const existingToken = await db.adminEmailVerificationToken.findFirst({
      where: {},
    });

    if (!existingToken) {
      throw Error;
    }

    if (token !== existingToken?.token) {
      //Verify token
      return { error: WRONG_TOKEN };
    }

    if (new Date() > new Date(existingToken!.expire)) {
      return { error: TOKEN_EXPIRED };
    }

    await db.adminEmailVerificationToken.delete({
      where: { id: existingToken.id },
    });

    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return { success: "Login successfull" };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name !== "AccessDenied") {
        const credentialsError = error as CredentialsSignin;
        return { error: credentialsError?.cause?.err?.message };
      }
    }
    return { error: INTERNAL_SERVER_ERROR };
  }
};

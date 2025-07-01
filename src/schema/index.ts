import zod from "zod";

export const loginSchema = zod.object({
  email: zod.string().email("Invalid emaill address"),
  password: zod.string().min(1, "Password is required"),
  token: zod.optional(zod.string()),
});

export const agentRechargeSchema = zod.object({
  amount: zod.string().min(1, "Amount required"),
});

export const eWalletWithdrawInformationUpdateSchema = zod.object({
  min: zod.optional(zod.string()),
  max: zod.optional(zod.string()),
  range: zod.optional(zod.array(zod.string())),
});

export const eWalletDepositInformationUpdateSchema = zod.object({
  min: zod.optional(zod.string()),
  max: zod.optional(zod.string()),
  range: zod.optional(zod.array(zod.string())),
  walletNumber: zod.optional(zod.string()),
});

export const passwordMatcherSchema = zod.object({
  currentPassword: zod.string().min(1, "Current Password is Required"),
});

export const VerificationCodeSchema = zod.object({
  token: zod
    .string()
    .min(6, "It should be a 6 Digit Code")
    .max(6, "It should be a 6 Digit Code"),
});

export const passwordChangeSchema = zod
  .object({
    newPassword: zod.string().min(1, "Password must be at least 6 characters"),
    confirmNewPassword: zod.string().min(1, "Confirm Password is Required"),
  })
  .refine(
    (data) => {
      if (data.newPassword) {
        return data.newPassword == data.confirmNewPassword;
      }
      return true;
    },
    { path: ["confirmNewPassword"], message: "Confirm Password did not match" }
  );

export const gmailChangeSchema = zod.object({
  newGmail: zod.string().email("Enter a valid Gmail address"),
});

export const contactUpdateSchema = zod.object({
  email: zod.optional(zod.string().email()),
  telegram: zod.optional(zod.string()),
  facebook: zod.optional(zod.string()),
});

export const promoCodeUpdateSchema = zod.object({
  promo: zod.string(),
});

export const bonusUpdateSchema = zod.object({
  deposit: zod.string().min(1, "Deposit Bonus is require"),
});

export const addBankingSchema = zod.object({
  bankingId: zod.string(),
});

export const walletCreateSchema = zod.object({
  walletImage: zod.string().min(1, "Image is required"),
  walletName: zod.string().min(1, "Wallet Name is required"),
  walletNumber: zod.string().min(1, "Wallet name is required"),
});

export type WalletCreateSchema = zod.infer<typeof walletCreateSchema>;

export const walletUpdateSchema = zod.object({
  walletNumber: zod.string().min(1, "Wallet name is required"),
  minDeposit: zod.string().min(1, "Minimum deposit is required"),
  maxDeposit: zod.string().min(1, "Maximum deposit is required"),
  rules: zod.optional(zod.string()),
  isRecommended: zod.optional(zod.boolean()),
  isActive: zod.optional(zod.boolean()),
  trxType: zod.string().min(1, "Trx Type is reqiured"),
});
export type WalletUpdateSchema = zod.infer<typeof walletUpdateSchema>;

export const rechargeSignleUserSchema = zod.object({
  id: zod.string().min(1, "User id is required"),
  message: zod.optional(zod.string()),
  amount: zod.string().min(1, "Amount is required"),
});
export type RechargeSignleUserSchema = zod.infer<
  typeof rechargeSignleUserSchema
>;

export const suspensionSchema = zod.object({
  id: zod.string().min(1, "User id is required"),
  message: zod.optional(zod.string()),
});
export type SuspensionSchema = zod.infer<typeof suspensionSchema>;

export const createMessageSchema = zod.object({
  message: zod.string().min(1, "Message is required"),
  id: zod.string().min(1, "User id is required"),
});

export type CreateMessageSchema = zod.infer<typeof createMessageSchema>;

export const nameChangeSchema = zod.object({
  name: zod.string().min(1, "Name is required"),
});
export type NameChangeSchema = zod.infer<typeof nameChangeSchema>;

export const adminPasswordChangeSchema = zod.object({
  currentPassword: zod.string().min(1, "Current password is required"),
  newPassword: zod.string().min(6, "Password should be at least 6 char"),
});
export type PasswordChangeSchema = zod.infer<typeof adminPasswordChangeSchema>;
export const emailChangeSchema = zod.object({
  token: zod.string().min(1, "Token is required"),
  newEmail: zod
    .string()
    .min(1, "Email is required")
    .regex(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      "Enter a valid Email"
    ),
});
export type EmailChangeSchema = zod.infer<typeof emailChangeSchema>;

export const contactSchema = zod
  .object({
    facebook: zod
      .string()
      .url({ message: "Invalid Facebook URL" })
      .optional()
      .or(zod.literal("")),
    telegram: zod
      .string()
      .url({ message: "Invalid Telegram URL" })
      .optional()
      .or(zod.literal("")),
    email: zod
      .string()
      .email({ message: "Invalid Email" })
      .optional()
      .or(zod.literal("")),
    instagram: zod
      .string()
      .url({ message: "Invalid Instagram URL" })
      .optional()
      .or(zod.literal("")),
    twitter: zod
      .string()
      .url({ message: "Invalid Twitter URL" })
      .optional()
      .or(zod.literal("")),
    youtube: zod
      .string()
      .url({ message: "Invalid YouTube URL" })
      .optional()
      .or(zod.literal("")),
  })
  .refine(
    (data) => Object.values(data).some((value) => value && value.trim() !== ""),
    {
      message: "At least one field must be filled.",
      path: [], // global error
    }
  );

export type ContactFormData = zod.infer<typeof contactSchema>;

export const siteUpdateSchema = zod.object({
  minWithdraw: zod.optional(zod.string()),
  maxWithdraw: zod.optional(zod.string()),
  minAgWithdraw: zod.optional(zod.string()),
  maxAgWithdraw: zod.optional(zod.string()),
  turnover: zod.optional(zod.string()),
  referBonuseMainUser: zod.optional(zod.string()),
  referBonuseRefererUser: zod.optional(zod.string()),
  firstDepositBonus: zod.optional(zod.string()),
  minAgentPayout: zod.optional(zod.string()),
  maxAgentPayout: zod.optional(zod.string()),
  agentDepositEarning: zod.optional(zod.string()),
  agentWithdrawEarning: zod.optional(zod.string()),
  maxAgDeposit: zod.optional(zod.string()),
  minAgDeposit: zod.optional(zod.string()),
  minAgentSecurityMoney: zod.optional(zod.string()),
});

export type SiteUpdateSchema = zod.infer<typeof siteUpdateSchema>;

export const multipleRecharge = zod.object({
  message: zod.optional(zod.string()),
  amount: zod.string().min(1, "Amount is required"),
  users: zod.array(zod.string()).min(1, "Select Minimul one user"),
});

export type MultipleRecharge = zod.infer<typeof multipleRecharge>;

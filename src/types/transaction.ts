import { PaymentHistory, PaymentStatus, WithdrawStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

// types/transaction.ts
export type Transaction = {
  id: string;
  amount: number | Decimal;
  status?: PaymentStatus | WithdrawStatus;
  createdAt: Date | string;
  type: "DEPOSIT" | "WITHDRAWAL" | "AGENT_DEPOSIT" | "AGENT_WITHDRAWAL";
  // Additional fields based on type
  transactionId?: string;
  payFrom?: string;
  paymentWalletNumber?: string;
  withdrawCode?: string;
  agent?: {
    fullName: string;
    id: string;
  };
  transactions?: PaymentHistory;
};

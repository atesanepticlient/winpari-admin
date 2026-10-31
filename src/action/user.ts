"use server";

import { INTERNAL_SERVER_ERROR } from "@/error";
import { db } from "@/lib/db";

export const userDelete = async (userId: string) => {
  try {
    const user = await db.users.findUnique({
      where: { id: userId },
      include: { wallet: true, bonusWallet: true, referral: true },
    });

    if (!user) return { error: "User not found" };
    if (user.role === "ADMIN")
      return { error: "Cannot delete an admin account" };

    // Guard: don't delete while money or bets are in flight
    const [
      pendingDeposits,
      pendingWithdraws,
      pendingAgentWithdraws,
      runningBets,
      runningSports,
    ] = await Promise.all([
      db.deposit.count({ where: { userId, status: "PENDING" } }),
      db.withdraw.count({ where: { userId, status: "PENDING" } }),
      db.agentWithdrawRecord.count({ where: { userId, status: "PENDING" } }),
      db.bettingRecord.count({ where: { userId, status: "RUNNING" } }),
      db.bettingRecordSports.count({ where: { userId, status: "RUNNING" } }),
    ]);

    if (pendingDeposits || pendingWithdraws || pendingAgentWithdraws) {
      return { error: "User has pending deposits or withdrawals" };
    }
    if (runningBets || runningSports) {
      return { error: "User has running bets" };
    }
    if (user.wallet?.balance.gt(0) || user.bonusWallet?.balance.gt(0)) {
      return { error: "User still has a wallet balance" };
    }

    await db.$transaction([
      // 1. Payment history first (it points to Deposit and Withdraw)
      db.paymentHistory.deleteMany({ where: { userId } }),

      // 2. Payment records
      db.deposit.deleteMany({ where: { userId } }),
      db.withdraw.deleteMany({ where: { userId } }),
      db.aPayDeposit.deleteMany({ where: { userId } }),
      db.aPayWithdraw.deleteMany({ where: { userId } }),

      // 3. Agent records
      db.agentDepositRecord.deleteMany({ where: { userId } }),
      db.agentWithdrawRecord.deleteMany({ where: { userId } }),

      // 4. Betting
      db.bettingRecordSports.deleteMany({ where: { userId } }),
      db.sportsGameSession.deleteMany({ where: { userId } }),
      db.bettingRecord.deleteMany({ where: { userId } }),

      // 5. Bonuses, wallets, turnover, messages
      db.payinBonus.deleteMany({ where: { userId } }),
      db.cashback.deleteMany({ where: { userId } }),
      db.message.deleteMany({ where: { userId } }),
      db.usersTurnOver.deleteMany({ where: { userId } }),
      db.wallet.deleteMany({ where: { userId } }),
      db.bonusWallet.deleteMany({ where: { userId } }),

      // 6. Referral: users this person referred point at this Referral row,
      //    so detach them first, then delete it
      ...(user.referral
        ? [
            db.users.updateMany({
              where: { referredById: user.referral.id },
              data: { referredById: null },
            }),
            db.referral.delete({ where: { id: user.referral.id } }),
          ]
        : []),

      // 7. Email verification tokens (linked by email, no FK)
      ...(user.email
        ? [db.verificationToken.deleteMany({ where: { email: user.email } })]
        : []),

      // 8. Finally the user
      db.users.delete({ where: { id: userId } }),
    ]);

    return { success: true };
  } catch (error) {
    console.error("userDelete failed:", error);
    return { error: INTERNAL_SERVER_ERROR };
  }
};

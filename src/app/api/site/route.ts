import { INTERNAL_SERVER_ERROR } from "@/error";
import { db } from "@/lib/db";

export const GET = async () => {
  try {
    const [bonusSetting, depositWallets, withdrawWallets] = await Promise.all([
      db.bonusSetting.upsert({
        where: { id: "global" },
        update: {},
        create: {
          id: "global",
          firstPayin: 0.1, // 10%
          firstPayinUpTo: 1000,
          referPayin: 0.05, // 5%
          referPayinUpTo: 500,
          inviationCode: 0.02, // 2%
          inviationCodeUpTo: 200,
        },
      }),
      db.depositEWallet.findMany({
        where: { isActive: true },
        select: {
          id: true,
          walletName: true,
          minDeposit: true,
          maxDeposit: true,
          category: true,
        },
      }),
      db.withdrawEWallet.findMany({
        where: { isActive: true },
        select: {
          id: true,
          walletName: true,
          minWithdraw: true,
          maxWithdraw: true,
          category: true,
        },
      }),
    ]);

    return Response.json(
      {
        success: true,
        payload: {
          bonusSetting,
          depositWallets,
          withdrawWallets,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return Response.json({ message: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
};

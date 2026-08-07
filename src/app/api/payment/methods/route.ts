import { INTERNAL_SERVER_ERROR } from "@/error";
import { db } from "@/lib/db";
import { NextRequest } from "next/server";

export const GET = async () => {
  try {
    const depositWallets = await db.depositEWallet.findMany({
      include: {
        cryptoWallet: true, // network, address, qrCodeImage for CRYPTO wallets
        withdrawWallet: true, // linked WithdrawEWallet row — minWithdraw/maxWithdraw
      },
    });

    return Response.json(
      {
        success: true,
        payload: depositWallets.reverse(),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("List wallets error:", error);
    return Response.json({ message: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const {
      walletName,
      walletImage,
      minDeposit = 100,
      maxDeposit = 1000,
      minWithdraw = 100,
      maxWithdraw = 10000,
      category = "MOBILE_BANKING",
      isRecommended = false,
      isActive = true,
      cryptoData,
    } = body;

    if (!walletName || !walletImage) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (category === "CRYPTO" && !cryptoData?.currencyCode) {
      return Response.json(
        { error: "Currency code is required for crypto gateways" },
        { status: 400 },
      );
    }

    const createdWallet = await db.$transaction(async (tx) => {
      const withdrawWallet = await tx.withdrawEWallet.create({
        data: {
          walletName,
          walletImage,
          minWithdraw,
          maxWithdraw,
          category,
          isRecommended,
          isActive,
        },
      });

      return tx.depositEWallet.create({
        data: {
          walletName,
          walletImage,
          minDeposit,
          maxDeposit,
          category,
          isRecommended,
          isActive,
          withdrawWalletId: withdrawWallet.id,
          ...(category === "CRYPTO" && cryptoData
            ? {
                cryptoWallet: {
                  create: {
                    currencyCode: cryptoData.currencyCode,
                    network: cryptoData.network ?? "",
                    address: cryptoData.address ?? "",
                    qrCodeImage: cryptoData.qrCodeImage ?? null,
                    memo: cryptoData.memo ?? null,
                  },
                },
              }
            : {}),
        },
        include: { cryptoWallet: true, withdrawWallet: true },
      });
    });

    return Response.json(
      { success: true, message: "Wallet created", payload: createdWallet },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create wallet error:", error);
    return Response.json({ message: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
};

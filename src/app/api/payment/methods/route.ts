import { INTERNAL_SERVER_ERROR } from "@/error";
import { db } from "@/lib/db";
import { NextRequest } from "next/server";

export const GET = async () => {
  try {
    const depositWallets = await db.depositEWallet.findMany({
      include: {
        cryptoWallet: true, // Includes network, address, qrCodeImage if it's a crypto wallet
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
      category = "MOBILE_BANKING",
      isRecommended = false,
      isActive = true,
      cryptoData, // Optional object containing { currencyCode, network, address, qrCodeImage, memo }
    } = body;

    if (!walletName || !walletImage) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const createdWallet = await db.depositEWallet.create({
      data: {
        walletName,
        walletImage,
        minDeposit,
        maxDeposit,
        category,
        isRecommended,
        isActive,
        ...(category === "CRYPTO" && cryptoData
          ? {
              cryptoWallet: {
                create: {
                  currencyCode: cryptoData.currencyCode,
                  network: cryptoData.network,
                  address: cryptoData.address,
                  qrCodeImage: cryptoData.qrCodeImage,
                  memo: cryptoData.memo,
                },
              },
            }
          : {}),
      },
      include: {
        cryptoWallet: true,
      },
    });

    return Response.json(
      { success: true, message: "Wallet created", payload: createdWallet },
      { status: 201 },
    );
  } catch (error) {
    return Response.json({ message: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
};

import { INTERNAL_SERVER_ERROR } from "@/error";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";

export const PUT = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;
    const {
      walletName,
      walletImage,
      minDeposit,
      maxDeposit,
      minWithdraw,
      maxWithdraw,
      category,
      isRecommended,
      isActive,
      currencyCode,
      network,
      address,
      qrCodeImage,
      memo,
    } = await req.json();

    const existing = await db.depositEWallet.findUnique({
      where: { id },
      select: { withdrawWalletId: true, walletName: true, walletImage: true },
    });

    if (!existing) {
      return Response.json({ message: "Wallet not found" }, { status: 404 });
    }

    const depositPayload: Prisma.DepositEWalletUpdateInput = {
      isRecommended: !!isRecommended,
      isActive: !!isActive,
    };
    if (walletName) depositPayload.walletName = walletName;
    if (walletImage) depositPayload.walletImage = walletImage;
    if (minDeposit !== undefined && minDeposit !== "")
      depositPayload.minDeposit = new Prisma.Decimal(minDeposit);
    if (maxDeposit !== undefined && maxDeposit !== "")
      depositPayload.maxDeposit = new Prisma.Decimal(maxDeposit);
    if (category) depositPayload.category = category;

    if (category === "CRYPTO" && (currencyCode || network || address)) {
      depositPayload.cryptoWallet = {
        upsert: {
          create: {
            currencyCode: currencyCode ?? "",
            network: network ?? "",
            address: address ?? "",
            qrCodeImage: qrCodeImage ?? null,
            memo: memo ?? null,
          },
          update: {
            ...(currencyCode && { currencyCode }),
            ...(network && { network }),
            ...(address && { address }),
            ...(qrCodeImage !== undefined && { qrCodeImage }),
            ...(memo !== undefined && { memo }),
          },
        },
      };
    }

    const withdrawPayload: Prisma.WithdrawEWalletUpdateInput = {
      isRecommended: !!isRecommended,
      isActive: !!isActive,
    };
    if (walletName) withdrawPayload.walletName = walletName;
    if (walletImage) withdrawPayload.walletImage = walletImage;
    if (minWithdraw !== undefined && minWithdraw !== "")
      withdrawPayload.minWithdraw = new Prisma.Decimal(minWithdraw);
    if (maxWithdraw !== undefined && maxWithdraw !== "")
      withdrawPayload.maxWithdraw = new Prisma.Decimal(maxWithdraw);
    if (category) withdrawPayload.category = category;

    await db.$transaction(async (tx) => {
      await tx.depositEWallet.update({ where: { id }, data: depositPayload });

      if (existing.withdrawWalletId) {
        // Linked already — just update it
        await tx.withdrawEWallet.update({
          where: { id: existing.withdrawWalletId },
          data: withdrawPayload,
        });
      } else {
        // No withdraw row linked yet — create one now and link it
        const newWithdrawWallet = await tx.withdrawEWallet.create({
          data: {
            walletName: walletName || existing.walletName,
            walletImage: walletImage || existing.walletImage,
            minWithdraw:
              minWithdraw !== undefined && minWithdraw !== ""
                ? new Prisma.Decimal(minWithdraw)
                : 100,
            maxWithdraw:
              maxWithdraw !== undefined && maxWithdraw !== ""
                ? new Prisma.Decimal(maxWithdraw)
                : 10000,
            category: category || "MOBILE_BANKING",
            isRecommended: !!isRecommended,
            isActive: !!isActive,
          },
        });
        await tx.depositEWallet.update({
          where: { id },
          data: { withdrawWalletId: newWithdrawWallet.id },
        });
      }
    });

    return Response.json({ message: "Wallet Updated" }, { status: 200 });
  } catch (error) {
    console.error("Update wallet error:", error);
    return Response.json({ message: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
};

export const DELETE = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;

    const existing = await db.depositEWallet.findUnique({
      where: { id },
      select: { withdrawWalletId: true },
    });

    await db.$transaction(async (tx) => {
      await tx.depositEWallet.delete({ where: { id } });
      if (existing?.withdrawWalletId) {
        await tx.withdrawEWallet.delete({
          where: { id: existing.withdrawWalletId },
        });
      }
    });

    return Response.json({ message: "Wallet Deleted" }, { status: 200 });
  } catch (error) {
    console.error("Delete wallet error:", error);
    return Response.json({ message: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
};

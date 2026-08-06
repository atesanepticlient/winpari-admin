import { INTERNAL_SERVER_ERROR } from "@/error";
import { db } from "@/lib/db";
import { Prisma, WalletCategory } from "@prisma/client";
import { NextRequest } from "next/server";

export const PUT = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;
    const change = new URL(req.url).searchParams.get("change") as
      | "accept"
      | "reject";
    if (change !== "accept" && change !== "reject") {
      return Response.json({ message: "Invalid Route" }, { status: 400 });
    }

    const { message } = await req.json();

    // Fetch the withdraw with its e-wallet so we know whether it's a
    // mobile-banking withdraw (manual review) or a crypto withdraw.
    const withdraw = await db.withdraw.findUnique({
      where: { id },
      include: { withdrawEWallet: true },
    });

    if (!withdraw) {
      return Response.json({ message: "Withdraw not found" }, { status: 404 });
    }

    // Only crypto withdraws can be manually accepted/rejected by an admin.
    // Mobile banking (e-wallet) withdraws are view-only here.
    if (withdraw.withdrawEWallet?.category !== WalletCategory.CRYPTO) {
      return Response.json(
        { message: "Only crypto withdraws can be approved or rejected here" },
        { status: 403 },
      );
    }

    if (withdraw.status !== "PENDING") {
      return Response.json(
        { message: "This withdraw has already been processed" },
        { status: 400 },
      );
    }

    const updateData: Prisma.WithdrawUpdateInput = {};
    if (change == "accept") {
      updateData.status = "ACCEPTED";
    } else if (change == "reject") {
      updateData.status = "REJECTED";
    }
    const updatedWithdraw = await db.withdraw.update({
      where: {
        id,
      },
      data: { ...updateData },
    });

    if (message) {
      await db.message.create({
        data: {
          title: message,
          user: {
            connect: {
              id: updatedWithdraw.userId,
            },
          },
        },
      });
    }

    return Response.json({ message: "Withdraw Updated" });
  } catch (error) {
    console.log({ error });
    return Response.json({ message: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
};

export const DELETE = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;

    await db.withdraw.delete({ where: { id } });
    return Response.json({ message: "Deposit Deleted" }, { status: 200 });
  } catch {
    return Response.json({ message: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
};
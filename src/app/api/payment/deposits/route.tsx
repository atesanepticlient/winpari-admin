import { INTERNAL_SERVER_ERROR } from "@/error";
import { db } from "@/lib/db";
import { PaymentStatus, Prisma } from "@prisma/client";
import { NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const gateway = searchParams.get("gateway");
    const minAmount = searchParams.get("minAmount");
    const maxAmount = searchParams.get("maxAmount");
    const status = searchParams.get("status") as PaymentStatus & "ALL";
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");

    const where: Prisma.DepositWhereInput = {};

    // Widened to match what the UI actually promises ("TRX ID, User ID...").
    // Previously this only matched user.phone, so searching by deposit id,
    // player id, or email silently returned nothing.
    if (search) {
      where.OR = [
        { id: { contains: search, mode: "insensitive" } },
        { user: { phone: { contains: search, mode: "insensitive" } } },
        { user: { playerId: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (from || to) {
      where.createdAt = {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      };
    }

    // BUG FIX: `where.ewallet!.walletName = gateway` assigned a property to
    // `undefined` at runtime (the `!` only silences TypeScript) and threw,
    // which the outer try/catch turned into a silent 500 any time a gateway
    // filter was selected. `ewallet` is a required relation on Deposit, so
    // Prisma accepts the fields object directly here.
    if (gateway) {
      where.ewallet = { walletName: gateway };
    }

    if (minAmount || maxAmount) {
      where.amount = {
        ...(minAmount && { gte: parseFloat(minAmount) }),
        ...(maxAmount && { lte: parseFloat(maxAmount) }),
      };
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    const deposits = await db.deposit.findMany({
      where,
      include: { user: { include: { wallet: true } }, ewallet: true },
      orderBy: { createdAt: "asc" },
      take: limit,
      skip: limit * (page - 1),
    });

    // BUG FIX: was `count({ where: {} })`, i.e. always the total across ALL
    // deposits regardless of filters. That made "Showing X of Y" and the
    // pagination buttons wrong any time a filter was active. Now counts
    // against the same `where` used for the page of results.
    const totalFound = await db.deposit.count({ where });

    return Response.json(
      { payload: { deposits, totalFound } },
      { status: 200 },
    );
  } catch (error) {
    console.log({ error });
    return Response.json({ message: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
};

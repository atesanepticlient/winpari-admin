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

    // Search across deposit ID, phone, player ID, and email
    if (search) {
      where.OR = [
        { id: { contains: search, mode: "insensitive" } },
        { user: { phone: { contains: search, mode: "insensitive" } } },
        { user: { playerId: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Date range filtering
    if (from || to) {
      where.createdAt = {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      };
    }

    // Gateway filtering - includes both CRYPTO and MOBILE_BANKING deposits
    if (gateway) {
      where.ewallet = { walletName: gateway };
    }

    // Amount range filtering
    if (minAmount || maxAmount) {
      where.amount = {
        ...(minAmount && { gte: parseFloat(minAmount) }),
        ...(maxAmount && { lte: parseFloat(maxAmount) }),
      };
    }

    // Status filtering
    if (status && status !== "ALL") {
      where.status = status;
    }

    const deposits = await db.deposit.findMany({
      where,
      include: {
        user: {
          include: { wallet: true },
        },
        ewallet: true,
      },
      orderBy: { createdAt: "desc" }, // ✅ FIX: Most recent first (was "asc")
      take: limit,
      skip: limit * (page - 1),
    });

    // Count total matching the filter criteria
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

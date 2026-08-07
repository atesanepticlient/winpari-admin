import { INTERNAL_SERVER_ERROR } from "@/error";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);

    // Filters
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || "";

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10", 10));
    const skip = (page - 1) * limit;

    const query: Prisma.UsersWhereInput = {};

    if (status === "banned") {
      query.isBanned = true;
    } else if (status === "unbanned") {
      query.isBanned = false;
    }
    console.log({query})
    if (search) {
      query.OR = [
        { playerId: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Total count for pagination
    const total = await db.users.count({ where: query });

    const rawUsers = await db.users.findMany({
      where: query,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        wallet: true,
        bettingRecord: true,
        sportsBettingRecords: true, // Prisma relation name
      },
      skip,
      take: limit,
    });

    const users = rawUsers.map((user: any) => {
      // 1. Sum betAmount from bettingRecord (Casino)
      let casinoTotalBet = 0;
      if (Array.isArray(user.bettingRecord)) {
        casinoTotalBet = user.bettingRecord.reduce(
          (sum: number, rec: any) => sum + (Number(rec.betAmount) || 0),
          0,
        );
      } else if (user.bettingRecord) {
        casinoTotalBet = Number(user.bettingRecord.betAmount) || 0;
      }

      // 2. Sum betAmount from sportsBettingRecords (Sports)
      let sportsTotalBet = 0;
      if (Array.isArray(user.sportsBettingRecords)) {
        sportsTotalBet = user.sportsBettingRecords.reduce(
          (sum: number, rec: any) => sum + (Number(rec.betAmount) || 0),
          0,
        );
      } else if (user.sportsBettingRecords) {
        sportsTotalBet = Number(user.sportsBettingRecords.betAmount) || 0;
      }

      // 3. Combined Total Bet
      const grandTotalBet = casinoTotalBet + sportsTotalBet;

      return {
        ...user,
        calculatedStats: {
          casinoTotalBet,
          sportsTotalBet,
          grandTotalBet,
        },
      };
    });

    return Response.json({
      payload: {
        total,
        page,
        limit,
        users,
      },
    });
  } catch (error) {
    console.error("User list fetch error:", error);
    return Response.json({ message: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
};

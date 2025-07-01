import { INTERNAL_SERVER_ERROR } from "@/error";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);

    // Filters
    const status = searchParams.get("status") || "all"; // banned | unbanned | all
    const search = searchParams.get("search") || "";
    // Pagination
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const query: Prisma.UsersWhereInput = {};

    if (status === "banned") {
      query.isBanned = true;
    } else if (status === "unbanned") {
      query.isBanned = false;
    }

    if (search) {
      query.OR = [
        { playerId: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Total count for pagination
    const total = await db.users.count({ where: query });

    const users = await db.users.findMany({
      where: query,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        wallet: true,
        bettingRecord: true,
      },

      skip,
      take: limit,
    });

    return Response.json({
      payload: {
        total,
        page: +page,
        limit: +limit,
        users: users,
      },
    });
  } catch (error) {
    console.log("user data fetch ", error);
    return Response.json({ message: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
};

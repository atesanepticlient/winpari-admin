import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const type = searchParams.get("type") || "ALL"; // 'ALL' | 'CASINO' | 'SPORTS'

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const fetchCasino = type === "ALL" || type === "CASINO";
    const fetchSports = type === "ALL" || type === "SPORTS";

    const [casinoRecords, sportsRecords] = await Promise.all([
      fetchCasino
        ? db.bettingRecord.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
          })
        : [],
      fetchSports
        ? db.bettingRecordSports.findMany({
            where: { userId },
            include: { session: true },
            orderBy: { createdAt: "desc" },
          })
        : [],
    ]);

    // Map Casino records to standard structure
    const formattedCasino = casinoRecords.map((item) => ({
      id: item.id,
      recordType: "CASINO" as const,
      category: item.category || "SLOT",
      title: item.name || item.category || "Casino Game",
      betAmount: Number(item.betAmount),
      pnl: item.profitNLoss !== null ? Number(item.profitNLoss) : 0,
      status: item.status,
      orderNo: item.orderNo || item.roundId || "-",
      createdAt: item.createdAt.toISOString(),
    }));

    // Map Sports records to standard structure
    const formattedSports = sportsRecords.map((item) => ({
      id: item.id,
      recordType: "SPORTS" as const,
      category: "SPORTS" as const,
      title: `Sports (${item.txType})`,
      betAmount: Number(item.betAmount),
      pnl: Number(item.netAmount), // netAmount = winAmount - betAmount
      status: item.status,
      orderNo: item.transactionId || item.roundId || "-",
      createdAt: item.createdAt.toISOString(),
    }));

    // Merge and sort chronologically (newest first)
    const combinedHistory = [...formattedCasino, ...formattedSports].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return NextResponse.json({ success: true, data: combinedHistory });
  } catch (error) {
    console.error("Error fetching betting history:", error);
    return NextResponse.json(
      { error: "Failed to fetch betting records" },
      { status: 500 },
    );
  }
}

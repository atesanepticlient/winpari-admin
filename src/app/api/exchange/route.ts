import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET current exchange rates
export async function GET(req: NextRequest) {
  try {
    const rates = await db.dollerRate.findUnique({
      where: { id: "global" },
    });

    if (!rates) {
      // Return defaults if not found
      return NextResponse.json({
        bdt: 122,
        pkr: 277,
        inr: 95,
      });
    }

    return NextResponse.json({
      bdt: rates.bdt.toNumber(),
      pkr: rates.pkr.toNumber(),
      inr: rates.inr.toNumber(),
    });
  } catch (error) {
    console.error("Error fetching dollar rates:", error);
    return NextResponse.json(
      { error: "Failed to fetch rates" },
      { status: 500 },
    );
  }
}

// PUT - Update exchange rates
export async function PUT(req: NextRequest) {
  try {
    // Verify admin authorization (add your own auth check)
    // const session = await getServerSession(); // or your auth method
    // if (!session || session.user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body = await req.json();
    const { bdt, pkr, inr } = body;

    // Validate inputs
    if (
      typeof bdt !== "number" ||
      typeof pkr !== "number" ||
      typeof inr !== "number"
    ) {
      return NextResponse.json(
        { error: "All rates must be numbers" },
        { status: 400 },
      );
    }

    if (bdt <= 0 || pkr <= 0 || inr <= 0) {
      return NextResponse.json(
        { error: "All rates must be greater than 0" },
        { status: 400 },
      );
    }

    // Update or create the rates
    const updatedRates = await db.dollerRate.upsert({
      where: { id: "global" },
      update: {
        bdt: bdt,
        pkr: pkr,
        inr: inr,
      },
      create: {
        id: "global",
        bdt: bdt,
        pkr: pkr,
        inr: inr,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Exchange rates updated successfully",
      rates: {
        bdt: updatedRates.bdt.toNumber(),
        pkr: updatedRates.pkr.toNumber(),
        inr: updatedRates.inr.toNumber(),
      },
    });
  } catch (error) {
    console.error("Error updating dollar rates:", error);
    return NextResponse.json(
      { error: "Failed to update rates" },
      { status: 500 },
    );
  }
}

import { INTERNAL_SERVER_ERROR } from "@/error";
import { db } from "@/lib/db";
import { NextRequest } from "next/server";

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;

    const users = await db.users.findMany({
      where: {
        agentId: id,
      },
    });

    return Response.json({ users }, { status: 200 });
  } catch  {
    return Response.json({ error: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
};

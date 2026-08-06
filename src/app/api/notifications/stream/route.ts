import { NextRequest } from "next/server";
import { initDbListener, subscribeToDbEvents } from "@/lib/dbListener";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Ensure the DB listener is running
  await initDbListener();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: any) => {
        const payload = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(new TextEncoder().encode(payload));
      };

      // Unsubscribe when connection closes
      const unsubscribe = subscribeToDbEvents((dbEvent) => {
        let notifType = "";
        let title = "";
        let description = "";

        // Map raw DB insert data to notifications
        if (dbEvent.table === "Deposit") {
          notifType = "DEPOSIT";
          title = "New Deposit Created";
          description = `Deposit of $${dbEvent.data.amount} created (User ID: ${dbEvent.data.userId})`;
        } else if (dbEvent.table === "Withdraw") {
          notifType = "WITHDRAW";
          title = "New Withdraw Request";
          description = `Withdrawal request of $${dbEvent.data.amount} (User ID: ${dbEvent.data.userId})`;
        } else if (dbEvent.table === "Users") {
          notifType = "NEW_USER";
          title = "New User Registered";
          description = `Player ${dbEvent.data.playerId} joined (${dbEvent.data.email || "One-click user"})`;
        } else {
          return;
        }

        send({
          id: dbEvent.data.id,
          type: notifType,
          title,
          description,
          createdAt: dbEvent.data.createdAt || new Date().toISOString(),
          link: `/admin/${notifType.toLowerCase()}s/${dbEvent.data.id}`,
        });
      });

      req.signal.addEventListener("abort", () => {
        unsubscribe();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

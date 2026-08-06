import createSubscriber from "pg-listen";

type NotificationCallback = (event: {
  table: string;
  action: string;
  data: any;
}) => void;

const listeners = new Set<NotificationCallback>();

// Configure connection to PostgreSQL
const subscriber = createSubscriber({
  connectionString: process.env.DATABASE_URL,
});

let isConnected = false;

export async function initDbListener() {
  if (isConnected) return;

  subscriber.notifications.on("admin_db_events", (payload) => {
    try {
      const eventData =
        typeof payload === "string" ? JSON.parse(payload) : payload;
      // Notify all connected SSE client streams
      listeners.forEach((callback) => callback(eventData));
    } catch (err) {
      console.error("Failed to parse pg_notify payload:", err);
    }
  });

  subscriber.events.on("error", (error) => {
    console.error("Postgres notification error:", error);
  });

  await subscriber.connect();
  await subscriber.listenTo("admin_db_events");
  isConnected = true;
  console.log("PostgreSQL listener connected to channel: admin_db_events");
}

export function subscribeToDbEvents(callback: NotificationCallback) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

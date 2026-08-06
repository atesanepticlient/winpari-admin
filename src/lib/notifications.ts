import { pusherServer } from "./pusher-server";

export type NotificationType = "DEPOSIT" | "WITHDRAW" | "NEW_USER";

export interface NotificationPayload {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  createdAt: string;
  link: string;
}

export async function sendAdminNotification(payload: NotificationPayload) {
  try {
    await pusherServer.trigger("admin-channel", "new-notification", payload);
  } catch (error) {
    console.error("Failed to trigger Pusher notification:", error);
  }
}

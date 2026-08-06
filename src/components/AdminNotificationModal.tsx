"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  ArrowDownCircle,
  ArrowUpCircle,
  UserPlus,
  CheckCheck,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import Link from "next/link";
import { pusherClient } from "@/lib/pusher-client";

export type NotificationType = "DEPOSIT" | "WITHDRAW" | "NEW_USER";

export interface AdminNotification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  createdAt: string;
  link: string;
}

export function AdminNotificationModal() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"ALL" | NotificationType>("ALL");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("/sounds/notification.mp3");
  }, []);

  // Fetch initial unread notifications from DB on load
  const fetchUnseenNotifications = async () => {
    try {
      const res = await fetch("/api/admin/notifications/unseen");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Failed to load initial notifications:", err);
    }
  };

  useEffect(() => {
    fetchUnseenNotifications();

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // --- Pusher Realtime Subscription ---
    const channel = pusherClient.subscribe("admin-channel");

    channel.bind("new-notification", (data: AdminNotification) => {
      setNotifications((prev) => [data, ...prev]);

      // Play audio chime
      if (soundEnabled && audioRef.current) {
        audioRef.current.play().catch(() => {});
      }

      // Desktop browser notification when tab is unfocused
      if (
        "Notification" in window &&
        Notification.permission === "granted" &&
        document.hidden
      ) {
        new Notification(data.title, {
          body: data.description,
          icon: "/favicon.ico",
        });
      }
    });

    return () => {
      channel.unbind("new-notification");
      pusherClient.unsubscribe("admin-channel");
    };
  }, [soundEnabled]);

  // ESC Key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const filtered = notifications.filter(
    (n) => activeTab === "ALL" || n.type === activeTab,
  );

  return (
    <>
      {/* 1. TRIGGER BUTTON (Pulsing Glow + Red Count Badge) */}
      <button
        onClick={() => setIsOpen(true)}
        className={`relative group p-2.5 rounded-xl transition-all duration-200 border focus:outline-none ${
          isOpen
            ? "bg-slate-800 text-white border-slate-700 shadow-md"
            : "bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white hover:bg-slate-800"
        }`}
        aria-label="Open notifications"
      >
        <Bell className="w-5 h-5 transition-transform group-hover:scale-105" />

        {notifications.length > 0 && (
          <div className="absolute -top-1.5 -right-1.5 flex items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-red-500/50 blur-[3px] animate-pulse" />
            <span className="relative flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-gradient-to-r from-red-600 to-rose-500 text-[10px] font-bold text-white shadow-lg shadow-red-950/50 border border-slate-950">
              {notifications.length > 99 ? "99+" : notifications.length}
            </span>
          </div>
        )}
      </button>

      {/* 2. CENTERED MODAL OVERLAY */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          {/* Backdrop Click */}
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

          {/* Centered Modal Card */}
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 z-10 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2.5">
                <h3 className="font-semibold text-base">Admin Notifications</h3>
                <span className="bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  Pusher Live
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-md hover:bg-slate-800"
                  title={soundEnabled ? "Sound On" : "Sound Muted"}
                >
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-500" />
                  )}
                </button>
                {notifications.length > 0 && (
                  <button
                    onClick={() => setNotifications([])}
                    className="flex items-center text-xs text-slate-400 hover:text-white transition-colors gap-1 px-2 py-1 rounded-md hover:bg-slate-800"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Clear All
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex text-xs font-medium border-b border-slate-800 bg-slate-900/90">
              {(["ALL", "DEPOSIT", "WITHDRAW", "NEW_USER"] as const).map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 text-center transition-all border-b-2 ${
                      activeTab === tab
                        ? "border-blue-500 text-blue-400 font-semibold"
                        : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {tab === "NEW_USER"
                      ? "Users"
                      : tab.charAt(0) + tab.slice(1).toLowerCase()}
                  </button>
                ),
              )}
            </div>

            {/* Event Feed */}
            <div className="max-h-[26rem] overflow-y-auto divide-y divide-slate-800/60 p-1">
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  No new notifications found.
                </div>
              ) : (
                filtered.map((item) => (
                  <Link
                    key={item.id}
                    href={item.link}
                    onClick={() => setIsOpen(false)}
                    className="flex items-start p-3.5 gap-3.5 hover:bg-slate-800/60 rounded-lg transition-colors"
                  >
                    <div className="mt-0.5 shrink-0">
                      {item.type === "DEPOSIT" && (
                        <ArrowDownCircle className="w-5 h-5 text-emerald-400" />
                      )}
                      {item.type === "WITHDRAW" && (
                        <ArrowUpCircle className="w-5 h-5 text-amber-400" />
                      )}
                      {item.type === "NEW_USER" && (
                        <UserPlus className="w-5 h-5 text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-100 truncate">
                          {item.title}
                        </p>
                        <span className="text-[10px] text-slate-500 shrink-0">
                          {new Date(item.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-1">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

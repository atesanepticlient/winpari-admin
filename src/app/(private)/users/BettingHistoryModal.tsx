"use client";

import React, { useState, useEffect } from "react";

interface FormattedBetRecord {
  id: string;
  recordType: "CASINO" | "SPORTS";
  category: string;
  title: string;
  betAmount: number;
  pnl: number;
  status: string;
  orderNo: string;
  createdAt: string;
}

interface BettingHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function BettingHistoryModal({
  isOpen,
  onClose,
  userId,
}: BettingHistoryModalProps) {
  const [activeTab, setActiveTab] = useState<"ALL" | "CASINO" | "SPORTS">(
    "ALL",
  );
  const [records, setRecords] = useState<FormattedBetRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/betting-history?userId=${userId}&type=${activeTab}`,
        );
        const result = await res.json();
        if (result.success) {
          setRecords(result.data);
        }
      } catch (err) {
        console.error("Failed to load history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen, userId, activeTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl rounded-xl bg-gray-900 text-white shadow-2xl border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 p-4">
          <h2 className="text-xl font-bold">Betting History</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl font-bold px-2"
          >
            ✕
          </button>
        </div>

        {/* Tab Filters */}
        <div className="flex border-b border-gray-800 bg-gray-950/50 p-2 gap-2">
          {(["ALL", "CASINO", "SPORTS"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab
                  ? "bg-amber-500 text-black font-semibold"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Table Body */}
        <div className="max-h-[450px] overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-10 text-gray-400">
              Loading history...
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="border-b border-gray-800 text-xs uppercase text-gray-400 bg-gray-950">
                  <tr>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Title / Ref</th>
                    <th className="py-3 px-3">Stake</th>
                    <th className="py-3 px-3">P&L</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {records.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-800/40">
                      <td className="py-3 px-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-semibold ${
                            item.recordType === "SPORTS"
                              ? "bg-blue-900/50 text-blue-400 border border-blue-700"
                              : "bg-purple-900/50 text-purple-400 border border-purple-700"
                          }`}
                        >
                          {item.recordType === "SPORTS"
                            ? "SPORTS"
                            : item.category}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-white">
                          {item.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {item.orderNo}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-gray-200">
                        ৳{item.betAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 font-bold">
                        <span
                          className={
                            item.pnl > 0
                              ? "text-green-400"
                              : item.pnl < 0
                                ? "text-red-400"
                                : "text-gray-400"
                          }
                        >
                          {item.pnl > 0
                            ? `+৳${item.pnl.toFixed(2)}`
                            : `৳${item.pnl.toFixed(2)}`}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            item.status === "SETTLED"
                              ? "bg-green-950 text-green-400"
                              : item.status === "RUNNING"
                                ? "bg-yellow-950 text-yellow-400"
                                : "bg-red-950 text-red-400"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs text-gray-400">
                        {new Date(item.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

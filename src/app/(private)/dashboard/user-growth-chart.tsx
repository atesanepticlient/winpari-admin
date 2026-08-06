"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Medal, Flame } from "lucide-react";

interface TopUsersTableProps {
  users: Array<{
    userId: string;
    email: string;
    playerId: string;
    totalDeposits: number;
  }>;
}

export default function TopUsersTable({ users }: TopUsersTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getMedalColor = (position: number): string => {
    switch (position) {
      case 0:
        return "from-yellow-400 to-yellow-500";
      case 1:
        return "from-gray-300 to-gray-400";
      case 2:
        return "from-orange-300 to-orange-400";
      default:
        return "from-slate-500 to-slate-600";
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">
          Top Depositors (Last 30 Days)
        </CardTitle>
        <p className="text-sm text-slate-400 mt-1">
          Users with highest deposit volume
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400">
                  RANK
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400">
                  USER
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400">
                  PLAYER ID
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400">
                  TOTAL DEPOSITS
                </th>
              </tr>
            </thead>
            <tbody>
              {users?.map((user, idx) => (
                <tr
                  key={user.userId}
                  className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full bg-gradient-to-br ${getMedalColor(idx)} flex items-center justify-center`}
                      >
                        <span className="text-xs font-bold text-white">
                          {idx + 1}
                        </span>
                      </div>
                      {idx < 3 && <Flame className="w-4 h-4 text-orange-400" />}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      <p className="font-medium text-white text-sm truncate max-w-xs">
                        {user.email}
                      </p>
                      <p className="text-xs text-slate-400">
                        User ID: {user.userId.slice(0, 8)}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="font-medium text-cyan-400 text-sm">
                      {user.playerId}
                    </p>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <p className="font-bold text-emerald-400 text-sm">
                      {formatCurrency(user.totalDeposits)}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users?.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-slate-400 text-sm">No user data available</p>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-700">
          <div>
            <p className="text-xs text-slate-400 mb-1">Total Top 10</p>
            <p className="text-lg font-bold text-emerald-400">
              {formatCurrency(
                users?.reduce((sum, u) => sum + u.totalDeposits, 0),
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Average</p>
            <p className="text-lg font-bold text-blue-400">
              {formatCurrency(
                users?.reduce((sum, u) => sum + u.totalDeposits, 0) /
                  (users?.length || 1),
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Top User</p>
            <p className="text-lg font-bold text-purple-400">
              {users?.length > 0 ? formatCurrency(users[0].totalDeposits) : "$0"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

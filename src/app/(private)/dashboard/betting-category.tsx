"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Zap, Gamepad2, Users } from "lucide-react";

interface BettingCategoryBreakdownProps {
  categories: Array<{
    name: string;
    bets: number;
    revenue: number;
    winnings: number;
  }>;
}

export default function BettingCategoryBreakdown({
  categories,
}: BettingCategoryBreakdownProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  };

  const getCategoryIcon = (name: string) => {
    switch (name.toUpperCase()) {
      case "SLOTS":
        return Gamepad2;
      case "LIVE CASINO":
        return Trophy;
      case "POKER":
        return Zap;
      case "FISH":
        return Users;
      default:
        return Trophy;
    }
  };

  const categoryColors: Record<string, string> = {
    Slots: "from-blue-500 to-blue-600",
    "Live Casino": "from-purple-500 to-purple-600",
    Poker: "from-pink-500 to-pink-600",
    Fish: "from-cyan-500 to-cyan-600",
  };

  const totalBets = categories.reduce((sum, cat) => sum + cat.bets, 0);
  const totalRevenue = categories.reduce((sum, cat) => sum + cat.revenue, 0);

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Betting Categories</CardTitle>
        <p className="text-sm text-slate-400 mt-1">Performance by game type</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.map((category, idx) => {
          const Icon = getCategoryIcon(category.name);
          const percentage = ((category.bets / totalBets) * 100).toFixed(1);

          return (
            <div
              key={category.name}
              className="p-4 rounded-lg bg-slate-900/50 border border-slate-700 hover:border-slate-600 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-lg bg-gradient-to-br ${
                      categoryColors[category.name]
                    }`}
                  >
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{category.name}</p>
                    <p className="text-xs text-slate-400">
                      {category.bets.toLocaleString()} bets
                    </p>
                  </div>
                </div>
                <p className="text-sm font-bold text-emerald-400">
                  {percentage}%
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 rounded-full h-1.5 mb-3 overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${
                    categoryColors[category.name]
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-slate-400">Revenue</p>
                  <p className="font-bold text-blue-400">
                    {formatCurrency(category.revenue)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Winnings</p>
                  <p className="font-bold text-violet-400">
                    {formatCurrency(category.winnings)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        <div className="pt-4 border-t border-slate-700 flex justify-between items-center">
          <p className="text-sm font-semibold text-slate-300">Total</p>
          <p className="text-lg font-bold text-emerald-400">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BettingChartProps {
  data: any;
  betting: any;
}

export default function BettingChart({ data, betting }: BettingChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  };

  const ChartTooltip = (props: any) => {
    const { active, payload } = props;
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-xs text-slate-300 font-medium">{data.label}</p>
          <p className="text-sm text-pink-400 font-semibold">
            Bets: {data.bets}
          </p>
          <p className="text-sm text-violet-400 font-semibold">
            Amount: {formatCurrency(data.bets * 50)} {/* avg bet */}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Betting Activity</CardTitle>
        <p className="text-sm text-slate-400 mt-1">
          Bets placed and house edge
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-900/50 rounded-lg p-4">
            <p className="text-xs text-slate-400">Total Bets</p>
            <p className="text-2xl font-bold text-pink-400">
              {betting.totalBetsPlaced.toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4">
            <p className="text-xs text-slate-400">House Edge</p>
            <p className="text-2xl font-bold text-emerald-400">
              {formatCurrency(betting.houseEdge)}
            </p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="label"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              stroke="#475569"
            />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} stroke="#475569" />
            <Tooltip content={<ChartTooltip />} />
            <Bar
              dataKey="deposits"
              fill="#ec4899"
              name="Betting Volume"
              radius={[8, 8, 0, 0]}
              animationDuration={800}
            />
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-6 pt-4 border-t border-slate-700 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-400">Total Bet Amount</p>
            <p className="text-lg font-bold text-violet-400">
              {formatCurrency(betting.totalBetAmount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Total Winnings</p>
            <p className="text-lg font-bold text-cyan-400">
              {formatCurrency(betting.totalWinAmount)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

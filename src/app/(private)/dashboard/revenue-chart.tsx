"use client";

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RevenueChartProps {
  data: {
    data: Array<{
      date: string;
      label: string;
      deposits: number;
      withdraws: number;
      revenue: number;
    }>;
    filter: string;
  };
  filter: string;
}

export default function RevenueChart({ data, filter }: RevenueChartProps) {
  const totalDeposits = data.data.reduce((sum, d) => sum + d.deposits, 0);
  const totalWithdraws = data.data.reduce((sum, d) => sum + d.withdraws, 0);
  const totalRevenue = data.data.reduce((sum, d) => sum + d.revenue, 0);

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
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-xs text-slate-300 font-medium">
            {payload[0].payload.label}
          </p>
          <p className="text-sm text-blue-400 font-semibold">
            Deposits: {formatCurrency(payload[0].payload.deposits)}
          </p>
          <p className="text-sm text-orange-400 font-semibold">
            Withdraws: {formatCurrency(payload[0].payload.withdraws)}
          </p>
          <p className="text-sm text-emerald-400 font-semibold">
            Revenue: {formatCurrency(payload[0].payload.revenue)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Revenue Overview</CardTitle>
            <p className="text-sm text-slate-400 mt-1">
              Deposits, withdrawals, and net revenue
            </p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-xs text-slate-400">Total Revenue</p>
            <p className="text-2xl font-bold text-emerald-400">
              {formatCurrency(totalRevenue)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart
            data={data.data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorDeposits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorWithdraws" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="label"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              stroke="#475569"
            />
            <YAxis
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              stroke="#475569"
              tickFormatter={(value) =>
                value >= 1000000
                  ? `$${(value / 1000000).toFixed(1)}M`
                  : value >= 1000
                    ? `$${(value / 1000).toFixed(0)}K`
                    : `$${value}`
              }
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              wrapperStyle={{
                paddingTop: "20px",
              }}
              contentStyle={{
                backgroundColor: "rgba(15, 23, 42, 0.8)",
                border: "1px solid rgba(71, 85, 105, 0.5)",
                borderRadius: "8px",
              }}
            />
            <Area
              type="monotone"
              dataKey="deposits"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorDeposits)"
              strokeWidth={2}
              name="Deposits"
              isAnimationActive={true}
            />
            <Area
              type="monotone"
              dataKey="withdraws"
              stroke="#f97316"
              fillOpacity={1}
              fill="url(#colorWithdraws)"
              strokeWidth={2}
              name="Withdraws"
              isAnimationActive={true}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorRevenue)"
              strokeWidth={2}
              name="Revenue"
              isAnimationActive={true}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-700">
          <div>
            <p className="text-xs text-slate-400 mb-1">Total Deposits</p>
            <p className="text-lg font-bold text-blue-400">
              {formatCurrency(totalDeposits)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Total Withdraws</p>
            <p className="text-lg font-bold text-orange-400">
              {formatCurrency(totalWithdraws)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Platform Margin</p>
            <p className="text-lg font-bold text-emerald-400">
              {((totalRevenue / (totalDeposits || 1)) * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

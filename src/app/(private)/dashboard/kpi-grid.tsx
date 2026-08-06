"use client";

import {
  Users,
  DollarSign,
  TrendingUp,
  Zap,
  Gift,
  Trophy,
  BarChart3,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface KPIGridProps {
  kpis: any;
  conversions: any;
}

export default function KPIGrid({ kpis, conversions }: KPIGridProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(value);
  };

  const MetricCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    color = "from-blue-500 to-blue-600",
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    trend?: { value: number; positive: boolean };
    color?: string;
  }) => (
    <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all hover:bg-slate-800/70">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium text-slate-300">
            {title}
          </CardTitle>
          <div className={`p-2.5 rounded-lg bg-gradient-to-br ${color}`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 pt-2">
              <span
                className={`text-xs font-semibold ${
                  trend.positive ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {trend.positive ? "+" : "-"}
                {Math.abs(trend.value)}%
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Users"
          value={formatNumber(kpis.users.total)}
          subtitle={`+${kpis.users.new7Days} this week`}
          icon={Users}
          trend={{ value: parseFloat(kpis.users.growth), positive: true }}
          color="from-blue-500 to-blue-600"
        />
        <MetricCard
          title="Active Users"
          value={formatNumber(kpis.users.active)}
          subtitle={`${((kpis.users.active / kpis.users.total) * 100).toFixed(1)}% of total`}
          icon={Activity}
          color="from-emerald-500 to-emerald-600"
        />
        <MetricCard
          title="Total Deposits"
          value={formatCurrency(kpis.revenue.depositsTotal)}
          subtitle={`${formatCurrency(kpis.revenue.depositsLast7)} last 7 days`}
          icon={DollarSign}
          color="from-green-500 to-green-600"
        />
        <MetricCard
          title="Net Revenue"
          value={formatCurrency(parseFloat(kpis.revenue.netRevenue))}
          subtitle={`From ${kpis.users.total} users`}
          icon={TrendingUp}
          trend={{ value: 12, positive: true }}
          color="from-purple-500 to-purple-600"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Payouts"
          value={formatCurrency(kpis.revenue.payoutsTotal)}
          subtitle={`${formatCurrency(kpis.revenue.payoutsLast7)} last 7 days`}
          icon={DollarSign}
          color="from-orange-500 to-orange-600"
        />
        <MetricCard
          title="Pending Withdrawals"
          value={formatCurrency(kpis.revenue.pendingPayouts)}
          subtitle="Awaiting approval"
          icon={Zap}
          color="from-yellow-500 to-yellow-600"
        />
        <MetricCard
          title="Total Bets Placed"
          value={formatNumber(kpis.betting.totalBetsPlaced)}
          subtitle={`${kpis.betting.casinoBetsCount} casino, ${kpis.betting.sportsBetsCount} sports`}
          icon={Trophy}
          color="from-pink-500 to-pink-600"
        />
        <MetricCard
          title="Bonus Claims"
          value={formatCurrency(kpis.bonuses.totalBonusClaimedLast7)}
          subtitle={`+${kpis.bonuses.referralConversions} referral conversions`}
          icon={Gift}
          color="from-indigo-500 to-indigo-600"
        />
      </div>

      {/* Conversion Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Deposit Conversion Rate"
          value={`${conversions.depositConversionRate}%`}
          subtitle="Of total users"
          icon={BarChart3}
          color="from-cyan-500 to-cyan-600"
        />
        <MetricCard
          title="Repeat User Rate"
          value={`${conversions.repeatUserRate}%`}
          subtitle="Users with deposits"
          icon={Users}
          color="from-teal-500 to-teal-600"
        />
        <MetricCard
          title="Average Deposit"
          value={formatCurrency(parseFloat(conversions.avgDepositValue))}
          subtitle="Per transaction"
          icon={DollarSign}
          color="from-lime-500 to-lime-600"
        />
        <MetricCard
          title="Average Withdrawal"
          value={formatCurrency(parseFloat(conversions.avgWithdrawValue))}
          subtitle="Per transaction"
          icon={DollarSign}
          color="from-rose-500 to-rose-600"
        />
      </div>
    </div>
  );
}

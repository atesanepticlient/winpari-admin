"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { useDashboard } from "@/hooks/useDashboard";

// Components
import KPIGrid from "./kpi-grid";
import RevenueChart from "./revenue-chart";
import BettingChart from "./betting-chart";
import UserGrowthChart from "./user-growth-chart";
import BettingCategoryBreakdown from "./betting-category";
import TopUsersTable from "./top-users-table";
import RecentTransactionsTable from "./recent-transactions";
import FilterBar from "./filter-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CookieLoader from "@/components/loader/cooki-loader";
import {
  AlertCircle,
  RotateCw,
  DollarSign,
  Settings,
  BarChart3,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import DollarRateModal from "./dollar-rate-modal";

type DashboardView = "overview" | "revenue" | "users" | "betting" | "agents";

export default function DashboardPage() {
  const [filter, setFilter] = useState("7days");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [showRateModal, setShowRateModal] = useState(false);
  const [activeView, setActiveView] = useState<DashboardView>("overview");

  const { data, loading, error, refetch, isCached } = useDashboard(
    filter,
    year,
    {
      autoFetch: true,
      refetchInterval: 60000, // Refetch every minute
      cacheTime: 30000, // Cache for 30 seconds
    },
  );

  if (loading && !data) {
    return <CookieLoader />;
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <Card className="bg-slate-800 border-red-500/50 max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Dashboard Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-300 text-sm">{error.message}</p>
            <button
              onClick={() => refetch()}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <RotateCw className="w-4 h-4" />
              Try Again
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-red-500">No data available</div>
    );
  }

  const navigationItems: Array<{
    id: DashboardView;
    label: string;
    icon: React.ReactNode;
    description: string;
  }> = [
    {
      id: "overview",
      label: "Overview",
      icon: <BarChart3 className="w-5 h-5" />,
      description: "All metrics at a glance",
    },
    {
      id: "revenue",
      label: "Revenue",
      icon: <TrendingUp className="w-5 h-5" />,
      description: "Deposits & withdrawals",
    },
    {
      id: "users",
      label: "Users",
      icon: <Users className="w-5 h-5" />,
      description: "User analytics & top depositors",
    },
    {
      id: "betting",
      label: "Betting",
      icon: <Zap className="w-5 h-5" />,
      description: "Gaming & betting data",
    },
    {
      id: "agents",
      label: "Agents",
      icon: <Users className="w-5 h-5" />,
      description: "Agent metrics",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Dollar Rate Modal */}
      <DollarRateModal
        isOpen={showRateModal}
        onClose={() => setShowRateModal(false)}
        onSuccess={() => {
          refetch();
          setShowRateModal(false);
        }}
      />

      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Top Row: Title & Actions */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tight">
                Dashboard
              </h1>
              <p className="text-slate-400 mt-1 text-sm">
                Platform Analytics & Performance
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowRateModal(true)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                title="Update exchange rates"
              >
                <DollarSign className="w-4 h-4" />
                Update Rates
              </button>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                disabled={loading}
              >
                <RotateCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                {loading ? "Updating..." : "Refresh"}
              </button>
            </div>
          </div>

          {/* Exchange Rates Info Bar */}
          {data?.exchangeRates && (
            <div className="bg-slate-800/50 rounded-lg p-3 mb-4 border border-slate-700">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Current Exchange Rates (to USD):
                </span>
                <div className="flex gap-6">
                  <div>
                    <span className="text-slate-500">BDT:</span>
                    <span className="text-white ml-2 font-semibold">
                      {Number(data.exchangeRates?.BDT).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">PKR:</span>
                    <span className="text-white ml-2 font-semibold">
                      {Number(data.exchangeRates?.PKR).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">INR:</span>
                    <span className="text-white ml-2 font-semibold">
                      {Number(data.exchangeRates?.INR).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status Bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs text-slate-500">
              {isCached ? "📦 Cached" : "🔄 Live"} • Updated:{" "}
              {format(parseISO(data.timestamp), "MMM d, HH:mm:ss")}
            </div>
            <FilterBar
              onFilterChange={setFilter}
              onYearChange={setYear}
              currentFilter={filter}
              currentYear={year}
            />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-700 bg-slate-900/30 backdrop-blur-sm sticky top-[200px] z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto py-2">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap group ${
                  activeView === item.id
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
                title={item.description}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* OVERVIEW VIEW */}
        {activeView === "overview" && (
          <>
            {/* KPI Grid */}
            <KPIGrid kpis={data.kpis} conversions={data.conversions} />

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RevenueChart data={data.chartData} filter={filter} />
              </div>
              <div>
                <UserGrowthChart kpis={data.kpis} />
              </div>
            </div>

            {/* Betting & Revenue */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BettingChart data={data.chartData} betting={data.kpis.betting} />
              <BettingCategoryBreakdown categories={data.bettingCategories} />
            </div>
          </>
        )}

        {/* REVENUE VIEW */}
        {activeView === "revenue" && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm">
                    Deposits (Last 7 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-emerald-400">
                    ${data.kpis.revenue.depositsLast7.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm">
                    Total Deposits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-400">
                    ${data.kpis.revenue.depositsTotal.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm">
                    Net Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-purple-400">
                    ${data.kpis.revenue.netRevenue.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueChart data={data.chartData} filter={filter} />
              <div className="space-y-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">
                      Withdrawals (Last 7 Days)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-red-400">
                      ${data.kpis.revenue.payoutsLast7.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">
                      Pending Withdrawals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-yellow-400">
                      ${data.kpis.revenue.pendingPayouts.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}

        {/* USERS VIEW */}
        {activeView === "users" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm">
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-400">
                    {data.kpis.users.total.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm">
                    Active Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-emerald-400">
                    {data.kpis.users.active.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm">
                    Conversion Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-purple-400">
                    {data.conversions.depositConversionRate}%
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm">
                    Avg Deposit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-cyan-400">
                    ${data.conversions.avgDepositValue}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="users" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-800">
                <TabsTrigger value="users">Top Users</TabsTrigger>
                <TabsTrigger value="transactions">
                  Recent Transactions
                </TabsTrigger>
              </TabsList>
              <TabsContent value="users" className="mt-6">
                <TopUsersTable users={data.topUsers} />
              </TabsContent>
              <TabsContent value="transactions" className="mt-6">
                <RecentTransactionsTable
                  transactions={data.recentTransactions}
                />
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* BETTING VIEW */}
        {activeView === "betting" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm">
                    Total Bets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-400">
                    {data.kpis.betting.totalBetsPlaced.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm">
                    Total Wagered
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-emerald-400">
                    ${data.kpis.betting.totalBetAmount.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm">
                    Total Winnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-purple-400">
                    ${data.kpis.betting.totalWinAmount.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm">
                    House Edge
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-cyan-400">
                    ${data.kpis.betting.houseEdge.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BettingChart data={data.chartData} betting={data.kpis.betting} />
              <BettingCategoryBreakdown categories={data.bettingCategories} />
            </div>
          </>
        )}

        {/* AGENTS VIEW */}
        {activeView === "agents" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm">
                    Total Agents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-400">
                    {data.kpis.agents.totalAgents.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm">
                    Verified Agents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-emerald-400">
                    {data.kpis.agents.verifiedAgents.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm">
                    Total Deposits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-purple-400">
                    ${data.kpis.agents.agentDepositsTotal.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm">
                    Pending Withdrawals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-red-400">
                    ${data.kpis.agents.pendingAgentWithdraws.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Agent Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-slate-400 text-sm mb-2">
                      Total Agent Withdrawals
                    </p>
                    <p className="text-2xl font-bold text-emerald-400">
                      ${data.kpis.agents.agentWithdrawsTotal.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-2">
                      Verification Rate
                    </p>
                    <p className="text-2xl font-bold text-blue-400">
                      {data.kpis.agents.totalAgents > 0
                        ? (
                            (data.kpis.agents.verifiedAgents /
                              data.kpis.agents.totalAgents) *
                            100
                          ).toFixed(1)
                        : "0"}
                      %
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-2">Turnover</p>
                    <p className="text-2xl font-bold text-purple-400">
                      ${data.kpis.turnover.total.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Footer Info */}
        <div className="border-t border-slate-700 pt-8 pb-4 text-center">
          <p className="text-slate-400 text-xs">
            Dashboard auto-refreshes every 60 seconds • Data cached for
            performance • All amounts in USD
          </p>
        </div>
      </div>
    </div>
  );
}

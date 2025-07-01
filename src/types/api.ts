/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma } from "@prisma/client";

export interface AgentsUpdateInput {
  updateType: "accept" | "reject";
  users: string[];
}

export interface AgentsDataOutput {
  payload: {
    totalActiveAgentsCount: number;
    totalPendingAgentsCount: number;
    agents: Prisma.agentGetPayload<object>[];
  };
}

export interface UsersDataOutput {
  payload: {
    total: number;
    page: number;
    limit: number;
    users: Prisma.UsersGetPayload<{
      include: { wallet: true; bettingRecord: true };
    }>[];
  };
}

interface PaymentsMethods {
  length: number;
  methodData: Prisma.eWalletGetPayload<{ include: { admin: true } }>[];
  methodName: string;
}

export interface PaymentDataOutput {
  payload: {
    methods: PaymentsMethods[];
  };
}

export interface DepositsOutput {
  payload: {
    deposits: Prisma.DepositGetPayload<{
      include: { user: { include: { wallet: true } }; ewallet: true };
    }>[];
    totalFound: number;
  };
}

export interface WithdrawsOutput {
  payload: {
    withdraws: Prisma.WithdrawGetPayload<{
      include: { user: { include: { wallet: true } }; withdrawEWallet: true };
    }>[];
    totalFound: number;
  };
}

export interface Chart {
  month: string;
  withdraw: number;
  deposit: number;
}
export interface ChartDataOutput {
  payload: Chart[];
}

export interface ActivityDataOutput {
  payload: Prisma.PaymentHistoryGetPayload<{
    select: {
      amount: true;
      type: true;
      user: {
        select: { email: true; wallet: { select: { currencyCode: true } } };
      };
    };
  }>[];
}

export interface StatisticsDataOutput {
  payload: {
    title: string;
    value: number;
    change: number;
    message: string;
  }[];
}

export interface ContactUpdateInput {
  facebook?: string;
  telegram?: string;
  email?: string;
}

export interface PromoUpdateInput {
  promo: string;
}

export type DashboardOverviewQueryParams = {
  startDate?: string;
  endDate?: string;
  paymentFilter?: string;
};
export type DepositsWithdrawalsStat = {
  filter: string;
  from: string;
  to: string;
  data: {
    date: string;
    deposits: number;
    withdraws: number;
    revenue: number;
  }[];
};

export type RecentTransaction = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  } | null;
};

export type PeriodStats = {
  last7Days: number;
  last30Days: number;
  allTime: number;
};
export type DashboardOverviewResponse = {
  statistics: {
    totalUsers: PeriodStats;
    activeUsers: PeriodStats;
    bannedUsers: PeriodStats;
    totalRevenue: PeriodStats;
    payoutsIssued: PeriodStats;
    pendingWithdrawals: PeriodStats;
    successDeposits: PeriodStats;
  };
  conversionRate: number;
  revenue: number;
  depositWithdraw: DepositsWithdrawalsStat;
  recentTransactions: RecentTransaction[];
  filteredData?: {
    totalUsers: number;
    activeUsers: number;
    bannedUsers: number;
    totalRevenue: number;
    payoutsIssued: number;
    pendingWithdrawals: number;
    successDeposits: number;
  };
};

export interface DepostisFetchInput {
  search?: string;
  from?: string;
  to?: string;
  gateway: string;
  minAmount?: number;
  maxAmount?: number;
  status?: any;
  limit?: number;
  page?: number;
}
export interface WithdrawsFetchInput {
  search?: string;
  from?: string;
  to?: string;
  card: string;
  minAmount?: number;
  maxAmount?: number;
  status?: any;
  limit?: number;
  page?: number;
}

export interface UsersFetchInput {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface FetchUserOutput {
  success: boolean;
  user: Prisma.UsersGetPayload<{
    include: { wallet: true; bettingRecord: true };
  }>;
  financialOverview: {
    totalDeposits: number;
    totalWithdraws: number;
    lastDeposits: number;
    lastWithdraws: number;
  };
  bettingStatistics: {
    totalBet: number;
    totalWin: number;
    totalLosss: number;
    winRate: number;
  };
  latestTransactions: any[];
}
export interface UserSuspensionInput {
  id: string;
  actionType: "BAN" | "UNBAN";
  message?: string;
}

import { useState, useCallback, useEffect } from "react";

interface DashboardData {
  timestamp: string;
  kpis: any;
  conversions: any;
  chartData: any;
  bettingCategories: any[];
  topUsers: any[];
  recentTransactions: any[];
}

interface UseDashboardOptions {
  autoFetch?: boolean;
  refetchInterval?: number;
  cacheTime?: number;
}

const CACHE_KEY = "dashboard_cache";

export function useDashboard(
  filter: string = "7days",
  year?: string,
  options: UseDashboardOptions = {},
) {
  const {
    autoFetch = true,
    refetchInterval = 0,
    cacheTime = 60000, // 1 minute
  } = options;

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  const getCache = useCallback(() => {
    if (typeof window === "undefined") return null;
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      const { data: cachedData, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > cacheTime) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
      return cachedData;
    } catch {
      return null;
    }
  }, [cacheTime]);

  const setCache = useCallback((dashboardData: DashboardData) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          data: dashboardData,
          timestamp: Date.now(),
        }),
      );
    } catch {
      console.warn("Failed to cache dashboard data");
    }
  }, []);

  const fetchData = useCallback(async () => {
    // Check cache first
    const cached = getCache();
    if (cached && Date.now() - lastFetch < cacheTime) {
      setData(cached);
      return cached;
    }

    setLoading(true);
    setError(null);

    try {
      const url = new URL("/api/dashboard", window.location.origin);
      url.searchParams.set("payment-filter", filter);
      if (year && filter === "year") {
        url.searchParams.set("year", year);
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const dashboardData = await response.json();

      if (dashboardData.error) {
        throw new Error(dashboardData.error);
      }

      setData(dashboardData);
      setCache(dashboardData);
      setLastFetch(Date.now());

      return dashboardData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error("Failed to fetch dashboard:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [filter, year, cacheTime, getCache, setCache, lastFetch]);

  // Auto-fetch on mount and when filters change
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [filter, year, autoFetch, fetchData]);

  // Set up refetch interval
  useEffect(() => {
    if (refetchInterval <= 0) return;

    const interval = setInterval(() => {
      fetchData();
    }, refetchInterval);

    return () => clearInterval(interval);
  }, [refetchInterval, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    isCached: lastFetch > 0 && Date.now() - lastFetch < cacheTime,
  };
}

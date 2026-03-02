import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Activity, Coins, DollarSign, Eye, Users } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalyticsDay, CoinTransaction } from "../backend.d";
import { DataTable } from "../components/DataTable";
import { ErrorState } from "../components/ErrorState";
import { StatCard } from "../components/StatCard";
import { useActor } from "../hooks/useActor";

const CHART_TOOLTIP_STYLE = {
  backgroundColor: "oklch(0.13 0.014 285)",
  border: "1px solid oklch(0.22 0.018 285)",
  borderRadius: "8px",
  color: "#fff",
  fontSize: 12,
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface SummaryStats {
  revenue: number;
  totalViews: bigint;
  activeToday: bigint;
  totalUsers: bigint;
}

export function Dashboard() {
  const { actor, isFetching } = useActor();
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsDay[]>([]);
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!actor) return;
    setIsLoading(true);
    setError(null);
    try {
      const [statsRes, analyticsRes, txRes] = await Promise.all([
        actor.getSummaryStats(),
        actor.getDailyAnalytics(7n),
        actor.getCoinTransactions(5n),
      ]);
      setStats(statsRes);
      setAnalytics(analyticsRes);
      setTransactions(txRes);
    } catch {
      setError("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: load is stable within actor/isFetching context
  useEffect(() => {
    if (!isFetching && actor) {
      load();
    }
  }, [actor, isFetching]);

  if (error) return <ErrorState message={error} onRetry={load} />;

  const chartData = analytics.map((d) => ({
    date: formatDate(d.date),
    newUsers: Number(d.newUsers),
    views: Number(d.totalViews),
    revenue: d.revenue,
  }));

  const txColumns = [
    {
      header: "User ID",
      cell: (row: CoinTransaction) => (
        <span className="font-mono text-xs text-muted-foreground">
          #{Number(row.userId)}
        </span>
      ),
    },
    {
      header: "Type",
      cell: (row: CoinTransaction) => (
        <span
          className="text-xs capitalize px-2 py-1 rounded-full"
          style={{
            background: "oklch(0.58 0.24 340 / 0.12)",
            color: "oklch(0.78 0.2 340)",
            border: "1px solid oklch(0.58 0.24 340 / 0.25)",
          }}
        >
          {row.transactionType}
        </span>
      ),
    },
    {
      header: "Amount",
      cell: (row: CoinTransaction) => {
        const amount = Number(row.amount);
        return (
          <span
            className="font-mono font-semibold text-sm tabular-nums"
            style={{
              color:
                amount >= 0 ? "oklch(0.72 0.22 145)" : "oklch(0.6 0.22 25)",
            }}
          >
            {amount >= 0 ? "+" : ""}
            {amount}
          </span>
        );
      },
    },
    {
      header: "Description",
      cell: (row: CoinTransaction) => (
        <span className="text-xs text-muted-foreground truncate max-w-[200px] block">
          {row.description}
        </span>
      ),
    },
    {
      header: "Date",
      cell: (row: CoinTransaction) => (
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(Number(row.createdAt) / 1_000_000), {
            addSuffix: true,
          })}
        </span>
      ),
    },
  ];

  const showLoading = isLoading || isFetching;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={
            showLoading ? "—" : Number(stats?.totalUsers ?? 0).toLocaleString()
          }
          icon={<Users className="w-5 h-5" />}
          variant="pink"
          isLoading={showLoading}
        />
        <StatCard
          title="Active Today"
          value={
            showLoading ? "—" : Number(stats?.activeToday ?? 0).toLocaleString()
          }
          icon={<Activity className="w-5 h-5" />}
          variant="success"
          isLoading={showLoading}
        />
        <StatCard
          title="Total Views"
          value={
            showLoading ? "—" : Number(stats?.totalViews ?? 0).toLocaleString()
          }
          icon={<Eye className="w-5 h-5" />}
          variant="purple"
          isLoading={showLoading}
        />
        <StatCard
          title="Revenue"
          value={
            showLoading
              ? "—"
              : `$${(stats?.revenue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
          }
          icon={<DollarSign className="w-5 h-5" />}
          variant="gold"
          isLoading={showLoading}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* New Users Line Chart */}
        <div className="card-surface rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">Daily New Users</h3>
          {showLoading ? (
            <Skeleton className="h-44 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={176}>
              <LineChart data={chartData}>
                <CartesianGrid
                  stroke="oklch(0.22 0.018 285)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "oklch(0.62 0.02 285)" }}
                />
                <YAxis tick={{ fontSize: 10, fill: "oklch(0.62 0.02 285)" }} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Line
                  type="monotone"
                  dataKey="newUsers"
                  stroke="oklch(0.58 0.24 340)"
                  strokeWidth={2}
                  dot={{ fill: "oklch(0.58 0.24 340)", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Views Bar Chart */}
        <div className="card-surface rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">Daily Views</h3>
          {showLoading ? (
            <Skeleton className="h-44 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={176}>
              <BarChart data={chartData}>
                <CartesianGrid
                  stroke="oklch(0.22 0.018 285)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "oklch(0.62 0.02 285)" }}
                />
                <YAxis tick={{ fontSize: 10, fill: "oklch(0.62 0.02 285)" }} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Bar
                  dataKey="views"
                  fill="oklch(0.42 0.18 298)"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue Area Chart */}
        <div className="card-surface rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">Revenue Trend</h3>
          {showLoading ? (
            <Skeleton className="h-44 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={176}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="oklch(0.88 0.18 86)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="oklch(0.88 0.18 86)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="oklch(0.22 0.018 285)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "oklch(0.62 0.02 285)" }}
                />
                <YAxis tick={{ fontSize: 10, fill: "oklch(0.62 0.02 285)" }} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="oklch(0.88 0.18 86)"
                  fill="url(#revenueGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card-surface rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Coins className="w-4 h-4" style={{ color: "oklch(0.88 0.18 86)" }} />
          <h3 className="text-sm font-semibold">Recent Coin Transactions</h3>
        </div>
        <DataTable
          columns={txColumns}
          data={transactions}
          isLoading={showLoading}
          pageSize={5}
          emptyMessage="No recent transactions"
        />
      </div>
    </div>
  );
}

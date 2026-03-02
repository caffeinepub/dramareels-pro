import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Coins, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { AppConfig, CoinTransaction } from "../backend.d";
import { DataTable } from "../components/DataTable";
import { ErrorState } from "../components/ErrorState";
import { PageHeader } from "../components/PageHeader";
import { useActor } from "../hooks/useActor";

const TX_TYPE_STYLES: Record<string, string> = {
  adReward: "badge-active",
  dailyBonus: "badge-monthly",
  purchase: "badge-yearly",
  episodeUnlock: "badge-archived",
  vipPurchase: "badge-vip",
};

export function CoinsRewards() {
  const { actor, isFetching } = useActor();
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coinsPerAd, setCoinsPerAd] = useState("");
  const [dailyBonus, setDailyBonus] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!actor) return;
    setIsLoading(true);
    setError(null);
    try {
      const [txs, cfg] = await Promise.all([
        actor.getCoinTransactions(100n),
        actor.getAppConfig(),
      ]);
      setTransactions(txs);
      setConfig(cfg);
      setCoinsPerAd(String(Number(cfg.coinRewardPerAd)));
      setDailyBonus(String(Number(cfg.dailyBonusCoins)));
    } catch {
      setError("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: load is stable within actor/isFetching context
  useEffect(() => {
    if (!isFetching && actor) load();
  }, [actor, isFetching]);

  const handleSave = async () => {
    if (!actor || !config) return;
    setSaving(true);
    try {
      await actor.updateAppConfig({
        ...config,
        coinRewardPerAd: BigInt(Number.parseInt(coinsPerAd) || 0),
        dailyBonusCoins: BigInt(Number.parseInt(dailyBonus) || 0),
      });
      toast.success("Coin settings saved");
      await load();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;

  const showLoading = isLoading || isFetching;

  // Calculate top earners
  const earnerMap = new Map<bigint, { userId: bigint; total: number }>();
  for (const tx of transactions) {
    const amount = Number(tx.amount);
    if (amount > 0) {
      const existing = earnerMap.get(tx.userId);
      if (existing) {
        existing.total += amount;
      } else {
        earnerMap.set(tx.userId, { userId: tx.userId, total: amount });
      }
    }
  }
  const topEarners = Array.from(earnerMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

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
          className={`text-xs px-2 py-0.5 rounded-full ${TX_TYPE_STYLES[row.transactionType] ?? "badge-archived"}`}
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
            className="tabular-nums font-semibold text-sm"
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
        <span className="text-xs text-muted-foreground">{row.description}</span>
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

  return (
    <div>
      <PageHeader
        title="Coins & Rewards"
        subtitle="Manage coin economy and transactions"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Config Card */}
        <div className="card-surface rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Coins
              className="w-4 h-4"
              style={{ color: "oklch(0.88 0.18 86)" }}
            />
            <h3 className="text-sm font-semibold">Reward Settings</h3>
          </div>
          {showLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Coins per Ad Watched</Label>
                <Input
                  type="number"
                  value={coinsPerAd}
                  onChange={(e) => setCoinsPerAd(e.target.value)}
                  min="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Daily Bonus Coins</Label>
                <Input
                  type="number"
                  value={dailyBonus}
                  onChange={(e) => setDailyBonus(e.target.value)}
                  min="0"
                />
              </div>
              <Button
                className="w-full mt-2"
                onClick={handleSave}
                disabled={saving}
                style={{
                  background: "oklch(0.88 0.18 86 / 0.9)",
                  color: "oklch(0.1 0 0)",
                }}
              >
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          )}
        </div>

        {/* Top Earners */}
        <div className="card-surface rounded-xl p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Trophy
              className="w-4 h-4"
              style={{ color: "oklch(0.88 0.18 86)" }}
            />
            <h3 className="text-sm font-semibold">Top Coin Earners</h3>
          </div>
          {showLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : topEarners.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No data yet
            </p>
          ) : (
            <div className="space-y-2">
              {topEarners.map((earner, idx) => (
                <div
                  key={String(earner.userId)}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg"
                  style={{ background: "oklch(0.16 0.014 285)" }}
                >
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{
                      background:
                        idx === 0
                          ? "oklch(0.88 0.18 86 / 0.3)"
                          : idx === 1
                            ? "oklch(0.75 0.05 285 / 0.3)"
                            : "oklch(0.5 0.1 55 / 0.3)",
                      color:
                        idx === 0
                          ? "oklch(0.88 0.18 86)"
                          : idx === 1
                            ? "oklch(0.85 0.03 285)"
                            : "oklch(0.7 0.12 55)",
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span className="flex-1 text-sm">
                    User #{Number(earner.userId)}
                  </span>
                  <span
                    className="tabular-nums font-bold text-sm"
                    style={{ color: "oklch(0.88 0.18 86)" }}
                  >
                    🪙 {earner.total.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card-surface rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4">Transaction Log</h3>
        <DataTable
          columns={txColumns}
          data={transactions}
          isLoading={showLoading}
          emptyMessage="No transactions"
        />
      </div>
    </div>
  );
}

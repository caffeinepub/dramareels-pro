import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { AppConfig, Subscription } from "../backend.d";
import { SubscriptionPlan, SubscriptionStatus } from "../backend.d";
import { DataTable } from "../components/DataTable";
import { ErrorState } from "../components/ErrorState";
import { PageHeader } from "../components/PageHeader";
import { useActor } from "../hooks/useActor";

const STATUS_STYLES: Record<SubscriptionStatus, string> = {
  [SubscriptionStatus.active]: "badge-active",
  [SubscriptionStatus.expired]: "badge-archived",
  [SubscriptionStatus.cancelled]: "badge-blocked",
};

export function Subscriptions() {
  const { actor, isFetching } = useActor();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [yearlyPrice, setYearlyPrice] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!actor) return;
    setIsLoading(true);
    setError(null);
    try {
      const [s, c] = await Promise.all([
        actor.getSubscriptions(),
        actor.getAppConfig(),
      ]);
      setSubs(s);
      setConfig(c);
      setMonthlyPrice(String(c.vipMonthlyPrice));
      setYearlyPrice(String(c.vipYearlyPrice));
    } catch {
      setError("Failed to load subscriptions");
    } finally {
      setIsLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: load is stable within actor/isFetching context
  useEffect(() => {
    if (!isFetching && actor) load();
  }, [actor, isFetching]);

  const handleStatusChange = async (
    sub: Subscription,
    status: SubscriptionStatus,
  ) => {
    if (!actor) return;
    try {
      await actor.updateSubscriptionStatus(sub.id, status);
      toast.success("Status updated");
      await load();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleSavePrices = async () => {
    if (!actor || !config) return;
    setSaving(true);
    try {
      await actor.updateAppConfig({
        ...config,
        vipMonthlyPrice: Number.parseFloat(monthlyPrice) || 0,
        vipYearlyPrice: Number.parseFloat(yearlyPrice) || 0,
      });
      toast.success("Prices updated");
      await load();
    } catch {
      toast.error("Failed to save prices");
    } finally {
      setSaving(false);
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;

  const showLoading = isLoading || isFetching;

  const columns = [
    {
      header: "User ID",
      cell: (row: Subscription) => (
        <span className="font-mono text-xs text-muted-foreground">
          #{Number(row.userId)}
        </span>
      ),
    },
    {
      header: "Plan",
      cell: (row: Subscription) => (
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            row.plan === SubscriptionPlan.yearly
              ? "badge-yearly"
              : "badge-monthly"
          }`}
        >
          {row.plan === SubscriptionPlan.yearly ? "Yearly" : "Monthly"}
        </span>
      ),
    },
    {
      header: "Price",
      cell: (row: Subscription) => (
        <span className="tabular-nums text-sm">${row.price.toFixed(2)}</span>
      ),
    },
    {
      header: "Start Date",
      cell: (row: Subscription) => (
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(Number(row.startDate) / 1_000_000), {
            addSuffix: true,
          })}
        </span>
      ),
    },
    {
      header: "End Date",
      cell: (row: Subscription) => (
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(Number(row.endDate) / 1_000_000), {
            addSuffix: true,
          })}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (row: Subscription) => (
        <Select
          value={row.status}
          onValueChange={(v) =>
            handleStatusChange(row, v as SubscriptionStatus)
          }
        >
          <SelectTrigger className="h-7 w-32 text-xs">
            <SelectValue>
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${STATUS_STYLES[row.status]}`}
              >
                {row.status}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.values(SubscriptionStatus).map((s) => (
              <SelectItem key={s} value={s} className="text-xs capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Subscriptions"
        subtitle={`${subs.length} total subscriptions`}
      />

      <div className="card-surface rounded-xl p-5 mb-4">
        <DataTable
          columns={columns}
          data={subs}
          isLoading={showLoading}
          emptyMessage="No subscriptions yet"
        />
      </div>

      {/* Pricing Config */}
      <div className="card-surface rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4">VIP Subscription Pricing</h3>
        {showLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Monthly Price ($)</Label>
              <Input
                type="number"
                value={monthlyPrice}
                onChange={(e) => setMonthlyPrice(e.target.value)}
                placeholder="9.99"
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Yearly Price ($)</Label>
              <Input
                type="number"
                value={yearlyPrice}
                onChange={(e) => setYearlyPrice(e.target.value)}
                placeholder="79.99"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        )}
        <Button
          className="mt-4"
          onClick={handleSavePrices}
          disabled={saving || showLoading}
          style={{ background: "oklch(0.58 0.24 340)", color: "white" }}
        >
          {saving ? "Saving..." : "Save Prices"}
        </Button>
      </div>
    </div>
  );
}

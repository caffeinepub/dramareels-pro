import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, Info, Settings2, Shield, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { AppConfig } from "../backend.d";
import { ErrorState } from "../components/ErrorState";
import { PageHeader } from "../components/PageHeader";
import { useActor } from "../hooks/useActor";

export function AppSettings() {
  const { actor, isFetching } = useActor();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [maintenanceConfirm, setMaintenanceConfirm] = useState(false);

  const [maintenance, setMaintenance] = useState(false);
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [yearlyPrice, setYearlyPrice] = useState("");

  const load = async () => {
    if (!actor) return;
    setIsLoading(true);
    setError(null);
    try {
      const cfg = await actor.getAppConfig();
      setConfig(cfg);
      setMaintenance(cfg.maintenanceMode);
      setMonthlyPrice(String(cfg.vipMonthlyPrice));
      setYearlyPrice(String(cfg.vipYearlyPrice));
    } catch {
      setError("Failed to load settings");
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
        maintenanceMode: maintenance,
        vipMonthlyPrice: Number.parseFloat(monthlyPrice) || 0,
        vipYearlyPrice: Number.parseFloat(yearlyPrice) || 0,
      });
      toast.success("Settings saved");
      await load();
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleMaintenanceToggle = (val: boolean) => {
    if (val) {
      setMaintenanceConfirm(true);
    } else {
      setMaintenance(false);
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;

  const showLoading = isLoading || isFetching;

  return (
    <div>
      <PageHeader
        title="App Settings"
        subtitle="Global configuration for DramaReels Pro"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Maintenance Mode */}
        <div
          className="rounded-xl p-5"
          style={{
            background: maintenance
              ? "oklch(0.6 0.22 25 / 0.08)"
              : "oklch(0.115 0.012 285)",
            border: maintenance
              ? "1px solid oklch(0.6 0.22 25 / 0.4)"
              : "1px solid oklch(0.22 0.018 285)",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle
              className="w-4 h-4"
              style={{
                color: maintenance
                  ? "oklch(0.6 0.22 25)"
                  : "oklch(0.62 0.02 285)",
              }}
            />
            <h3 className="text-sm font-semibold">Maintenance Mode</h3>
          </div>

          {showLoading ? (
            <Skeleton className="h-14 w-full" />
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm">Enable Maintenance Mode</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    App will show maintenance screen to all users
                  </div>
                </div>
                <Switch
                  checked={maintenance}
                  onCheckedChange={handleMaintenanceToggle}
                />
              </div>
              {maintenance && (
                <div
                  className="p-3 rounded-lg text-xs"
                  style={{
                    background: "oklch(0.6 0.22 25 / 0.12)",
                    color: "oklch(0.7 0.2 25)",
                    border: "1px solid oklch(0.6 0.22 25 / 0.3)",
                  }}
                >
                  ⚠️ Maintenance mode is ON — users cannot access the app
                </div>
              )}
            </>
          )}
        </div>

        {/* VIP Pricing */}
        <div className="card-surface rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Settings2
              className="w-4 h-4"
              style={{ color: "oklch(0.75 0.18 298)" }}
            />
            <h3 className="text-sm font-semibold">VIP Subscription Pricing</h3>
          </div>

          {showLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="space-y-3">
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
        </div>

        {/* App Info */}
        <div className="card-surface rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Info
              className="w-4 h-4"
              style={{ color: "oklch(0.55 0.18 220)" }}
            />
            <h3 className="text-sm font-semibold">App Information</h3>
          </div>
          <div className="space-y-2">
            {[
              { label: "Admin Panel Version", value: "v1.0.0" },
              { label: "Platform", value: "Internet Computer (ICP)" },
              { label: "Build", value: "Production" },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between py-2"
                style={{ borderBottom: "1px solid oklch(0.18 0.014 285)" }}
              >
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-xs font-mono font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div
          className="rounded-xl p-5"
          style={{
            background: "oklch(0.115 0.012 285)",
            border: "1px solid oklch(0.6 0.22 25 / 0.2)",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Shield
              className="w-4 h-4"
              style={{ color: "oklch(0.6 0.22 25)" }}
            />
            <h3
              className="text-sm font-semibold"
              style={{ color: "oklch(0.7 0.2 25)" }}
            >
              Danger Zone
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm">Clear Cache</div>
                <div className="text-xs text-muted-foreground">
                  Clears local admin cache
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  localStorage.removeItem("admob_banner");
                  localStorage.removeItem("admob_interstitial");
                  localStorage.removeItem("admob_rewarded");
                  toast.success("Cache cleared");
                }}
                style={{
                  borderColor: "oklch(0.6 0.22 25 / 0.4)",
                  color: "oklch(0.7 0.2 25)",
                }}
              >
                <Trash2 className="w-3 h-3 mr-1.5" />
                Clear Cache
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving || showLoading}
          style={{ background: "oklch(0.58 0.24 340)", color: "white" }}
          className="px-8"
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Maintenance Confirm Dialog */}
      <AlertDialog
        open={maintenanceConfirm}
        onOpenChange={setMaintenanceConfirm}
      >
        <AlertDialogContent
          style={{
            background: "oklch(0.13 0.014 285)",
            border: "1px solid oklch(0.6 0.22 25 / 0.4)",
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Enable Maintenance Mode?</AlertDialogTitle>
            <AlertDialogDescription>
              This will prevent all users from accessing the app until you
              disable maintenance mode. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setMaintenance(true);
                setMaintenanceConfirm(false);
              }}
              className="bg-destructive text-destructive-foreground"
            >
              Enable Maintenance Mode
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

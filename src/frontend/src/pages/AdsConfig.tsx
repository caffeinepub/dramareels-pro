import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, Megaphone } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { AppConfig } from "../backend.d";
import { ErrorState } from "../components/ErrorState";
import { PageHeader } from "../components/PageHeader";
import { useActor } from "../hooks/useActor";

export function AdsConfig() {
  const { actor, isFetching } = useActor();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [bannerId, setBannerId] = useState("");
  const [interstitialId, setInterstitialId] = useState("");
  const [rewardedId, setRewardedId] = useState("");
  const [testMode, setTestMode] = useState(false);

  const load = async () => {
    if (!actor) return;
    setIsLoading(true);
    setError(null);
    try {
      const cfg = await actor.getAppConfig();
      setConfig(cfg);
      setBannerId(localStorage.getItem("admob_banner") || "");
      setInterstitialId(localStorage.getItem("admob_interstitial") || "");
      setRewardedId(localStorage.getItem("admob_rewarded") || "");
      setTestMode(localStorage.getItem("admob_test") === "true");
    } catch {
      setError("Failed to load configuration");
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
      localStorage.setItem("admob_banner", bannerId);
      localStorage.setItem("admob_interstitial", interstitialId);
      localStorage.setItem("admob_rewarded", rewardedId);
      localStorage.setItem("admob_test", String(testMode));

      await actor.updateAppConfig(config);
      toast.success("Ad configuration saved");
    } catch {
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;

  const showLoading = isLoading || isFetching;

  return (
    <div>
      <PageHeader
        title="Ads Configuration"
        subtitle="Configure AdMob ad unit IDs"
      />

      {/* Warning Banner */}
      <div
        className="flex items-start gap-3 p-4 rounded-xl mb-5"
        style={{
          background: "oklch(0.88 0.18 86 / 0.08)",
          border: "1px solid oklch(0.88 0.18 86 / 0.3)",
        }}
      >
        <AlertTriangle
          className="w-5 h-5 mt-0.5 flex-shrink-0"
          style={{ color: "oklch(0.88 0.18 86)" }}
        />
        <div>
          <div
            className="text-sm font-semibold"
            style={{ color: "oklch(0.88 0.18 86)" }}
          >
            Live App Warning
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Changes to Ad Unit IDs will affect the live mobile app immediately.
            Test thoroughly using Test Mode before switching to production IDs.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ad Unit IDs */}
        <div className="card-surface rounded-xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <Megaphone
              className="w-4 h-4"
              style={{ color: "oklch(0.78 0.2 340)" }}
            />
            <h3 className="text-sm font-semibold">Ad Unit IDs</h3>
          </div>

          {showLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: "oklch(0.72 0.22 145)" }}
                  />
                  Banner Ad Unit ID
                </Label>
                <Input
                  value={bannerId}
                  onChange={(e) => setBannerId(e.target.value)}
                  placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: "oklch(0.42 0.18 298)" }}
                  />
                  Interstitial Ad Unit ID
                </Label>
                <Input
                  value={interstitialId}
                  onChange={(e) => setInterstitialId(e.target.value)}
                  placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: "oklch(0.88 0.18 86)" }}
                  />
                  Rewarded Ad Unit ID
                </Label>
                <Input
                  value={rewardedId}
                  onChange={(e) => setRewardedId(e.target.value)}
                  placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
                  className="font-mono text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Mode & Save */}
        <div className="space-y-4">
          <div className="card-surface rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-4">Test Mode</h3>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm">Enable Test Ads</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Use Google test ad unit IDs (no real revenue)
                </div>
              </div>
              <Switch checked={testMode} onCheckedChange={setTestMode} />
            </div>
            {testMode && (
              <div
                className="mt-3 p-3 rounded-lg text-xs"
                style={{
                  background: "oklch(0.72 0.22 145 / 0.1)",
                  color: "oklch(0.72 0.22 145)",
                  border: "1px solid oklch(0.72 0.22 145 / 0.3)",
                }}
              >
                ✓ Test mode active — using Google test ad IDs
              </div>
            )}
          </div>

          <div className="card-surface rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-3">Status</h3>
            <div className="space-y-2 text-xs">
              {[
                { label: "Banner", id: bannerId },
                { label: "Interstitial", id: interstitialId },
                { label: "Rewarded", id: rewardedId },
              ].map(({ label, id }) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-1"
                >
                  <span className="text-muted-foreground">{label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full ${id ? "badge-active" : "badge-archived"}`}
                  >
                    {id ? "Configured" : "Not set"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleSave}
            disabled={saving || showLoading}
            style={{ background: "oklch(0.58 0.24 340)", color: "white" }}
          >
            {saving ? "Saving..." : "Save Configuration"}
          </Button>
        </div>
      </div>
    </div>
  );
}

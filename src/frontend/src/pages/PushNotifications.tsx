import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { Bell, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Notification } from "../backend.d";
import { TargetAudience } from "../backend.d";
import { ErrorState } from "../components/ErrorState";
import { PageHeader } from "../components/PageHeader";
import { useActor } from "../hooks/useActor";

const AUDIENCE_LABELS: Record<
  TargetAudience,
  { label: string; style: string }
> = {
  [TargetAudience.all]: { label: "All Users", style: "badge-active" },
  [TargetAudience.vip]: { label: "VIP Only", style: "badge-vip" },
  [TargetAudience.free]: { label: "Free Users", style: "badge-monthly" },
};

export function PushNotifications() {
  const { actor, isFetching } = useActor();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [audience, setAudience] = useState<TargetAudience>(TargetAudience.all);

  const load = async () => {
    if (!actor) return;
    setIsLoading(true);
    setError(null);
    try {
      const notifs = await actor.getNotifications();
      setNotifications(
        notifs.sort((a, b) => Number(b.sentAt) - Number(a.sentAt)),
      );
    } catch {
      setError("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: load is stable within actor/isFetching context
  useEffect(() => {
    if (!isFetching && actor) load();
  }, [actor, isFetching]);

  const handleSend = async () => {
    if (!actor) return;
    if (!title.trim()) {
      toast.error("Title required");
      return;
    }
    if (!body.trim()) {
      toast.error("Body required");
      return;
    }
    setSending(true);
    try {
      await actor.sendNotification(title, body, imageUrl, audience, "admin");
      toast.success("Notification sent successfully");
      setTitle("");
      setBody("");
      setImageUrl("");
      setAudience(TargetAudience.all);
      await load();
    } catch {
      toast.error("Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;

  const showLoading = isLoading || isFetching;

  return (
    <div>
      <PageHeader
        title="Push Notifications"
        subtitle="Compose and send push notifications to users"
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Compose Panel */}
        <div className="lg:col-span-2 card-surface rounded-xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <Bell
              className="w-4 h-4"
              style={{ color: "oklch(0.78 0.2 340)" }}
            />
            <h3 className="text-sm font-semibold">Compose Notification</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Notification title..."
                maxLength={60}
              />
              <div className="text-xs text-muted-foreground text-right">
                {title.length}/60
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Body</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Notification message..."
                rows={4}
                maxLength={200}
              />
              <div className="text-xs text-muted-foreground text-right">
                {body.length}/200
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Image URL (optional)</Label>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>Target Audience</Label>
              <RadioGroup
                value={audience}
                onValueChange={(v) => setAudience(v as TargetAudience)}
                className="space-y-2"
              >
                {Object.values(TargetAudience).map((aud) => (
                  <div key={aud} className="flex items-center gap-2.5">
                    <RadioGroupItem value={aud} id={`aud-${aud}`} />
                    <Label
                      htmlFor={`aud-${aud}`}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${AUDIENCE_LABELS[aud].style}`}
                      >
                        {AUDIENCE_LABELS[aud].label}
                      </span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Preview */}
            {(title || body) && (
              <div
                className="rounded-xl p-3 mt-2"
                style={{
                  background: "oklch(0.16 0.014 285)",
                  border: "1px solid oklch(0.25 0.018 285)",
                }}
              >
                <div className="text-xs text-muted-foreground mb-2">
                  Preview
                </div>
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt="notification"
                    className="w-full h-20 object-cover rounded-lg mb-2"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                )}
                <div className="text-sm font-semibold">
                  {title || "Title..."}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {body || "Message..."}
                </div>
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleSend}
              disabled={sending || !title || !body}
              style={{ background: "oklch(0.58 0.24 340)", color: "white" }}
            >
              {sending ? (
                "Sending..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Notification
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Notification History */}
        <div className="lg:col-span-3 card-surface rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">Notification History</h3>

          {showLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No notifications sent yet
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notif) => {
                const aud = AUDIENCE_LABELS[notif.targetAudience];
                return (
                  <div
                    key={notif.id}
                    className="rounded-xl p-4"
                    style={{
                      background: "oklch(0.16 0.014 285)",
                      border: "1px solid oklch(0.22 0.018 285)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm truncate">
                            {notif.title}
                          </span>
                          {aud && (
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${aud.style}`}
                            >
                              {aud.label}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notif.body}
                        </p>
                      </div>
                      {notif.imageUrl && (
                        <img
                          src={notif.imageUrl}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>by {notif.sentBy}</span>
                      <span>·</span>
                      <span>
                        {formatDistanceToNow(
                          new Date(Number(notif.sentAt) / 1_000_000),
                          { addSuffix: true },
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

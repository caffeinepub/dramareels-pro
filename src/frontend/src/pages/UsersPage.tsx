import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Ban, Coins, Crown, Search, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { CoinTransaction, User } from "../backend.d";
import { DataTable } from "../components/DataTable";
import { ErrorState } from "../components/ErrorState";
import { PageHeader } from "../components/PageHeader";
import { useActor } from "../hooks/useActor";

type FilterType = "all" | "vip" | "blocked";

export function UsersPage() {
  const { actor, isFetching } = useActor();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userTxs, setUserTxs] = useState<CoinTransaction[]>([]);
  const [loadingTxs, setLoadingTxs] = useState(false);
  const [coinAdj, setCoinAdj] = useState("");
  const [coinReason, setCoinReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    if (!actor) return;
    setIsLoading(true);
    setError(null);
    try {
      const us = await actor.getUsers();
      setUsers(us);
    } catch {
      setError("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: load is stable within actor/isFetching context
  useEffect(() => {
    if (!isFetching && actor) load();
  }, [actor, isFetching]);

  const openUser = async (user: User) => {
    if (!actor) return;
    setSelectedUser(user);
    setCoinAdj("");
    setCoinReason("");
    setLoadingTxs(true);
    try {
      const txs = await actor.getUserTransactions(user.id);
      setUserTxs(txs);
    } catch {
      setUserTxs([]);
    } finally {
      setLoadingTxs(false);
    }
  };

  const handleAdjustCoins = async () => {
    if (!actor || !selectedUser || !coinAdj) return;
    const amount = Number.parseInt(coinAdj);
    if (Number.isNaN(amount)) {
      toast.error("Enter a valid number");
      return;
    }
    setActionLoading(true);
    try {
      await actor.adjustUserCoins(
        selectedUser.id,
        BigInt(amount),
        coinReason || "Admin adjustment",
      );
      toast.success(`Coins adjusted: ${amount > 0 ? "+" : ""}${amount}`);
      setCoinAdj("");
      setCoinReason("");
      await load();
      const updated = await actor.getUser(selectedUser.id);
      if (updated) setSelectedUser(updated);
    } catch {
      toast.error("Failed to adjust coins");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlockToggle = async () => {
    if (!actor || !selectedUser) return;
    setActionLoading(true);
    try {
      if (selectedUser.isBlocked) {
        await actor.unblockUser(selectedUser.id);
        toast.success("User unblocked");
      } else {
        await actor.blockUser(selectedUser.id);
        toast.success("User blocked");
      }
      await load();
      const updated = await actor.getUser(selectedUser.id);
      if (updated) setSelectedUser(updated);
    } catch {
      toast.error("Failed to update user status");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search);
    const matchesFilter =
      filter === "all" ||
      (filter === "vip" && u.isVIP) ||
      (filter === "blocked" && u.isBlocked);
    return matchesSearch && matchesFilter;
  });

  if (error) return <ErrorState message={error} onRetry={load} />;

  const showLoading = isLoading || isFetching;

  const columns = [
    {
      header: "User",
      cell: (row: User) => (
        <div className="flex items-center gap-2.5">
          <Avatar className="w-8 h-8">
            <AvatarImage src={row.avatar} />
            <AvatarFallback
              className="text-xs font-semibold"
              style={{
                background: "oklch(0.22 0.025 340)",
                color: "oklch(0.78 0.2 340)",
              }}
            >
              {row.displayName.slice(0, 2).toUpperCase() || "??"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-sm">
              {row.displayName || "Unknown"}
            </div>
            <div className="text-xs text-muted-foreground">{row.phone}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Coins",
      cell: (row: User) => (
        <span
          className="tabular-nums font-semibold text-sm"
          style={{ color: "oklch(0.88 0.18 86)" }}
        >
          🪙 {Number(row.coins).toLocaleString()}
        </span>
      ),
    },
    {
      header: "VIP",
      cell: (row: User) =>
        row.isVIP ? (
          <span className="badge-vip text-xs px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
            <Crown className="w-3 h-3" />
            VIP
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      header: "Joined",
      cell: (row: User) => (
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(Number(row.createdAt) / 1_000_000), {
            addSuffix: true,
          })}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (row: User) =>
        row.isBlocked ? (
          <span className="badge-blocked text-xs px-2 py-0.5 rounded-full">
            Blocked
          </span>
        ) : (
          <span className="badge-active text-xs px-2 py-0.5 rounded-full">
            Active
          </span>
        ),
    },
  ];

  return (
    <div>
      <PageHeader title="Users" subtitle={`${users.length} total users`} />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "vip", "blocked"] as FilterType[]).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
              style={
                filter === f
                  ? { background: "oklch(0.58 0.24 340)", color: "white" }
                  : {}
              }
            >
              {f === "vip" ? "👑 VIP" : f === "blocked" ? "🚫 Blocked" : "All"}
            </Button>
          ))}
        </div>
      </div>

      <div className="card-surface rounded-xl p-5">
        <DataTable
          columns={columns}
          data={filteredUsers}
          isLoading={showLoading}
          onRowClick={openUser}
          emptyMessage="No users found"
        />
      </div>

      {/* User Detail Drawer */}
      <Sheet
        open={!!selectedUser}
        onOpenChange={(o) => !o && setSelectedUser(null)}
      >
        <SheetContent
          className="w-[420px] sm:max-w-[420px] overflow-y-auto custom-scroll"
          style={{
            background: "oklch(0.1 0.01 285)",
            borderLeft: "1px solid oklch(0.22 0.018 285)",
          }}
        >
          <SheetHeader>
            <SheetTitle>User Details</SheetTitle>
          </SheetHeader>

          {selectedUser && (
            <div className="space-y-5 mt-4">
              {/* User info */}
              <div className="card-surface rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={selectedUser.avatar} />
                    <AvatarFallback
                      className="text-sm font-bold"
                      style={{
                        background: "oklch(0.22 0.025 340)",
                        color: "oklch(0.78 0.2 340)",
                      }}
                    >
                      {selectedUser.displayName.slice(0, 2).toUpperCase() ||
                        "??"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">
                      {selectedUser.displayName || "Unknown"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {selectedUser.phone}
                    </div>
                    <div className="flex gap-1.5 mt-1">
                      {selectedUser.isVIP && (
                        <span className="badge-vip text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Crown className="w-3 h-3" /> VIP
                        </span>
                      )}
                      {selectedUser.isBlocked && (
                        <span className="badge-blocked text-xs px-2 py-0.5 rounded-full">
                          Blocked
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div
                    className="rounded-lg p-2"
                    style={{ background: "oklch(0.88 0.18 86 / 0.1)" }}
                  >
                    <div
                      className="text-lg font-bold tabular-nums"
                      style={{ color: "oklch(0.88 0.18 86)" }}
                    >
                      {Number(selectedUser.coins).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">Coins</div>
                  </div>
                  <div
                    className="rounded-lg p-2"
                    style={{ background: "oklch(0.42 0.18 298 / 0.1)" }}
                  >
                    <div
                      className="text-lg font-bold tabular-nums"
                      style={{ color: "oklch(0.75 0.18 298)" }}
                    >
                      {selectedUser.favorites.length}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Favorites
                    </div>
                  </div>
                  <div
                    className="rounded-lg p-2"
                    style={{ background: "oklch(0.58 0.24 340 / 0.1)" }}
                  >
                    <div
                      className="text-lg font-bold tabular-nums"
                      style={{ color: "oklch(0.78 0.2 340)" }}
                    >
                      {selectedUser.watchHistory.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Watched</div>
                  </div>
                </div>
              </div>

              {/* Coin Adjustment */}
              <div className="card-surface rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Coins
                    className="w-4 h-4"
                    style={{ color: "oklch(0.88 0.18 86)" }}
                  />
                  <h4 className="text-sm font-semibold">Adjust Coins</h4>
                </div>
                <div className="space-y-2">
                  <Input
                    type="number"
                    value={coinAdj}
                    onChange={(e) => setCoinAdj(e.target.value)}
                    placeholder="Amount (+ or -)"
                  />
                  <Input
                    value={coinReason}
                    onChange={(e) => setCoinReason(e.target.value)}
                    placeholder="Reason (optional)"
                  />
                  <Button
                    className="w-full"
                    onClick={handleAdjustCoins}
                    disabled={actionLoading || !coinAdj}
                    style={{
                      background: "oklch(0.88 0.18 86 / 0.9)",
                      color: "oklch(0.1 0 0)",
                    }}
                  >
                    {actionLoading ? "Adjusting..." : "Adjust Coins"}
                  </Button>
                </div>
              </div>

              {/* Block/Unblock */}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleBlockToggle}
                disabled={actionLoading}
                style={
                  selectedUser.isBlocked
                    ? {
                        borderColor: "oklch(0.72 0.22 145 / 0.5)",
                        color: "oklch(0.72 0.22 145)",
                      }
                    : {
                        borderColor: "oklch(0.6 0.22 25 / 0.5)",
                        color: "oklch(0.7 0.2 25)",
                      }
                }
              >
                {selectedUser.isBlocked ? (
                  <>
                    <UserCheck className="w-4 h-4 mr-2" /> Unblock User
                  </>
                ) : (
                  <>
                    <Ban className="w-4 h-4 mr-2" /> Block User
                  </>
                )}
              </Button>

              {/* Recent Transactions */}
              <div className="card-surface rounded-xl p-4">
                <h4 className="text-sm font-semibold mb-3">
                  Recent Transactions
                </h4>
                {loadingTxs ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : userTxs.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No transactions
                  </p>
                ) : (
                  <div className="space-y-2">
                    {userTxs.slice(0, 10).map((tx) => {
                      const amount = Number(tx.amount);
                      return (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between py-1.5 text-xs"
                          style={{
                            borderBottom: "1px solid oklch(0.18 0.014 285)",
                          }}
                        >
                          <div>
                            <div className="capitalize font-medium">
                              {tx.transactionType}
                            </div>
                            <div className="text-muted-foreground">
                              {tx.description}
                            </div>
                          </div>
                          <span
                            className="font-semibold tabular-nums"
                            style={{
                              color:
                                amount >= 0
                                  ? "oklch(0.72 0.22 145)"
                                  : "oklch(0.6 0.22 25)",
                            }}
                          >
                            {amount >= 0 ? "+" : ""}
                            {amount}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

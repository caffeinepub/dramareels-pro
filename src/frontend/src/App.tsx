import { Toaster } from "@/components/ui/sonner";
import {
  Bell,
  ChevronRight,
  Clapperboard,
  Coins,
  CreditCard,
  Film,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Settings,
  Tag,
  Users,
  Video,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AdsConfig } from "./pages/AdsConfig";
import { AppSettings } from "./pages/AppSettings";
import { Categories } from "./pages/Categories";
import { CoinsRewards } from "./pages/CoinsRewards";
import { Dashboard } from "./pages/Dashboard";
import { Dramas } from "./pages/Dramas";
import { Episodes } from "./pages/Episodes";
import { PushNotifications } from "./pages/PushNotifications";
import { Subscriptions } from "./pages/Subscriptions";
import { UsersPage } from "./pages/UsersPage";

type PageId =
  | "dashboard"
  | "dramas"
  | "episodes"
  | "categories"
  | "users"
  | "subscriptions"
  | "coins"
  | "ads"
  | "notifications"
  | "settings";

interface NavItem {
  id: PageId;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "dramas", icon: Film, label: "Dramas" },
  { id: "episodes", icon: Video, label: "Episodes" },
  { id: "categories", icon: Tag, label: "Categories" },
  { id: "users", icon: Users, label: "Users" },
  { id: "subscriptions", icon: CreditCard, label: "Subscriptions" },
  { id: "coins", icon: Coins, label: "Coins & Rewards" },
  { id: "ads", icon: Megaphone, label: "Ads Config" },
  { id: "notifications", icon: Bell, label: "Push Notifications" },
  { id: "settings", icon: Settings, label: "App Settings" },
];

const PAGE_TITLES: Record<PageId, string> = {
  dashboard: "Dashboard",
  dramas: "Dramas Management",
  episodes: "Episodes Manager",
  categories: "Categories",
  users: "Users",
  subscriptions: "Subscriptions",
  coins: "Coins & Rewards",
  ads: "Ads Configuration",
  notifications: "Push Notifications",
  settings: "App Settings",
};

function PageContent({ page }: { page: PageId }) {
  switch (page) {
    case "dashboard":
      return <Dashboard />;
    case "dramas":
      return <Dramas />;
    case "episodes":
      return <Episodes />;
    case "categories":
      return <Categories />;
    case "users":
      return <UsersPage />;
    case "subscriptions":
      return <Subscriptions />;
    case "coins":
      return <CoinsRewards />;
    case "ads":
      return <AdsConfig />;
    case "notifications":
      return <PushNotifications />;
    case "settings":
      return <AppSettings />;
    default:
      return <Dashboard />;
  }
}

function Sidebar({
  activePage,
  onNavigate,
}: {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
}) {
  return (
    <aside
      className="fixed left-0 top-0 h-screen w-60 flex flex-col z-40"
      style={{
        background: "oklch(0.1 0.01 285)",
        borderRight: "1px solid oklch(0.2 0.016 285)",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-5 py-5"
        style={{ borderBottom: "1px solid oklch(0.2 0.016 285)" }}
      >
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.58 0.24 340), oklch(0.42 0.18 298))",
          }}
        >
          <Clapperboard className="w-4 h-4 text-white" />
        </div>
        <div>
          <div
            className="text-sm font-bold leading-tight"
            style={{ color: "oklch(0.78 0.2 340)" }}
          >
            DramaReels
          </div>
          <div
            className="text-xs leading-tight"
            style={{ color: "oklch(0.62 0.02 285)" }}
          >
            Pro Admin
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto custom-scroll py-3 px-2">
        {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
          const isActive = activePage === id;
          return (
            <button
              key={id}
              type="button"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm transition-all duration-150 text-left ${
                isActive
                  ? "nav-active text-white font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
              onClick={() => onNavigate(id)}
            >
              <span
                className="w-4 h-4 flex-shrink-0 flex items-center justify-center"
                style={isActive ? { color: "oklch(0.78 0.2 340)" } : {}}
              >
                <Icon className="w-4 h-4" />
              </span>
              <span className="flex-1 truncate">{label}</span>
              {isActive && (
                <ChevronRight
                  className="w-3 h-3 flex-shrink-0"
                  style={{ color: "oklch(0.78 0.2 340)" }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className="px-4 py-4"
        style={{ borderTop: "1px solid oklch(0.2 0.016 285)" }}
      >
        <div
          className="text-xs text-center"
          style={{ color: "oklch(0.45 0.01 285)" }}
        >
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Built with caffeine.ai
          </a>
        </div>
      </div>
    </aside>
  );
}

function TopBar({ activePage }: { activePage: PageId }) {
  const title = PAGE_TITLES[activePage];

  return (
    <header
      className="fixed top-0 left-60 right-0 h-14 flex items-center justify-between px-6 z-30"
      style={{
        background: "oklch(0.085 0.008 285 / 0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid oklch(0.2 0.016 285)",
      }}
    >
      <h1 className="text-sm font-semibold text-foreground">{title}</h1>
      <div className="flex items-center gap-3">
        <span
          className="text-xs font-medium px-2.5 py-1 rounded-full"
          style={{
            background: "oklch(0.58 0.24 340 / 0.15)",
            color: "oklch(0.78 0.2 340)",
            border: "1px solid oklch(0.58 0.24 340 / 0.3)",
          }}
        >
          Admin
        </span>
        <button
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          type="button"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState<PageId>("dashboard");

  // Sync with URL hash for basic navigation
  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as PageId;
    if (hash && PAGE_TITLES[hash]) {
      setActivePage(hash);
    }
  }, []);

  const handleNavigate = (page: PageId) => {
    setActivePage(page);
    window.location.hash = page;
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: "oklch(0.085 0.008 285)" }}
    >
      <Sidebar activePage={activePage} onNavigate={handleNavigate} />
      <TopBar activePage={activePage} />
      <main className="ml-60 pt-14 min-h-screen">
        <div className="p-6">
          <PageContent page={activePage} />
        </div>
      </main>
      <Toaster theme="dark" position="bottom-right" />
    </div>
  );
}

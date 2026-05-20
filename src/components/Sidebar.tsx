"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  Newspaper,
  PenLine,
  FileText,
  Trophy,
  BarChart3,
  User,
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Feed", icon: Newspaper },
  { href: "/create", label: "Create", icon: PenLine },
  { href: "/my-posts", label: "My Posts", icon: FileText },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/profile", label: "Profile", icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 flex flex-col border-r border-border glass">
      <div className="px-5 py-6">
        <Link href="/" className="text-lg font-display font-bold tracking-tight">
          <span className="gradient-text">Factorial Posts</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ease-out ${
                isActive
                  ? "bg-accent-muted text-accent border-l-2 border-accent"
                  : "text-text-secondary hover:text-fg hover:bg-white/[0.04]"
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="px-3 pb-5 space-y-2">
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-fg truncate">
              {user.nickname || user.name}
            </p>
            <p className="text-xs text-text-secondary truncate">
              {user.role || user.department}
            </p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:text-fg hover:bg-white/[0.04] transition-all duration-150 ease-out w-full"
          >
            <LogOut size={18} strokeWidth={1.5} />
            Log out
          </button>
        </div>
      )}
    </aside>
  );
}

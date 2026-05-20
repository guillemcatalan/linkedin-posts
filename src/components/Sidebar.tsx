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
    <aside className="w-60 shrink-0 h-screen sticky top-0 flex flex-col border-r border-border bg-surface">
      <div className="px-5 py-6">
        <Link href="/" className="text-lg font-semibold text-fg tracking-tight">
          Factorial
          <span className="text-accent ml-1">Posts</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1">
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent-muted text-accent"
                  : "text-text-secondary hover:text-fg hover:bg-surface-elevated"
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
            <p className="text-sm font-medium text-fg truncate">{user.name}</p>
            <p className="text-xs text-text-secondary truncate">
              {user.department}
            </p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:text-fg hover:bg-surface-elevated transition-colors w-full"
          >
            <LogOut size={18} strokeWidth={1.5} />
            Log out
          </button>
        </div>
      )}
    </aside>
  );
}

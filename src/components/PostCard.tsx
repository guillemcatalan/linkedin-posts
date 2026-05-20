"use client";

import { Heart, MessageCircle, Eye } from "lucide-react";

interface PostCardProps {
  authorName: string;
  department: string;
  text: string;
  date: string;
  likes?: number;
  comments?: number;
  views?: number;
  rank?: number;
  status?: "draft" | "published";
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

export default function PostCard({
  authorName,
  department,
  text,
  date,
  likes,
  comments,
  views,
  rank,
  status,
}: PostCardProps) {
  const initials = authorName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {rank !== undefined && (
            <span
              className={`text-lg font-bold tabular-nums w-7 ${
                rank === 1
                  ? "text-accent"
                  : rank === 2
                    ? "text-zinc-400"
                    : rank === 3
                      ? "text-amber-700"
                      : "text-text-secondary"
              }`}
            >
              {rank}
            </span>
          )}
          <div className="w-9 h-9 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-xs font-medium text-text-secondary">
            {initials}
          </div>
          <div>
            <p className="text-sm font-medium text-fg">{authorName}</p>
            <p className="text-xs text-text-secondary">{department}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                status === "published"
                  ? "bg-accent-muted text-accent"
                  : "bg-surface-elevated text-text-secondary"
              }`}
            >
              {status === "published" ? "Published" : "Draft"}
            </span>
          )}
          <span className="text-xs text-text-secondary">{timeAgo(date)}</span>
        </div>
      </div>

      <p className="text-sm text-fg/90 whitespace-pre-line leading-relaxed line-clamp-6">
        {text}
      </p>

      {(likes !== undefined || comments !== undefined || views !== undefined) && (
        <div className="flex items-center gap-5 pt-1">
          {likes !== undefined && (
            <span className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Heart size={14} />
              {formatNumber(likes)}
            </span>
          )}
          {comments !== undefined && (
            <span className="flex items-center gap-1.5 text-xs text-text-secondary">
              <MessageCircle size={14} />
              {formatNumber(comments)}
            </span>
          )}
          {views !== undefined && (
            <span className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Eye size={14} />
              {formatNumber(views)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

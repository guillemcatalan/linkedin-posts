"use client";

import { useEffect, useState } from "react";
import { Heart, MessageCircle, Eye, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

interface AnalyticsPost {
  id: string;
  input_idea: string;
  published_at: string;
  post_engagement: { likes: number; comments: number; views: number }[];
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<AnalyticsPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const { data } = await supabase
        .from("generated_posts")
        .select("id, input_idea, published_at, post_engagement(likes, comments, views)")
        .eq("user_id", user!.id)
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (data) setPosts(data as unknown as AnalyticsPost[]);
      setLoading(false);
    }
    load();
  }, [user]);

  const totalLikes = posts.reduce(
    (sum, p) => sum + (p.post_engagement?.[0]?.likes ?? 0),
    0
  );
  const totalComments = posts.reduce(
    (sum, p) => sum + (p.post_engagement?.[0]?.comments ?? 0),
    0
  );
  const totalViews = posts.reduce(
    (sum, p) => sum + (p.post_engagement?.[0]?.views ?? 0),
    0
  );

  const stats = [
    { label: "Published", value: posts.length, icon: FileText },
    { label: "Total Likes", value: totalLikes, icon: Heart },
    { label: "Total Comments", value: totalComments, icon: MessageCircle },
    { label: "Total Views", value: totalViews.toLocaleString(), icon: Eye },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-fg tracking-tight">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Performance of your published posts.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-10">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-surface border border-border rounded-xl p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon size={16} className="text-text-secondary" />
                <span className="text-xs text-text-secondary font-medium uppercase tracking-wider">
                  {stat.label}
                </span>
              </div>
              <p className="text-2xl font-semibold text-fg tabular-nums">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      {posts.length > 0 && (
        <>
          <h2 className="text-lg font-medium text-fg mb-4">
            Post performance
          </h2>
          <div className="space-y-3">
            {posts.map((post) => {
              const eng = post.post_engagement?.[0];
              const maxLikes = Math.max(
                ...posts.map((p) => p.post_engagement?.[0]?.likes ?? 0)
              );
              const barWidth =
                maxLikes > 0 ? ((eng?.likes ?? 0) / maxLikes) * 100 : 0;

              return (
                <div
                  key={post.id}
                  className="bg-surface border border-border rounded-xl p-4"
                >
                  <p className="text-sm text-fg/80 truncate mb-3">
                    {post.input_idea}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-2 bg-surface-elevated rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-text-secondary shrink-0">
                      <span className="flex items-center gap-1">
                        <Heart size={12} /> {eng?.likes ?? 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle size={12} /> {eng?.comments ?? 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye size={12} /> {(eng?.views ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {posts.length === 0 && (
        <div className="text-center py-10 text-text-secondary">
          <p>No published posts yet. Create and publish a post to see analytics.</p>
        </div>
      )}
    </div>
  );
}

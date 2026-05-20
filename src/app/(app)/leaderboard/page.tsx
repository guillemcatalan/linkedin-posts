"use client";

import { useEffect, useState } from "react";
import PostCard from "@/components/PostCard";
import { supabase } from "@/lib/supabase";

interface LeaderboardPost {
  id: string;
  variant_1: string;
  published_at: string;
  users: { name: string; department: string };
  post_engagement: { likes: number; comments: number; views: number }[];
}

export default function LeaderboardPage() {
  const [posts, setPosts] = useState<LeaderboardPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("generated_posts")
        .select(
          "id, variant_1, published_at, users(name, department), post_engagement(likes, comments, views)"
        )
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(50);

      if (data) {
        const sorted = (data as unknown as LeaderboardPost[]).sort((a, b) => {
          const aEng = a.post_engagement?.[0];
          const bEng = b.post_engagement?.[0];
          const aScore = (aEng?.likes ?? 0) + (aEng?.comments ?? 0);
          const bScore = (bEng?.likes ?? 0) + (bEng?.comments ?? 0);
          return bScore - aScore;
        });
        setPosts(sorted);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-display font-semibold text-fg tracking-tight">
          Leaderboard
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Top posts ranked by engagement.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post, i) => {
            const eng = post.post_engagement?.[0];
            return (
              <PostCard
                key={post.id}
                rank={i + 1}
                authorName={post.users?.name ?? "Unknown"}
                department={post.users?.department ?? ""}
                text={post.variant_1}
                date={post.published_at}
                likes={eng?.likes}
                comments={eng?.comments}
                views={eng?.views}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

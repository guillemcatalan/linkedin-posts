"use client";

import { useEffect, useState } from "react";
import PostCard from "@/components/PostCard";
import { supabase } from "@/lib/supabase";

interface FeedPost {
  id: string;
  variant_1: string;
  published_at: string;
  users: { name: string; department: string };
  post_engagement: { likes: number; comments: number; views: number }[];
}

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
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
        .limit(20);

      if (data) setPosts(data as unknown as FeedPost[]);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-fg tracking-tight">Feed</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Latest posts from the Factorial community.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const eng = post.post_engagement?.[0];
            return (
              <PostCard
                key={post.id}
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

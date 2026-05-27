"use client";

import { useEffect, useState } from "react";
import PostCard from "@/components/PostCard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

interface MyPost {
  id: string;
  input_idea: string;
  variant_1: string;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  post_engagement: { likes: number; comments: number; views: number }[];
}

export default function MyPostsPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const { data } = await supabase
          .from("generated_posts")
          .select("id, input_idea, variant_1, status, published_at, created_at, post_engagement(likes, comments, views)")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false });

        if (data) setPosts(data as unknown as MyPost[]);
      } catch {
        // Query failed, show empty state
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-display font-semibold text-fg tracking-tight">
          My Posts
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          All your generated posts — drafts and published.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-text-secondary">
          <p>No posts yet. Go to Create to generate your first post.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const eng = post.post_engagement?.[0];
            return (
              <PostCard
                key={post.id}
                authorName={user?.name ?? ""}
                department={user?.department ?? ""}
                text={post.variant_1}
                date={post.published_at ?? post.created_at}
                likes={eng?.likes}
                comments={eng?.comments}
                views={eng?.views}
                status={post.status}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

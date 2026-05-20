"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import PostForm from "@/components/PostForm";
import PostResults from "@/components/PostResults";
import type { PostVariant } from "@/types";

export default function CreatePage() {
  const { user } = useAuth();
  const [variants, setVariants] = useState<PostVariant[] | null>(null);
  const [postId, setPostId] = useState<string | null>(null);

  if (!user) return null;

  function handleResults(v: PostVariant[], id: string | null) {
    setVariants(v);
    setPostId(id);
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      {variants ? (
        <PostResults
          variants={variants}
          postId={postId}
          onStartOver={() => {
            setVariants(null);
            setPostId(null);
          }}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-display font-semibold text-fg tracking-tight">
              Create a post
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Describe your idea and we&apos;ll generate 3 LinkedIn post
              variants.
            </p>
          </div>
          <PostForm userId={user.id} onResults={handleResults} />
        </div>
      )}
    </div>
  );
}

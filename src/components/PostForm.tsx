"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { PostVariant } from "@/types";

interface PostFormProps {
  userId: string;
  onResults: (variants: PostVariant[], postId: string | null) => void;
}

export default function PostForm({ userId, onResults }: PostFormProps) {
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "generate",
        { body: { idea, userId } }
      );

      if (fnError) throw fnError;
      if (!data?.variants?.length) throw new Error("No variants returned");

      onResults(data.variants, data.postId ?? null);
    } catch {
      setError("Failed to generate posts. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
      <div>
        <label className="block text-sm font-medium text-fg mb-2">
          What do you want to post about?
        </label>
        <textarea
          placeholder="e.g. We just closed a deal with a 500-person company in Germany after 3 months of back and forth"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          required
          rows={3}
          className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-fg placeholder:text-[#555] focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 resize-none transition-colors"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="px-6 py-3 bg-accent text-bg rounded-full font-medium hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Generating..." : "Generate 3 posts"}
      </button>
    </form>
  );
}

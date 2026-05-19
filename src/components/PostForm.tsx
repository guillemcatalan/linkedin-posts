"use client";

import { useState } from "react";
import type { PostVariant } from "@/types";

interface PostFormProps {
  userId: string;
  onResults: (variants: PostVariant[]) => void;
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
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, idea }),
      });

      if (!res.ok) throw new Error("Generation failed");

      const { variants } = await res.json();
      onResults(variants);
    } catch {
      setError("Failed to generate posts. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">
          What do you want to post about?
        </label>
        <textarea
          placeholder="e.g. We just closed a deal with a 500-person company in Germany after 3 months of back and forth"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          required
          rows={2}
          className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="px-6 py-3 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Generating..." : "Generate 3 posts"}
      </button>
    </form>
  );
}

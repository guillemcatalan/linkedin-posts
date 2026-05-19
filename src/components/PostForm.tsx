"use client";

import { useState } from "react";
import type { PostVariant } from "@/types";

interface PostFormProps {
  userId: string;
  onResults: (variants: PostVariant[]) => void;
}

export default function PostForm({ userId, onResults }: PostFormProps) {
  const [whatHappened, setWhatHappened] = useState("");
  const [thePoint, setThePoint] = useState("");
  const [vibe, setVibe] = useState("");
  const [whatToAvoid, setWhatToAvoid] = useState("");
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
        body: JSON.stringify({ userId, whatHappened, thePoint, vibe, whatToAvoid }),
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
          What happened?
        </label>
        <textarea
          placeholder="Tell the story — what happened, who was involved, what went wrong or right..."
          value={whatHappened}
          onChange={(e) => setWhatHappened(e.target.value)}
          required
          rows={4}
          className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">
          What&apos;s the point?
        </label>
        <textarea
          placeholder="The takeaway, lesson, or insight you want people to walk away with"
          value={thePoint}
          onChange={(e) => setThePoint(e.target.value)}
          required
          rows={2}
          className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">
          Vibe
        </label>
        <textarea
          placeholder="Funny, reflective, slightly provocative, casual, serious..."
          value={vibe}
          onChange={(e) => setVibe(e.target.value)}
          required
          rows={1}
          className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">
          What to avoid (optional)
        </label>
        <textarea
          placeholder="Topics, phrases, angles you don't want..."
          value={whatToAvoid}
          onChange={(e) => setWhatToAvoid(e.target.value)}
          rows={1}
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

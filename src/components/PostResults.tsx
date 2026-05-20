"use client";

import { useState } from "react";
import { Copy, Check, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { PostVariant } from "@/types";

interface PostResultsProps {
  variants: PostVariant[];
  postId: string | null;
  onStartOver: () => void;
}

export default function PostResults({
  variants,
  postId,
  onStartOver,
}: PostResultsProps) {
  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-fg">Your posts</h2>
        <button
          onClick={onStartOver}
          className="text-sm text-text-secondary hover:text-fg transition-colors"
        >
          Start over
        </button>
      </div>

      {variants.map((variant, i) => (
        <VariantCard
          key={i}
          variant={variant}
          index={i + 1}
          postId={postId}
        />
      ))}
    </div>
  );
}

function VariantCard({
  variant,
  index,
  postId,
}: {
  variant: PostVariant;
  index: number;
  postId: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(variant.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handlePublish() {
    if (!postId) return;
    setPublishing(true);
    await supabase
      .from("generated_posts")
      .update({
        selected_variant: index,
        status: "published",
        published_at: new Date().toISOString(),
      })
      .eq("id", postId);
    setPublished(true);
    setPublishing(false);
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-secondary">
          Variant {index}
        </span>
        <div className="flex items-center gap-3">
          <span
            className={`text-xs tabular-nums ${
              variant.qualityScore.wordCountInRange
                ? "text-green-400"
                : "text-amber-400"
            }`}
          >
            {variant.wordCount} words
          </span>
          {variant.qualityScore.passed ? (
            <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
              Quality OK
            </span>
          ) : (
            <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
              Review
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-fg/90 whitespace-pre-line leading-relaxed">
        {variant.text}
      </p>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 text-sm px-4 py-2 border border-border rounded-full text-text-secondary hover:text-fg hover:bg-surface-elevated transition-colors"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          onClick={handlePublish}
          disabled={published || publishing || !postId}
          className="flex items-center gap-2 text-sm px-4 py-2 bg-accent text-bg rounded-full font-medium hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {published ? (
            <>
              <Check size={14} />
              Published
            </>
          ) : (
            <>
              <Send size={14} />
              {publishing ? "Publishing..." : "Publish"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

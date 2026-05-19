"use client";

import { useState } from "react";
import type { PostVariant } from "@/types";

interface PostResultsProps {
  variants: PostVariant[];
  onStartOver: () => void;
}

export default function PostResults({ variants, onStartOver }: PostResultsProps) {
  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-zinc-900">Your posts</h2>
        <button
          onClick={onStartOver}
          className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          Start over
        </button>
      </div>

      {variants.map((variant, i) => (
        <VariantCard key={i} variant={variant} index={i + 1} />
      ))}
    </div>
  );
}

function VariantCard({ variant, index }: { variant: PostVariant; index: number }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(variant.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const wordCountColor = variant.qualityScore.wordCountInRange
    ? "text-green-600"
    : "text-amber-600";

  return (
    <div className="border border-zinc-200 rounded-lg p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-500">Variant {index}</span>
        <div className="flex items-center gap-3">
          <span className={`text-xs ${wordCountColor}`}>
            {variant.wordCount} words
          </span>
          {variant.qualityScore.passed ? (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
              Quality OK
            </span>
          ) : (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
              Check quality
            </span>
          )}
        </div>
      </div>

      <p className="text-zinc-800 whitespace-pre-line leading-relaxed text-sm">
        {variant.text}
      </p>

      <button
        onClick={handleCopy}
        className="self-end text-sm px-4 py-1.5 border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}

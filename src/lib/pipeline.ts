import Anthropic from "@anthropic-ai/sdk";
import type { GenerateRequest, PostVariant, QualityScore } from "@/types";
import {
  buildPipelineContext,
  formatBenchmarkForPrompt,
  formatUserContextForPrompt,
} from "./context";

const anthropic = new Anthropic({
  baseURL: process.env.ANTHROPIC_BASE_URL,
  apiKey: process.env.ANTHROPIC_API_KEY,
});
const MODEL = "claude-sonnet-4-20250514";

const BANNED_PHRASES = [
  "i'm thrilled to share",
  "i'm humbled",
  "excited to announce",
  "in today's fast-paced world",
  "it's no secret that",
  "game-changer",
  "dive deep",
  "unlock your potential",
  "leverage",
  "synergy",
  "at the end of the day",
  "it goes without saying",
  "without further ado",
  "in conclusion",
  "let that sink in",
  "read that again",
  "here's the thing",
  "hot take",
  "i couldn't be more proud",
  "we're excited to share",
];

export async function generatePosts(
  input: GenerateRequest
): Promise<PostVariant[]> {
  // Step 1: Load all context
  const ctx = await buildPipelineContext(input.userId);

  // Step 2: Compose the full system prompt
  const systemParts = [ctx.systemPrompt, ctx.postStructure, ctx.factorialContext];

  const benchmarkSection = formatBenchmarkForPrompt(ctx.benchmarkPosts);
  if (benchmarkSection) systemParts.push(benchmarkSection);

  const userContext = formatUserContextForPrompt(ctx);
  if (userContext) systemParts.push(userContext);

  const fullSystemPrompt = systemParts.join("\n\n---\n\n");

  // Step 3: Build user message
  const userMessage = buildUserMessage(input);

  // Step 4: Generate 3 variants (single Claude call)
  const generation = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 3000,
    system: fullSystemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const generatedText =
    generation.content[0].type === "text" ? generation.content[0].text : "";

  // Step 5: Parse and quality check (code, no LLM)
  const rawVariants = parseVariants(generatedText);
  return rawVariants.map((text) => ({
    text,
    wordCount: countWords(text),
    qualityScore: checkQuality(text),
  }));
}

function buildUserMessage(input: GenerateRequest): string {
  return `## Post idea\n${input.idea}`;
}

function parseVariants(text: string): string[] {
  const variantPattern =
    /\*\*Variant \d\*\*\s*\n([\s\S]*?)(?=\*\*Variant \d\*\*|$)/g;
  const matches = [...text.matchAll(variantPattern)];

  if (matches.length >= 3) {
    return matches
      .slice(0, 3)
      .map((m) => m[1].trim().replace(/^---\s*$/gm, "").trim());
  }

  const dashSplit = text.split(/\n---\n/).map((s) => s.trim());
  if (dashSplit.length >= 3) {
    return dashSplit
      .slice(0, 3)
      .map((s) => s.replace(/^\*\*Variant \d\*\*\s*\n?/, "").trim());
  }

  return [text.trim()];
}

function countWords(text: string): number {
  const withoutHashtags = text.replace(/#\w+/g, "").trim();
  return withoutHashtags.split(/\s+/).filter(Boolean).length;
}

function checkQuality(text: string): QualityScore {
  const words = countWords(text);
  const lower = text.toLowerCase();
  const firstWord = text.trim().split(/\s/)[0];

  const hookStartsWithI = firstWord.toLowerCase() === "i";
  const wordCountInRange = words >= 150 && words <= 300;

  const hashtagMatches = text.match(/#\w+/g) || [];
  const hashtagCount = hashtagMatches.length;

  const hasBannedPhrases = BANNED_PHRASES.filter((phrase) =>
    lower.includes(phrase)
  );

  const passed =
    !hookStartsWithI &&
    wordCountInRange &&
    hashtagCount <= 5 &&
    hasBannedPhrases.length === 0;

  return {
    hookStartsWithI,
    wordCountInRange,
    hashtagCount,
    hasBannedPhrases,
    passed,
  };
}

import { readFile } from "fs/promises";
import { join } from "path";
import type { BenchmarkPost, PipelineContext } from "@/types";
import { getUserById, getProfile, getUserStyle, getUserPosts } from "./excel";
import { loadAllPrompts } from "./prompts";

export async function loadBenchmarkPosts(): Promise<BenchmarkPost[]> {
  const raw = await readFile(
    join(process.cwd(), "benchmark", "reference_posts.json"),
    "utf-8"
  );
  const posts: BenchmarkPost[] = JSON.parse(raw);
  return posts.filter((p) => !p.text.startsWith("PLACEHOLDER"));
}

export function formatBenchmarkForPrompt(posts: BenchmarkPost[]): string {
  if (posts.length === 0) return "";

  const examples = posts
    .map(
      (p, i) =>
        `### Example ${i + 1} (by ${p.author}, ${p.source})\n${p.text}\n\n_Why it works: ${p.why_its_good}_`
    )
    .join("\n\n---\n\n");

  return `## Reference posts — match this style\n\n${examples}`;
}

export function formatUserContextForPrompt(
  ctx: Pick<PipelineContext, "profile" | "userStyle" | "userPosts">
): string {
  const parts: string[] = [];

  if (ctx.profile) {
    parts.push(
      `## About the author\n- **Role:** ${ctx.profile.current_role} at ${ctx.profile.company}\n- **Headline:** ${ctx.profile.headline}\n- **Location:** ${ctx.profile.location}`
    );
  }

  if (ctx.userStyle) {
    parts.push(
      `## Author's writing style\n- **Tone:** ${ctx.userStyle.tone}\n- **Avg word count:** ${ctx.userStyle.avg_word_count}\n- **Emoji usage:** ${ctx.userStyle.emoji_usage}\n- **Common topics:** ${ctx.userStyle.common_topics}\n- **Notes:** ${ctx.userStyle.writing_notes}`
    );
  }

  if (ctx.userPosts.length > 0) {
    const samples = ctx.userPosts
      .slice(0, 3)
      .map((p, i) => `### Previous post ${i + 1}\n${p.post_text}`)
      .join("\n\n");
    parts.push(`## Author's previous posts (for style reference)\n\n${samples}`);
  }

  return parts.join("\n\n");
}

export async function buildPipelineContext(
  userId: string
): Promise<PipelineContext> {
  const [user, profile, userStyle, userPosts, benchmarkPosts, prompts] =
    await Promise.all([
      getUserById(userId),
      getProfile(userId),
      getUserStyle(userId),
      getUserPosts(userId),
      loadBenchmarkPosts(),
      loadAllPrompts(),
    ]);

  return {
    user,
    profile,
    userStyle,
    userPosts,
    factorialContext: prompts.factorialContext,
    benchmarkPosts,
    systemPrompt: prompts.systemPrompt,
    postStructure: prompts.postStructure,
    hookEvaluator: prompts.hookEvaluator,
  };
}

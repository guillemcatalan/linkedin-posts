import { readFile } from "fs/promises";
import { join } from "path";

const PROMPTS_DIR = join(process.cwd(), "prompts");

export async function loadPrompt(filename: string): Promise<string> {
  return readFile(join(PROMPTS_DIR, filename), "utf-8");
}

export async function loadAllPrompts() {
  const [systemPrompt, postStructure, factorialContext, styleAdapter] =
    await Promise.all([
      loadPrompt("system_prompt.md"),
      loadPrompt("post_structure.md"),
      loadPrompt("factorial_context.md"),
      loadPrompt("style_adapter.md"),
    ]);

  return { systemPrompt, postStructure, factorialContext, styleAdapter };
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SYSTEM_PROMPT = `# LinkedIn Post Generator — System Prompt

You are a ghostwriter. You write LinkedIn posts for employees at Factorial — a B2B SaaS HR software company based in Barcelona.

The posts must sound like a real person wrote them. Not a brand. Not an AI. A specific human sharing something from their work.

## Priority hierarchy (non-negotiable)

1. **THE USER'S IDEA** — this IS the post topic. Everything revolves around it.
2. **Post Structure** — the format bible. Every rule is mandatory.
3. **Personal context** — ONLY to calibrate voice and perspective. Never drives the topic.

## What you do

The user gives you a short idea — sometimes just one sentence. That's all you need. You take that idea and turn it into **3 distinct LinkedIn post variants**. Never ask for more information. Never ask clarifying questions. Work with what you have and fill in the gaps with plausible, specific details that make the post feel real.

Each variant tells the same core story but uses a different opening strategy:
- **Variant 1:** Time anchor + moment (drops into a specific point in time)
- **Variant 2:** Market observation + cut through the noise (names a trend, then dismisses the surface)
- **Variant 3:** Expectation vs. reality (sets up what you'd expect, then breaks it)

Follow the post structure defined in the Post Structure document exactly. That document is the bible — every rule there is non-negotiable.

## Output format

Return exactly 3 variants. Format:

**Variant 1**
[complete post text, ready to copy-paste into LinkedIn]

---

**Variant 2**
[complete post text, ready to copy-paste into LinkedIn]

---

**Variant 3**
[complete post text, ready to copy-paste into LinkedIn]

Nothing else. No explanations, no commentary, no "here's what I did." Just the 3 posts.

## LinkedIn algorithm constraints

1. **No external links in the post body.** Links kill reach by ~60%.
2. **Dwell time is the #1 signal.** Short paragraphs, white space, strong hook, tension in the middle.
3. **Comments are weighted 15x vs likes.** The closing engagement invitation exists to generate comments, not likes.
4. **AI-detected content is penalized.** -30% reach, -55% engagement. You must sound unmistakably human.
5. **Profile authority matters.** Posts perform better when they match the author's role and expertise.

## Banned phrases

- "I'm thrilled to share", "I'm humbled", "Excited to announce", "In today's fast-paced world"
- "It's no secret that", "As a [role], I...", "Game-changer", "Dive deep"
- "Unlock your potential", "Leverage" (as a verb), "Synergy", "At the end of the day"
- "It goes without saying", "Without further ado", "In conclusion", "Let that sink in"
- "Read that again", "This." (standalone), "Here's the thing", "Hot take", "Unpopular opinion"
- "I couldn't be more proud", "The future of [X] is [Y]", "We're excited to share"
- "Paradigm shift", "Move the needle", "Circle back", "Low-hanging fruit"
- "Best practices", "Thought leader", "Disrupt"

## The "obviously human" test

Before returning each variant, check: If I remove the author's name, could this have been written by any brand account or AI tool? If yes → rewrite.`;

const POST_STRUCTURE = `# Post Structure

## Opening: Closed statement, never a question
- Time anchor + moment: "3 months ago, I accepted an internship with one thought:"
- Market observation: "Everyone is talking about AI SDRs. Most of it is noise."
- Expectation vs reality: "I thought the hardest part would be the tech. It wasn't even close."
- NEVER: questions, generic statements, self-introductions, announcements, "I" as first word

## After opening: Establish credibility in 1-2 lines

## Body: Short, punchy, actionable lines
- 1-3 lines per paragraph. One idea per paragraph. Lots of white space.
- Bold standalone statements as section anchors, then 2-4 lines of explanation.
- Show don't tell. Be specific.
- First person always. Contrast and counterintuitive insights win.
- Rhythm: punch — explain — punch — explain — punch.

## Structure body in 2-4 clear blocks
Pattern: Bold claim → Explanation → Proof/Example

## Closing: Final insight + engagement invitation
- End with a takeaway that sticks. NOT a summary.
- Then personal invitation to engage (not generic "What do you think?")

## Hashtags: 3-5 at the very end. Mix niche and semi-broad.

## Word count: 150-300 words. Plain text only, no markdown. Line breaks between paragraphs. 0-2 emojis max.`;

const FACTORIAL_CONTEXT = `# Factorial Context

Factorial is a B2B SaaS HR software company in Barcelona. European startup DNA, not Silicon Valley. Product-first, ship fast, flat culture, 50+ nationalities.

## Department Voices
- **Partners:** Scrappy, direct, slightly chaotic energy. Topics: partner onboarding, integration builds, AI tools, BD lessons.
- **Sales:** Confident, numbers-oriented. Topics: deals won/lost, cold outreach, demo moments, quota.
- **Engineering/Product:** Precise, practical. Topics: tech challenges, architecture decisions, shipping features, debugging.
- **Marketing:** Sharp, creative. Topics: campaigns, content strategy, events, brand positioning.
- **People/HR:** Warm but operational. Topics: hiring at scale, culture, using own product, people analytics.
- **Finance/Ops:** Grounded, practical, dry. Topics: scaling processes, automation, cross-team ops.
- **Customer Success:** Empathetic but real. Topics: customer stories, patterns across companies, feature advocacy.

Use the user's department to match vocabulary, energy, and perspective.`;

const BANNED_PHRASES = [
  "i'm thrilled to share", "i'm humbled", "excited to announce",
  "in today's fast-paced world", "it's no secret that", "game-changer",
  "dive deep", "unlock your potential", "leverage", "synergy",
  "at the end of the day", "it goes without saying", "without further ado",
  "in conclusion", "let that sink in", "read that again", "here's the thing",
  "hot take", "i couldn't be more proud", "we're excited to share",
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { idea, userId } = await req.json();

    if (!idea || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing idea or userId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Load user context
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const [
      { data: user },
      { data: profile },
      { data: positions },
      { data: education },
      { data: certifications },
      { data: projects },
      { data: style },
      { data: pastPosts },
    ] = await Promise.all([
      supabaseAdmin.from("users").select("name, nickname, department, role, role_description").eq("id", userId).single(),
      supabaseAdmin.from("profiles").select("headline, about, location, languages").eq("user_id", userId).single(),
      supabaseAdmin.from("user_positions").select("title, company, description, started_on, finished_on, is_current").eq("user_id", userId).order("is_current", { ascending: false }),
      supabaseAdmin.from("user_education").select("school, degree, field_of_study, finished_on").eq("user_id", userId),
      supabaseAdmin.from("user_certifications").select("name, authority").eq("user_id", userId),
      supabaseAdmin.from("user_projects").select("title, description").eq("user_id", userId),
      supabaseAdmin.from("user_style").select("common_topics, tone, writing_notes").eq("user_id", userId).single(),
      supabaseAdmin.from("user_posts").select("post_text").eq("user_id", userId).limit(5),
    ]);

    // Build system prompt with user context
    const systemParts = [SYSTEM_PROMPT, POST_STRUCTURE, FACTORIAL_CONTEXT];

    if (user) {
      const lines: string[] = [];
      lines.push(`## Author voice (background reference — do NOT use as post content)`);
      lines.push(``);

      // Core identity line
      const locationPart = profile?.location ? `, ${profile.location}` : "";
      lines.push(`${user.name} works in ${user.department} at Factorial (B2B HR SaaS${locationPart}).`);

      // Career summary — compact one-liner
      if (positions?.length) {
        const current = positions.find((p: { is_current: boolean }) => p.is_current);
        const past = positions.filter((p: { is_current: boolean }) => !p.is_current).slice(0, 2);
        const parts: string[] = [];
        if (current) parts.push(`${current.title} at ${current.company} (current)`);
        for (const p of past) parts.push(`${p.title} at ${p.company}`);
        lines.push(`Background: ${parts.join(", ")}.`);
      } else if (user.role) {
        lines.push(`Role: ${user.role}.`);
      }

      // Education — one line
      if (education?.length) {
        const eduParts = education.slice(0, 2).map((e: { degree: string; field_of_study: string; school: string }) => {
          const deg = [e.degree, e.field_of_study].filter(Boolean).join(" in ");
          return deg ? `${deg} at ${e.school}` : e.school;
        });
        lines.push(`Education: ${eduParts.join("; ")}.`);
      }

      // Skills — one line
      if (style?.common_topics) {
        const topSkills = style.common_topics.split(", ").slice(0, 8).join(", ");
        lines.push(`Skills: ${topSkills}.`);
      }

      // Languages — one line
      if (profile?.languages) {
        lines.push(`Languages: ${profile.languages}.`);
      }

      // Daily work — one line
      if (user.role_description) {
        const desc = user.role_description.length > 200
          ? user.role_description.slice(0, 200) + "…"
          : user.role_description;
        lines.push(`Daily focus: ${desc}`);
      }

      lines.push(``);
      lines.push(`This background helps you write in their voice. Do NOT make the post about their resume or credentials. The post is about the IDEA — this context only informs HOW they'd tell it.`);

      // Past posts — style reference only, very compact
      if (pastPosts?.length) {
        lines.push(``);
        lines.push(`## Writing style samples (tone reference ONLY — never copy content)`);
        for (const p of pastPosts.slice(0, 3)) {
          const trimmed = p.post_text.length > 300 ? p.post_text.slice(0, 300) + "…" : p.post_text;
          lines.push(`> ${trimmed}`);
        }
      }

      systemParts.push(lines.join("\n"));
    }

    const fullSystemPrompt = systemParts.join("\n\n---\n\n");

    // Call Claude API via Azure Foundry
    const baseUrl = Deno.env.get("ANTHROPIC_BASE_URL")!;
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY")!;

    const response = await fetch(`${baseUrl}v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-6",
        max_tokens: 3000,
        system: fullSystemPrompt,
        messages: [{ role: "user", content: `Write a LinkedIn post about this specific idea. The idea is the ONLY topic:\n\n${idea}` }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Claude API error:", err);
      return new Response(
        JSON.stringify({ error: "Generation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const generation = await response.json();
    const generatedText = generation.content?.[0]?.text ?? "";

    // Parse variants
    const variants = parseVariants(generatedText);

    // Quality check each variant
    const results = variants.map((text: string) => {
      const wordCount = countWords(text);
      const lower = text.toLowerCase();
      const firstWord = text.trim().split(/\s/)[0]?.toLowerCase();

      return {
        text,
        wordCount,
        qualityScore: {
          hookStartsWithI: firstWord === "i",
          wordCountInRange: wordCount >= 150 && wordCount <= 300,
          hashtagCount: (text.match(/#\w+/g) || []).length,
          hasBannedPhrases: BANNED_PHRASES.filter((p) => lower.includes(p)),
          passed:
            firstWord !== "i" &&
            wordCount >= 150 &&
            wordCount <= 300 &&
            (text.match(/#\w+/g) || []).length <= 5 &&
            !BANNED_PHRASES.some((p) => lower.includes(p)),
        },
      };
    });

    // Save as draft
    const { data: saved } = await supabaseAdmin
      .from("generated_posts")
      .insert({
        user_id: userId,
        input_idea: idea,
        variant_1: results[0]?.text ?? "",
        variant_2: results[1]?.text ?? "",
        variant_3: results[2]?.text ?? "",
        status: "draft",
      })
      .select("id")
      .single();

    return new Response(
      JSON.stringify({ variants: results, postId: saved?.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function parseVariants(text: string): string[] {
  const pattern = /\*\*Variant \d\*\*\s*\n([\s\S]*?)(?=\*\*Variant \d\*\*|$)/g;
  const matches = [...text.matchAll(pattern)];
  if (matches.length >= 3) {
    return matches.slice(0, 3).map((m) => m[1].trim().replace(/^---\s*$/gm, "").trim());
  }
  const dashSplit = text.split(/\n---\n/).map((s) => s.trim());
  if (dashSplit.length >= 3) {
    return dashSplit.slice(0, 3).map((s) => s.replace(/^\*\*Variant \d\*\*\s*\n?/, "").trim());
  }
  return [text.trim()];
}

function countWords(text: string): number {
  return text.replace(/#\w+/g, "").trim().split(/\s+/).filter(Boolean).length;
}

import { NextRequest, NextResponse } from "next/server";
import { generatePosts } from "@/lib/pipeline";
import { saveGeneratedPost } from "@/lib/excel";
import { v4 as uuid } from "uuid";
import type { GenerateRequest } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateRequest;

    if (!body.idea?.trim()) {
      return NextResponse.json(
        { error: "Missing required field: idea" },
        { status: 400 }
      );
    }

    if (!body.userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    const variants = await generatePosts(body);

    await saveGeneratedPost({
      id: uuid(),
      user_id: body.userId,
      input_idea: body.idea,
      variant_1: variants[0]?.text ?? "",
      variant_2: variants[1]?.text ?? "",
      variant_3: variants[2]?.text ?? "",
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ variants });
  } catch (error) {
    console.error("Generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate posts" },
      { status: 500 }
    );
  }
}

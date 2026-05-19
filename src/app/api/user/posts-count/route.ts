import { NextRequest, NextResponse } from "next/server";
import { getUserPosts } from "@/lib/excel";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const posts = await getUserPosts(userId);
  return NextResponse.json({ count: posts.length });
}

import { NextRequest, NextResponse } from "next/server";
import { fetchUserPosts } from "@/lib/linkedin";
import { saveUserPost, getUserPosts } from "@/lib/excel";

export async function POST(request: NextRequest) {
  try {
    const { userId, token, personId } = await request.json();

    if (!userId || !token || !personId) {
      return NextResponse.json(
        { error: "Missing userId, token, or personId" },
        { status: 400 }
      );
    }

    const existing = await getUserPosts(userId);
    const posts = await fetchUserPosts(token, personId);

    let added = 0;
    for (const post of posts) {
      if (!post.text) continue;
      const alreadyExists = existing.some((e) => e.post_text === post.text);
      if (alreadyExists) continue;

      await saveUserPost({
        user_id: userId,
        post_text: post.text,
        post_date: post.created_at,
        likes: post.likes,
        comments: post.comments,
      });
      added++;
    }

    return NextResponse.json({ added, total: existing.length + added });
  } catch (error) {
    console.error("Scrape failed:", error);
    return NextResponse.json(
      { error: "Scraping failed" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForToken,
  fetchProfile,
  fetchUserPosts,
} from "@/lib/linkedin";
import { createUser, getUserByEmail, saveProfile, saveUserPost } from "@/lib/excel";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  if (error || !code) {
    const msg = request.nextUrl.searchParams.get("error_description") || "Auth failed";
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(msg)}`, request.url)
    );
  }

  try {
    const token = await exchangeCodeForToken(code);
    const profile = await fetchProfile(token);

    let user = await getUserByEmail(profile.email);
    if (!user) {
      user = await createUser(
        profile.name,
        profile.email,
        `https://www.linkedin.com/in/${profile.sub}`
      );
    }

    await saveProfile({
      user_id: user.id,
      headline: "",
      about: "",
      current_role: "",
      company: "Factorial",
      location: "",
      scraped_at: new Date().toISOString(),
    });

    const posts = await fetchUserPosts(token, profile.sub);
    for (const post of posts) {
      if (post.text) {
        await saveUserPost({
          user_id: user.id,
          post_text: post.text,
          post_date: post.created_at,
          likes: post.likes,
          comments: post.comments,
        });
      }
    }

    const redirectUrl = new URL("/create", request.url);
    redirectUrl.searchParams.set("userId", user.id);
    redirectUrl.searchParams.set("userName", user.name);
    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error("OAuth callback failed:", err);
    return NextResponse.redirect(
      new URL("/login?error=Authentication+failed", request.url)
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createUser, getUserByEmail } from "@/lib/excel";

export async function POST(request: NextRequest) {
  try {
    const { name, email, linkedinUrl } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    let user = await getUserByEmail(email);

    if (!user) {
      user = await createUser(name, email, linkedinUrl ?? "");
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}

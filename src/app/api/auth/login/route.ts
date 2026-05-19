import { NextRequest, NextResponse } from "next/server";
import { createUser, getUserByEmail } from "@/lib/excel";

export async function POST(request: NextRequest) {
  try {
    const { name, email, linkedinUrl, department } = await request.json();

    if (!name || !email || !department) {
      return NextResponse.json(
        { error: "Name, email, and department are required" },
        { status: 400 }
      );
    }

    let user = await getUserByEmail(email);

    if (!user) {
      user = await createUser(name, email, linkedinUrl ?? "", department);
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

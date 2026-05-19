"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const stored = localStorage.getItem("userId");
    if (!stored) {
      router.replace("/login");
      return;
    }
    setUserName(localStorage.getItem("userName") ?? "");
  }, [router]);

  return (
    <div className="flex flex-1 justify-center px-6 py-10">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold text-zinc-900">Profile</h1>
        <p className="mt-2 text-zinc-500">
          {userName ? `Logged in as ${userName}` : "Loading..."}
        </p>
        <div className="mt-8 p-6 border border-dashed border-zinc-300 rounded-lg text-center text-zinc-400">
          LinkedIn profile data will appear here after scraping is implemented (Phase 4).
        </div>
      </div>
    </div>
  );
}

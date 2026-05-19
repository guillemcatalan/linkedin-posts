"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PostForm from "@/components/PostForm";
import PostResults from "@/components/PostResults";
import type { PostVariant } from "@/types";
import { Suspense } from "react";

function CreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [variants, setVariants] = useState<PostVariant[] | null>(null);

  useEffect(() => {
    const paramUserId = searchParams.get("userId");
    const paramUserName = searchParams.get("userName");

    if (paramUserId) {
      localStorage.setItem("userId", paramUserId);
      if (paramUserName) localStorage.setItem("userName", paramUserName);
      setUserId(paramUserId);
      window.history.replaceState({}, "", "/create");
      return;
    }

    const stored = localStorage.getItem("userId");
    if (!stored) {
      router.replace("/login");
      return;
    }
    setUserId(stored);
  }, [router, searchParams]);

  if (!userId) return null;

  return (
    <div className="flex flex-1 justify-center px-6 py-10">
      <div className="w-full max-w-2xl">
        {variants ? (
          <PostResults variants={variants} onStartOver={() => setVariants(null)} />
        ) : (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900">Create a post</h1>
              <p className="mt-1 text-zinc-500 text-sm">
                Tell us what happened and we&apos;ll generate 3 LinkedIn post variants.
              </p>
            </div>
            <PostForm userId={userId} onResults={setVariants} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense>
      <CreateContent />
    </Suspense>
  );
}

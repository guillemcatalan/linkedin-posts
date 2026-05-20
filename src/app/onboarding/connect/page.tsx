"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getLinkedInAuthUrl } from "@/lib/linkedin-oauth";
import OnboardingProgress from "@/components/OnboardingProgress";

export default function ConnectLinkedInPage() {
  return (
    <Suspense>
      <ConnectLinkedInContent />
    </Suspense>
  );
}

function ConnectLinkedInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/login");
        return;
      }
      setUserId(session.user.id);
    });

    if (searchParams.get("linkedin") === "connected") {
      setConnected(true);
    }
  }, [router, searchParams]);

  function handleConnect() {
    if (!userId) return;
    window.location.href = getLinkedInAuthUrl(userId);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <OnboardingProgress current={2} />

        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#0A66C2]/10 flex items-center justify-center mx-auto mb-5">
            <LinkedInIcon />
          </div>
          <h1 className="text-2xl font-semibold text-fg tracking-tight">
            Connect your LinkedIn
          </h1>
          <p className="mt-3 text-text-secondary text-sm leading-relaxed max-w-xs mx-auto">
            This lets us publish posts directly to your LinkedIn profile.
            You&apos;ll always review and approve before anything goes live.
          </p>
        </div>

        {connected ? (
          <div className="bg-green-400/10 border border-green-400/20 rounded-xl p-5 text-center mb-6">
            <p className="text-green-400 font-medium">
              LinkedIn connected successfully
            </p>
            <p className="text-sm text-text-secondary mt-1">
              We can now publish posts to your profile.
            </p>
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            <div className="bg-surface border border-border rounded-xl p-4 text-sm">
              <p className="font-medium text-fg mb-2">
                What permissions we request
              </p>
              <ul className="space-y-1.5 text-text-secondary text-xs">
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">-</span>
                  <span>
                    <strong className="text-fg">Sign In</strong> — verify your
                    identity
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">-</span>
                  <span>
                    <strong className="text-fg">Post on your behalf</strong> —
                    only when you click &quot;Publish&quot;
                  </span>
                </li>
              </ul>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {!connected && (
            <button
              onClick={handleConnect}
              disabled={!userId}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#0A66C2] text-white rounded-full font-medium hover:bg-[#004182] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <LinkedInIcon size={18} />
              Connect with LinkedIn
            </button>
          )}

          <button
            onClick={() => router.push("/onboarding/import")}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium transition-colors ${
              connected
                ? "bg-accent text-bg hover:bg-accent-hover"
                : "border border-border text-text-secondary hover:text-fg hover:border-text-secondary"
            }`}
          >
            {connected ? "Continue" : "Skip for now"}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function LinkedInIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="text-[#0A66C2]">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

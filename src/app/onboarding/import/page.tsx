"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Upload, CheckCircle, ArrowRight, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import OnboardingProgress from "@/components/OnboardingProgress";

export default function ImportDataPage() {
  return (
    <Suspense>
      <ImportDataContent />
    </Suspense>
  );
}

function ImportDataContent() {
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [entering, setEntering] = useState(false);
  const linkedinConnected = searchParams.get("linkedin") === "connected";

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUserId(session.user.id);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploading(true);
    setImportResult(null);

    try {
      const { processLinkedInZip, formatImportResult } = await import(
        "@/lib/linkedin-zip"
      );
      const result = await processLinkedInZip(file, userId, supabase);
      setImportResult(formatImportResult(result));
    } catch {
      setImportResult("Failed to process the ZIP file. Try again.");
    } finally {
      setUploading(false);
    }
  }

  function handleEnter() {
    setEntering(true);
    window.location.href =
      (process.env.NODE_ENV === "production" ? "/linkedin-posts" : "") + "/";
  }

  const isSuccess =
    importResult !== null &&
    !importResult.startsWith("Failed") &&
    !importResult.startsWith("No ");

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <OnboardingProgress current={3} />

        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-accent-muted flex items-center justify-center mx-auto mb-5">
            {isSuccess ? (
              <CheckCircle size={28} className="text-green-400" />
            ) : (
              <Upload size={28} className="text-accent" />
            )}
          </div>
          <h1 className="text-2xl font-semibold text-fg tracking-tight">
            Your writing style
          </h1>
          <p className="mt-3 text-text-secondary text-sm leading-relaxed max-w-xs mx-auto">
            Upload your LinkedIn data export so we can match your tone and
            writing patterns. This makes generated posts sound like{" "}
            <strong className="text-fg">you</strong>, not a template.
          </p>
        </div>

        {linkedinConnected && (
          <div className="flex items-center gap-2 bg-green-400/10 border border-green-400/20 rounded-xl px-4 py-3 mb-4">
            <CheckCircle size={16} className="text-green-400 shrink-0" />
            <p className="text-sm text-green-400">
              LinkedIn connected — we can publish directly to your profile.
            </p>
          </div>
        )}

        {!linkedinConnected && (
          <div className="flex items-start gap-2 bg-amber-400/10 border border-amber-400/20 rounded-xl px-4 py-3 mb-4">
            <p className="text-sm text-amber-400">
              Without LinkedIn connected, you&apos;ll copy-paste posts
              manually. You can connect anytime from your Profile.
            </p>
          </div>
        )}

        {importResult && (
          <div
            className={`flex items-start gap-2 rounded-xl px-4 py-3 mb-4 ${
              isSuccess
                ? "bg-green-400/10 border border-green-400/20"
                : "bg-red-400/10 border border-red-400/20"
            }`}
          >
            {isSuccess ? (
              <CheckCircle
                size={16}
                className="text-green-400 shrink-0 mt-0.5"
              />
            ) : (
              <AlertCircle
                size={16}
                className="text-red-400 shrink-0 mt-0.5"
              />
            )}
            <p
              className={`text-sm ${isSuccess ? "text-green-400" : "text-red-400"}`}
            >
              {importResult}
            </p>
          </div>
        )}

        {!isSuccess && (
          <>
            <div className="bg-surface border border-border rounded-xl p-4 text-sm mb-5">
              <p className="font-medium text-fg mb-2">How to get your data</p>
              <ol className="list-decimal list-inside space-y-1.5 text-xs text-text-secondary leading-relaxed">
                <li>
                  Open{" "}
                  <a
                    href="https://www.linkedin.com/mypreferences/d/download-my-data"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    linkedin.com/mypreferences/d/download-my-data
                  </a>
                </li>
                <li>
                  Request your data (either the basic or larger archive works)
                </li>
                <li>
                  Download the .zip when LinkedIn emails you (can take minutes to
                  72h)
                </li>
                <li>Upload the .zip here or later from your Profile</li>
              </ol>
            </div>

            <label className="flex flex-col items-center justify-center w-full h-20 border border-dashed border-border rounded-xl cursor-pointer hover:border-text-secondary transition-colors mb-4">
              {uploading ? (
                <div className="flex items-center gap-2 text-text-secondary">
                  <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Processing...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Upload size={16} />
                  <span className="text-sm">Upload LinkedIn ZIP</span>
                </div>
              )}
              <input
                type="file"
                accept=".zip,application/zip,application/x-zip-compressed"
                onChange={handleUpload}
                disabled={uploading || !userId}
                className="hidden"
              />
            </label>

            <p className="text-xs text-text-secondary text-center mb-5">
              Don&apos;t have the file yet? No problem — you can upload it later
              from your Profile.
            </p>
          </>
        )}

        <button
          onClick={handleEnter}
          disabled={entering}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-accent text-bg rounded-full font-medium hover:bg-accent-hover disabled:opacity-70 transition-colors"
        >
          {entering ? (
            <>
              <div className="w-4 h-4 border-2 border-bg border-t-transparent rounded-full animate-spin" />
              Loading...
            </>
          ) : (
            <>
              Enter the app
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

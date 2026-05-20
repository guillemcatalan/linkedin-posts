"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Upload, CheckCircle, ArrowRight } from "lucide-react";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const linkedinConnected = searchParams.get("linkedin") === "connected";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/login");
        return;
      }
      setUserId(session.user.id);
    });
  }, [router]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploading(true);
    setImportResult(null);

    try {
      const JSZip = (await import("jszip")).default;
      const buffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(buffer);

      let postsCount = 0;
      const sharesFile =
        zip.file("Shares.csv") ??
        Object.values(zip.files).find(
          (f) => !f.dir && f.name.toLowerCase().endsWith("shares.csv")
        );

      if (sharesFile) {
        const content = await sharesFile.async("text");
        const rows = parseCSV(content);
        const inserts = rows
          .map((row) => {
            const text =
              row["ShareCommentary"] || row["shareCommentary"] || "";
            if (!text.trim()) return null;
            const date =
              row["Date"] || row["SharedDate"] || row["date"] || "";
            return {
              user_id: userId,
              post_text: text,
              post_date: date || null,
            };
          })
          .filter(
            (
              r
            ): r is {
              user_id: string;
              post_text: string;
              post_date: string | null;
            } => r !== null
          );

        if (inserts.length > 0) {
          await supabase.from("user_posts").insert(inserts);
          postsCount = inserts.length;
        }
      }

      setImportResult(
        postsCount > 0
          ? `Imported ${postsCount} posts. Your writing style will be used to personalize future posts.`
          : "No posts found in the ZIP. Make sure you uploaded the LinkedIn data export."
      );
    } catch {
      setImportResult("Failed to process the ZIP file. Try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <OnboardingProgress current={3} />

        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-accent-muted flex items-center justify-center mx-auto mb-5">
            <Upload size={28} className="text-accent" />
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
              Select{" "}
              <strong className="text-fg">
                &quot;Download larger data archive&quot;
              </strong>
            </li>
            <li>
              Click{" "}
              <strong className="text-fg">&quot;Request archive&quot;</strong>{" "}
              — LinkedIn will email you when it&apos;s ready (can take 24-72h)
            </li>
            <li>Come back and upload the .zip here or in your Profile</li>
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
            accept=".zip"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>

        {importResult && (
          <p
            className={`text-sm px-4 py-2 rounded-lg text-center mb-4 ${
              importResult.startsWith("Failed") ||
              importResult.startsWith("No posts")
                ? "text-red-400 bg-red-400/10"
                : "text-green-400 bg-green-400/10"
            }`}
          >
            {importResult}
          </p>
        )}

        <p className="text-xs text-text-secondary text-center mb-5">
          Don&apos;t have the file yet? No problem — you can upload it later
          from your Profile.
        </p>

        <button
          onClick={() => router.push("/")}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-accent text-bg rounded-full font-medium hover:bg-accent-hover transition-colors"
        >
          Enter the app
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split("\n");
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = (values[idx] || "").trim();
    });
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
}

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Upload } from "lucide-react";

const DEPARTMENTS = [
  "Partners",
  "Sales",
  "Engineering",
  "Product",
  "Marketing",
  "People / HR",
  "Finance / Operations",
  "Customer Success",
  "Other",
];

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [name, setName] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [department, setDepartment] = useState("");
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setLinkedinUrl(user.linkedin_url);
      setDepartment(user.department);
    }
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    await supabase
      .from("users")
      .update({ name, linkedin_url: linkedinUrl, department })
      .eq("id", user.id);

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
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
              user_id: user.id,
              post_text: text,
              post_date: date || null,
            };
          })
          .filter(
            (r): r is { user_id: string; post_text: string; post_date: string | null } =>
              r !== null
          );

        if (inserts.length > 0) {
          await supabase.from("user_posts").insert(inserts);
          postsCount = inserts.length;
        }
      }

      setImportResult(`Imported ${postsCount} posts.`);
    } catch {
      setImportResult("Failed to process ZIP file.");
    } finally {
      setUploading(false);
    }
  }

  if (!user) return null;

  const inputClass =
    "w-full px-4 py-3 bg-surface border border-border rounded-lg text-fg placeholder:text-[#555] focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-colors";

  return (
    <div className="max-w-xl mx-auto px-6 py-10">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-fg tracking-tight">
          Profile
        </h1>
        <p className="mt-1 text-sm text-text-secondary">{user.email}</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4 mb-10">
        <div>
          <label className="block text-sm font-medium text-fg mb-1.5">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-fg mb-1.5">
            LinkedIn URL
          </label>
          <input
            type="text"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            placeholder="linkedin.com/in/your-name"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-fg mb-1.5">
            Department
          </label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className={inputClass}
          >
            <option value="" disabled>
              Select department
            </option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="px-6 py-2.5 bg-accent text-bg rounded-full font-medium hover:bg-accent-hover transition-colors text-sm"
        >
          {saved ? "Saved!" : "Save changes"}
        </button>
      </form>

      <div className="border-t border-border pt-8 space-y-5">
        <div>
          <h2 className="text-lg font-medium text-fg">Your writing style</h2>
          <p className="mt-1 text-sm text-text-secondary leading-relaxed">
            Upload your LinkedIn data export so the system can learn how you
            write. Posts will feel more authentic and match your personal style.
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            Optional — without it, posts follow Factorial&apos;s general
            guidelines.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 text-sm text-text-secondary space-y-2">
          <p className="font-medium text-fg text-sm">How to get your data</p>
          <ol className="list-decimal list-inside space-y-1 text-xs leading-relaxed">
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
              <strong className="text-fg">&quot;Request archive&quot;</strong> —
              you&apos;ll get an email when ready
            </li>
            <li>Upload the .zip below (don&apos;t unzip it)</li>
          </ol>
        </div>

        <label className="flex flex-col items-center justify-center w-full h-24 border border-dashed border-border rounded-xl cursor-pointer hover:border-text-secondary transition-colors">
          {uploading ? (
            <p className="text-sm text-text-secondary">Processing...</p>
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
            className={`text-sm px-4 py-2 rounded-lg text-center ${
              importResult.startsWith("Failed")
                ? "text-red-400 bg-red-400/10"
                : "text-green-400 bg-green-400/10"
            }`}
          >
            {importResult}
          </p>
        )}
      </div>

      <div className="border-t border-border pt-8 mt-8">
        <button
          onClick={signOut}
          className="text-sm text-text-secondary hover:text-fg transition-colors"
        >
          Log out
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

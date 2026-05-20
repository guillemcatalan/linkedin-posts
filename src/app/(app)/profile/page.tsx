"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { DEPARTMENTS, ROLES_BY_DEPARTMENT } from "@/lib/departments";
import type { Department } from "@/lib/departments";
import { Upload, CheckCircle } from "lucide-react";
import { getLinkedInAuthUrl } from "@/lib/linkedin-oauth";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [department, setDepartment] = useState<Department | "">("");
  const [role, setRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [linkedinConnected, setLinkedinConnected] = useState(false);

  const roles = department ? ROLES_BY_DEPARTMENT[department] : [];
  const isOtherDept = department === "Other";
  const isCustomRole = isOtherDept || (role === "__other");

  useEffect(() => {
    if (user) {
      setName(user.name);
      setNickname(user.nickname);
      setLinkedinUrl(user.linkedin_url);
      setDepartment((user.department as Department) || "");
      setRoleDescription(user.role_description);

      if (user.department && user.department !== "Other") {
        const deptRoles = ROLES_BY_DEPARTMENT[user.department as Department] ?? [];
        if (deptRoles.includes(user.role)) {
          setRole(user.role);
        } else if (user.role) {
          setRole("__other");
          setCustomRole(user.role);
        }
      } else if (user.role) {
        setCustomRole(user.role);
      }

      supabase
        .from("linkedin_tokens")
        .select("user_id")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data) setLinkedinConnected(true);
        });
    }
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const finalRole = isCustomRole ? customRole : role;

    await supabase
      .from("users")
      .update({
        name,
        nickname,
        linkedin_url: linkedinUrl,
        department,
        role: finalRole,
        role_description: roleDescription,
      })
      .eq("id", user.id);

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleConnectLinkedIn() {
    if (!user) return;
    window.location.href = getLinkedInAuthUrl(user.id);
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
            Full name
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
            Nickname
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="How people call you"
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
            onChange={(e) => {
              setDepartment(e.target.value as Department);
              setRole("");
              setCustomRole("");
            }}
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

        {department && !isOtherDept && roles.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-fg mb-1.5">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={inputClass}
            >
              <option value="" disabled>
                Select role
              </option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
              <option value="__other">Other (type below)</option>
            </select>
          </div>
        )}

        {isCustomRole && (
          <div>
            <label className="block text-sm font-medium text-fg mb-1.5">
              Role title
            </label>
            <input
              type="text"
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              placeholder="Your role title"
              className={inputClass}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-fg mb-1.5">
            What you do day-to-day
          </label>
          <textarea
            value={roleDescription}
            onChange={(e) => setRoleDescription(e.target.value)}
            placeholder="Describe your daily work — this helps generate posts that sound like you"
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 bg-accent text-bg rounded-full font-medium hover:bg-accent-hover transition-colors text-sm"
        >
          {saved ? "Saved!" : "Save changes"}
        </button>
      </form>

      {/* LinkedIn connection */}
      <div className="border-t border-border pt-8 mb-8">
        <h2 className="text-lg font-medium text-fg mb-2">LinkedIn connection</h2>
        {linkedinConnected ? (
          <div className="flex items-center gap-2 bg-green-400/10 border border-green-400/20 rounded-xl px-4 py-3">
            <CheckCircle size={16} className="text-green-400 shrink-0" />
            <p className="text-sm text-green-400">
              LinkedIn connected — we can publish directly to your profile.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">
              Connect your LinkedIn account to publish posts directly from the
              app.
            </p>
            <button
              onClick={handleConnectLinkedIn}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0A66C2] text-white rounded-full text-sm font-medium hover:bg-[#004182] transition-colors"
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              Connect with LinkedIn
            </button>
          </div>
        )}
      </div>

      {/* Writing style / ZIP */}
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

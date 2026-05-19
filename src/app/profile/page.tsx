"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [importError, setImportError] = useState("");
  const [postsImported, setPostsImported] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("userId");
    if (!id) {
      router.replace("/login");
      return;
    }
    setUserId(id);
    setUserName(localStorage.getItem("userName") ?? "");

    fetch(`/api/user/posts-count?userId=${id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data && data.count > 0) setPostsImported(true);
      })
      .catch(() => {});
  }, [router]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setImportError("");
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", userId);

      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      setImportResult(
        `Imported ${data.posts} posts and ${data.comments} comments.`
      );
      setPostsImported(true);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleLogout() {
    localStorage.clear();
    router.replace("/login");
  }

  return (
    <div className="flex flex-1 justify-center px-6 py-10">
      <div className="w-full max-w-2xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Profile</h1>
          <p className="mt-1 text-zinc-500 text-sm">
            {userName ? `Logged in as ${userName}` : "Loading..."}
          </p>
        </div>

        <div className="border border-zinc-200 rounded-lg p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-zinc-900">
              Your writing style
            </h2>
            {postsImported && (
              <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium">
                Data imported
              </span>
            )}
          </div>

          <p className="text-sm text-zinc-600 leading-relaxed">
            Upload your LinkedIn data export so the system can learn how you
            write — your tone, structure, and the topics you care about. Posts
            generated for you will feel more authentic and match your personal
            style.
          </p>
          <p className="text-sm text-zinc-400">
            This is completely optional. Without it, posts will follow
            Factorial&apos;s general guidelines.
          </p>

          <div className="bg-zinc-50 rounded-lg p-4 text-sm text-zinc-600 space-y-3">
            <p className="font-medium text-zinc-900">
              How to get your LinkedIn data
            </p>
            <div className="space-y-2">
              <div className="flex gap-2">
                <span className="text-zinc-400 font-medium">1.</span>
                <span>
                  Open{" "}
                  <a
                    href="https://www.linkedin.com/mypreferences/d/download-my-data"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    linkedin.com/mypreferences/d/download-my-data
                  </a>
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-zinc-400 font-medium">2.</span>
                <span>
                  Select <strong>&quot;Download larger data archive&quot;</strong>
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-zinc-400 font-medium">3.</span>
                <span>
                  Click <strong>&quot;Request archive&quot;</strong> — LinkedIn
                  will email you a .zip when it&apos;s ready (10 min to a few
                  hours)
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-zinc-400 font-medium">4.</span>
                <span>Upload the .zip file below (don&apos;t unzip it)</span>
              </div>
            </div>
          </div>

          <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-zinc-300 rounded-lg cursor-pointer hover:border-zinc-400 transition-colors">
            <div className="flex flex-col items-center">
              {uploading ? (
                <p className="text-sm text-zinc-500">Processing...</p>
              ) : (
                <>
                  <p className="text-sm text-zinc-600 font-medium">
                    Click to upload your LinkedIn ZIP
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    .zip file from LinkedIn data export
                  </p>
                </>
              )}
            </div>
            <input
              type="file"
              accept=".zip"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>

          {importError && (
            <p className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg text-center">
              {importError}
            </p>
          )}

          {importResult && (
            <p className="text-green-700 text-sm bg-green-50 px-4 py-2 rounded-lg text-center">
              {importResult}
            </p>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          Log out
        </button>
      </div>
    </div>
  );
}

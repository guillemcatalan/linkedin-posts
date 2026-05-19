"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ConnectPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("userId");
    if (!id) {
      router.replace("/login");
      return;
    }
    setUserId(id);
    setUserName(localStorage.getItem("userName") ?? "");
  }, [router]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    setResult(null);

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
      setResult(`Imported ${data.posts} posts and ${data.comments} comments from your LinkedIn data.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <div className="flex flex-col items-center gap-8 w-full max-w-lg">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-zinc-900">
            Hey {userName} — import your LinkedIn data
          </h1>
          <p className="mt-2 text-zinc-500">
            Upload your LinkedIn data export so we can learn your writing style.
          </p>
        </div>

        <div className="w-full p-5 bg-zinc-50 rounded-lg text-sm text-zinc-600 space-y-4">
          <p className="font-medium text-zinc-900 text-base">How to download your LinkedIn data (2 min)</p>

          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-zinc-900 text-white rounded-full flex items-center justify-center text-xs font-medium">1</span>
              <div>
                <p>Open this link:</p>
                <a
                  href="https://www.linkedin.com/mypreferences/d/download-my-data"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-medium break-all"
                >
                  linkedin.com/mypreferences/d/download-my-data
                </a>
                <p className="text-zinc-400 text-xs mt-0.5">(opens LinkedIn in a new tab)</p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-zinc-900 text-white rounded-full flex items-center justify-center text-xs font-medium">2</span>
              <div>
                <p>You&apos;ll see two options. Select <strong>&quot;Want something in particular?&quot;</strong></p>
                <p className="text-zinc-400 text-xs mt-0.5">Don&apos;t select &quot;Download larger data archive&quot; — that takes hours and includes stuff we don&apos;t need</p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-zinc-900 text-white rounded-full flex items-center justify-center text-xs font-medium">3</span>
              <div>
                <p>Check the boxes for <strong>&quot;Posts&quot;</strong> and <strong>&quot;Comments&quot;</strong></p>
                <p className="text-zinc-400 text-xs mt-0.5">You can select others too, but we only use Posts and Comments</p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-zinc-900 text-white rounded-full flex items-center justify-center text-xs font-medium">4</span>
              <div>
                <p>Click <strong>&quot;Request archive&quot;</strong></p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-zinc-900 text-white rounded-full flex items-center justify-center text-xs font-medium">5</span>
              <div>
                <p>LinkedIn will send you an <strong>email</strong> when it&apos;s ready (usually 10-30 minutes)</p>
                <p className="text-zinc-400 text-xs mt-0.5">Check your inbox for &quot;Your LinkedIn data archive is ready&quot;</p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-zinc-900 text-white rounded-full flex items-center justify-center text-xs font-medium">6</span>
              <div>
                <p>Download the <strong>.zip file</strong> from the email and upload it below</p>
                <p className="text-zinc-400 text-xs mt-0.5">Don&apos;t unzip it — upload the .zip file directly</p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-300 rounded-lg cursor-pointer hover:border-zinc-400 transition-colors">
            <div className="flex flex-col items-center">
              {uploading ? (
                <p className="text-sm text-zinc-500">Processing...</p>
              ) : (
                <>
                  <p className="text-sm text-zinc-600 font-medium">
                    Click to upload your LinkedIn ZIP
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">.zip file from LinkedIn data export</p>
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
        </div>

        {error && (
          <p className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg w-full text-center">
            {error}
          </p>
        )}

        {result && (
          <div className="w-full text-center space-y-4">
            <p className="text-green-700 text-sm bg-green-50 px-4 py-2 rounded-lg">
              {result}
            </p>
            <button
              onClick={() => router.push("/create")}
              className="px-6 py-3 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 transition-colors"
            >
              Start creating posts
            </button>
          </div>
        )}

        <button
          onClick={() => router.push("/create")}
          className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

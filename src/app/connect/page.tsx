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

        <div className="w-full p-5 bg-zinc-50 rounded-lg text-sm text-zinc-600 space-y-3">
          <p className="font-medium text-zinc-900">How to download your LinkedIn data:</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Go to LinkedIn &gt; Settings &gt; Data Privacy</li>
            <li>Click <strong>&quot;Get a copy of your data&quot;</strong></li>
            <li>Select <strong>&quot;Want something in particular?&quot;</strong></li>
            <li>Check <strong>&quot;Posts&quot;</strong> and <strong>&quot;Comments&quot;</strong></li>
            <li>Click <strong>&quot;Request archive&quot;</strong></li>
            <li>Wait for the email (usually 10-30 min), download the ZIP</li>
            <li>Upload it here</li>
          </ol>
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

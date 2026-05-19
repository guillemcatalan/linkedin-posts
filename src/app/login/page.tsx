"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          linkedinUrl: linkedinUrl.startsWith("http") ? linkedinUrl : `https://${linkedinUrl}`,
          department,
        }),
      });

      if (!res.ok) throw new Error("Login failed");

      const { user } = await res.json();
      localStorage.setItem("userId", user.id);
      localStorage.setItem("userName", user.name);
      router.push("/connect");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <div className="flex flex-col items-center gap-8 w-full max-w-md">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-zinc-900">
            Factorial Post Generator
          </h1>
          <p className="mt-2 text-zinc-500">
            Generate authentic LinkedIn posts. Tell us about you first.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="px-4 py-3 border border-zinc-300 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="px-4 py-3 border border-zinc-300 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
          <input
            type="text"
            placeholder="LinkedIn profile URL (e.g. linkedin.com/in/your-name)"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            required
            className="px-4 py-3 border border-zinc-300 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            required
            className="px-4 py-3 border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
          >
            <option value="" disabled>Select your department</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Loading..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}

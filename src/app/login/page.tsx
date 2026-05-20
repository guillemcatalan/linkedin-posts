"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { DEPARTMENTS, ROLES_BY_DEPARTMENT } from "@/lib/departments";
import type { Department } from "@/lib/departments";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [department, setDepartment] = useState<Department | "">("");
  const [role, setRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const roles = department ? ROLES_BY_DEPARTMENT[department] : [];
  const isOtherDept = department === "Other";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "signup") {
        if (!email.endsWith("@factorial.co")) {
          throw new Error("Only @factorial.co emails are allowed.");
        }

        let finalLinkedinUrl = linkedinUrl.trim();
        if (
          finalLinkedinUrl &&
          !finalLinkedinUrl.startsWith("http://") &&
          !finalLinkedinUrl.startsWith("https://")
        ) {
          finalLinkedinUrl = `https://${finalLinkedinUrl}`;
        }

        const finalRole = isOtherDept ? customRole : role;

        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              nickname,
              linkedin_url: finalLinkedinUrl,
              department,
              role: finalRole,
              role_description: roleDescription,
            },
          },
        });

        if (signUpError) throw signUpError;

        router.push("/onboarding/connect");
      } else {
        if (!email.endsWith("@factorial.co")) {
          throw new Error("Only @factorial.co emails are allowed.");
        }

        const { error: signInError } =
          await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        router.push("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full px-4 py-3 glass rounded-lg text-fg placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all duration-150 ease-out";

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-glow-violet">
      <div className="flex flex-col items-center gap-8 w-full max-w-sm">
        <div className="text-center">
          <h1 className="text-3xl font-display font-bold text-fg tracking-tight">
            <span className="gradient-text">Factorial Posts</span>
          </h1>
          <p className="mt-3 text-text-secondary text-sm">
            {mode === "signin"
              ? "Sign in to create and publish LinkedIn posts."
              : "Create your account to get started."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
          {mode === "signup" && (
            <>
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={inputClass}
              />
              <input
                type="text"
                placeholder="Nickname (how people call you)"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                className={inputClass}
              />
            </>
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className={inputClass}
          />

          {mode === "signup" && (
            <>
              <input
                type="text"
                placeholder="LinkedIn profile URL"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                required
                className={inputClass}
              />

              <select
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value as Department);
                  setRole("");
                  setCustomRole("");
                }}
                required
                className={`${inputClass} ${!department ? "text-zinc-600" : ""}`}
              >
                <option value="" disabled>
                  Department
                </option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              {department && !isOtherDept && roles.length > 0 && (
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                  className={`${inputClass} ${!role ? "text-zinc-600" : ""}`}
                >
                  <option value="" disabled>
                    Your role
                  </option>
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                  <option value="__other">Other (type below)</option>
                </select>
              )}

              {(isOtherDept || role === "__other") && (
                <input
                  type="text"
                  placeholder="Your role title"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  required
                  className={inputClass}
                />
              )}

              <textarea
                placeholder="Describe what you do day-to-day (this helps us write posts that sound like you)"
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                required
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </>
          )}

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-accent text-white rounded-full font-medium hover:bg-accent-hover hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 ease-out mt-1"
          >
            {loading
              ? "Loading..."
              : mode === "signin"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError("");
          }}
          className="text-sm text-text-secondary hover:text-accent-secondary transition-colors duration-150 ease-out"
        >
          {mode === "signin"
            ? "Don't have an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}

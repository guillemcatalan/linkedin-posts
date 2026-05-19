"use client";

import { useRouter } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import type { User } from "@/types";

export default function LoginPage() {
  const router = useRouter();

  function handleLogin(user: User) {
    localStorage.setItem("userId", user.id);
    localStorage.setItem("userName", user.name);
    router.push("/create");
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <div className="flex flex-col items-center gap-8 w-full max-w-md">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-zinc-900">
            Factorial Post Generator
          </h1>
          <p className="mt-2 text-zinc-500">
            Generate authentic LinkedIn posts for the partners team.
          </p>
        </div>
        <LoginForm onLogin={handleLogin} />
      </div>
    </div>
  );
}

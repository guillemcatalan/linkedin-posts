"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const pathname = usePathname();

  const links = [
    { href: "/create", label: "Create" },
    { href: "/profile", label: "Profile" },
  ];

  return (
    <nav className="border-b border-zinc-200 bg-white">
      <div className="max-w-3xl mx-auto px-6 flex items-center justify-between h-14">
        <Link href="/" className="font-semibold text-zinc-900">
          Factorial Post Generator
        </Link>
        <div className="flex gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors ${
                pathname === link.href
                  ? "text-zinc-900 font-medium"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

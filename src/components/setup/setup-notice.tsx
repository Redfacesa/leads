"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { getSetupMessage, isSupabaseConfigured } from "@/lib/env";

export function SetupNotice() {
  const message = getSetupMessage();
  if (!message) return null;

  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
      <p className="font-medium">Setup required</p>
      <p className="mt-1 text-amber-100/90">{message}</p>
      <p className="mt-2 text-amber-100/70">
        See <code className="text-amber-50">env/production.env.example</code> in the repo.
      </p>
    </div>
  );
}

export function SetupGate({ children }: { children: ReactNode }) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="max-w-lg space-y-4">
          <h1 className="text-2xl font-bold text-white">RedFace Connect admin</h1>
          <SetupNotice />
          <Link href="/" className="inline-block text-sm text-[#dc2626] hover:underline">
            Back to public site
          </Link>
        </div>
      </div>
    );
  }

  return children;
}

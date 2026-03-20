"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

export function AdminUnlockCard() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <main className="page-width">
      <div className="surface-card p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-moss-50 p-3 text-moss-700">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <p className="section-label">Admin access</p>
            <h1 className="mt-1 text-2xl text-slate-900">Unlock the admin area</h1>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-600">
          This MVP uses a simple environment-based admin code. Enter the configured code to manage words and imports.
        </p>

        <form
          className="mt-5 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            setError("");

            startTransition(async () => {
              const response = await fetch("/api/admin/session", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({ code })
              });

              if (!response.ok) {
                const payload = (await response.json().catch(() => null)) as { error?: string } | null;
                setError(payload?.error ?? "Unable to unlock admin access.");
                return;
              }

              router.refresh();
            });
          }}
        >
          <label className="block">
            <span className="section-label">Access code</span>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="app-input mt-2"
              type="password"
              placeholder="Enter admin code"
            />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button type="submit" className="tap-button-primary w-full" disabled={isPending}>
            {isPending ? "Unlocking..." : "Unlock admin"}
          </button>
        </form>
      </div>
    </main>
  );
}

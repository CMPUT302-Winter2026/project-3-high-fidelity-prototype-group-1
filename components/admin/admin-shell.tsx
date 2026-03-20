"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { ADMIN_NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type AdminShellProps = {
  children: React.ReactNode;
  isProtected: boolean;
};

export function AdminShell({ children, isProtected }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-12 pt-6">
      <header className="surface-card mb-5 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="section-label">Admin area</p>
            <h1 className="mt-2 text-3xl text-slate-900">Vocabulary Explorer CMS</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Enter, edit, organize, and import vocabulary records for the learner and expert views.
            </p>
          </div>
          {isProtected ? (
            <button
              type="button"
              onClick={async () => {
                await fetch("/api/admin/session", { method: "DELETE" });
                router.push("/admin");
                router.refresh();
              }}
              className="tap-button-secondary"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Lock admin
            </button>
          ) : null}
        </div>
        <nav className="mt-5 flex flex-wrap gap-2">
          {ADMIN_NAV_ITEMS.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "tap-button text-sm",
                  active ? "bg-moss-700 text-white" : "border border-slate-200 bg-white text-slate-600"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      {children}
    </main>
  );
}

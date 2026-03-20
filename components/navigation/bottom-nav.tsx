"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Home, Search, Settings } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function BottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  const isActiveRoute = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href));
  const activeIndex = navItems.findIndex((item) => isActiveRoute(item.href));

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4"
      style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <div className="pointer-events-auto relative mx-auto grid w-full max-w-md grid-cols-4 rounded-full border border-white/80 bg-white/75 p-2 shadow-card backdrop-blur-xl">
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute left-2 top-2 flex h-11 items-center justify-center transition-[transform,opacity] duration-300 ease-out",
            activeIndex === -1 ? "opacity-0" : "opacity-100"
          )}
          style={{
            width: "calc((100% - 1rem) / 4)",
            transform: `translateX(${Math.max(activeIndex, 0) * 100}%)`
          }}
        >
          <span className="h-11 w-11 rounded-full bg-moss-700 shadow-card" />
        </span>
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const active = index === activeIndex;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative z-10 flex min-h-[4.5rem] min-w-16 flex-col items-center justify-center gap-1 px-2 py-1.5 text-[0.72rem] font-medium transition"
              )}
            >
              <span
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-300",
                  active ? "text-white" : "text-slate-500 group-hover:text-moss-700"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span
                className={cn(
                  "transition-colors duration-300",
                  active ? "text-moss-900" : "text-slate-500 group-hover:text-moss-800"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

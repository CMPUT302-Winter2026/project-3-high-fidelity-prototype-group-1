import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { cn } from "@/lib/utils";

type PageFrameProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function PageFrame({ title, subtitle, backHref, actions, children, className }: PageFrameProps) {
  return (
    <main className={cn("page-width relative", className)}>
      <header className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          {backHref ? (
            <Link
              href={backHref}
              className="mb-3 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/85 px-3 py-1.5 text-sm font-medium text-slate-600"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Link>
          ) : (
            <p className="section-label mb-2">ALTLab prototype</p>
          )}
          <h1 className="text-3xl leading-tight text-slate-900">{title}</h1>
          {subtitle ? <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </header>
      {children}
    </main>
  );
}

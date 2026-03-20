import Link from "next/link";

import { PageFrame } from "@/components/navigation/page-frame";

export default function NotFound() {
  return (
    <PageFrame title="Not found" subtitle="That vocabulary entry or page could not be found." backHref="/">
      <div className="surface-card p-5">
        <p className="text-sm text-slate-600">
          Try searching again or head back to the home screen to explore a category.
        </p>
        <div className="mt-4">
          <Link className="tap-button-primary w-full" href="/">
            Return home
          </Link>
        </div>
      </div>
    </PageFrame>
  );
}

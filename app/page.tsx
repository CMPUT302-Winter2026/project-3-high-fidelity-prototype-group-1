import Link from "next/link";
import { Bookmark, Settings } from "lucide-react";

import { CategoryGrid } from "@/components/home/category-grid";
import { PageFrame } from "@/components/navigation/page-frame";
import { SearchBar } from "@/components/search/search-bar";
import { getHomePageData } from "@/lib/queries";
import type { HomeCategoryModel } from "@/types/view-models";

export default async function HomePage() {
  const data = await getHomePageData();

  return (
    <PageFrame
      title="Vocabulary Explorer"
      subtitle="Explore Plains Cree vocabulary by theme, relation, and learner level."
      actions={
        <>
          <Link href="/saved" className="tap-button-secondary px-3" aria-label="Saved words">
            <Bookmark className="h-4 w-4" />
          </Link>
          <Link href="/settings" className="tap-button-secondary px-3" aria-label="Settings">
            <Settings className="h-4 w-4" />
          </Link>
        </>
      }
    >
      <section className="surface-card p-5">
        <p className="section-label">Search</p>
        <h2 className="mt-2 text-2xl text-slate-900">Start with a Cree or English word</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Search by lemma, gloss, or partial match to jump straight into a word detail card.
        </p>
        <div className="mt-4">
          <SearchBar />
        </div>
      </section>

      <section className="mt-4">
        <CategoryGrid categories={data.categories as HomeCategoryModel[]} randomWordSlug={data.randomWordSlug} />
      </section>

      <section className="surface-card mt-4 p-5">
        <p className="section-label">Prototype note</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This MVP uses demo seed content shaped for replacement with verified ALTLab lexical data later.
        </p>
      </section>
    </PageFrame>
  );
}

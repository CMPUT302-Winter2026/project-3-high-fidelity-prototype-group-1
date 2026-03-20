"use client";

import Link from "next/link";

import { useAppState } from "@/components/providers/app-providers";
import { cn } from "@/lib/utils";
import type { WordCardModel } from "@/types/view-models";

type WordCardProps = {
  word: WordCardModel;
  href?: string;
  compact?: boolean;
};

export function WordCard({ word, href, compact = false }: WordCardProps) {
  const { preferences } = useAppState();
  const creeFirst = preferences.uiLanguageEmphasis === "cree";

  return (
    <Link
      href={href ?? `/word/${word.slug}`}
      className={cn(
        "surface-card block transition hover:-translate-y-0.5",
        compact ? "p-4" : "p-4"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {creeFirst ? (
            <>
              <h2 className="text-xl leading-tight text-slate-900">{word.lemma}</h2>
              {preferences.showSyllabics && word.syllabics ? (
                <p className="mt-1 text-sm text-slate-500">{word.syllabics}</p>
              ) : null}
              <p className="mt-3 text-sm font-medium text-slate-700">{word.plainEnglish}</p>
            </>
          ) : (
            <>
              <p className="text-base font-semibold text-slate-900">{word.plainEnglish}</p>
              <h2 className="mt-3 text-xl leading-tight text-slate-800">{word.lemma}</h2>
              {preferences.showSyllabics && word.syllabics ? (
                <p className="mt-1 text-sm text-slate-500">{word.syllabics}</p>
              ) : null}
            </>
          )}
        </div>
        <span className="chip shrink-0">{word.partOfSpeech}</span>
      </div>
      {word.categories?.length ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {word.categories.slice(0, 3).map((entry) => (
            <span key={entry.category.id} className="chip">
              {entry.category.name}
            </span>
          ))}
        </div>
      ) : null}
    </Link>
  );
}

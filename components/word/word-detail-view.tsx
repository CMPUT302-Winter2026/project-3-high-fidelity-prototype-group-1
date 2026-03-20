"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Languages, Sparkles } from "lucide-react";

import { SaveWordButton } from "@/components/word/save-word-button";
import { PlayWordButton } from "@/components/word/play-word-button";
import { useAppState } from "@/components/providers/app-providers";
import { RELATION_TYPE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { DetailMode } from "@/types";
import type { WordDetailModel } from "@/types/view-models";

const DETAIL_MODE_KEY = "altlab-vocabulary-explorer-detail-mode";

type WordDetailViewProps = {
  word: WordDetailModel;
};

export function WordDetailView({ word }: WordDetailViewProps) {
  const { preferences } = useAppState();
  const [mode, setMode] = useState<DetailMode>("novice");

  useEffect(() => {
    const saved = window.localStorage.getItem(DETAIL_MODE_KEY);
    if (saved === "novice" || saved === "expert") {
      setMode(saved);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(DETAIL_MODE_KEY, mode);
  }, [mode]);

  const creeFirst = preferences.uiLanguageEmphasis === "cree";
  const primaryExplanation =
    mode === "novice"
      ? word.beginnerExplanation ?? "A learner-friendly explanation has not been added yet."
      : word.expertExplanation ?? word.beginnerExplanation ?? "An expert explanation has not been added yet.";

  return (
    <div className="space-y-4">
      <section className="surface-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {creeFirst ? (
              <>
                <h2 className="text-3xl leading-tight text-slate-900">{word.lemma}</h2>
                {preferences.showSyllabics && word.syllabics ? (
                  <p className="mt-2 text-sm text-slate-500">{word.syllabics}</p>
                ) : null}
                <p className="mt-4 text-base font-medium text-slate-700">{word.plainEnglish}</p>
              </>
            ) : (
              <>
                <p className="text-lg font-semibold text-slate-900">{word.plainEnglish}</p>
                <h2 className="mt-4 text-3xl leading-tight text-slate-800">{word.lemma}</h2>
                {preferences.showSyllabics && word.syllabics ? (
                  <p className="mt-2 text-sm text-slate-500">{word.syllabics}</p>
                ) : null}
              </>
            )}
          </div>
          <span className="chip">{word.partOfSpeech}</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <SaveWordButton
            word={{
              id: word.id,
              slug: word.slug,
              lemma: word.lemma,
              syllabics: word.syllabics,
              plainEnglish: word.plainEnglish,
              partOfSpeech: word.partOfSpeech
            }}
          />
          <PlayWordButton
            lemma={word.lemma}
            spokenText={word.pronunciation ?? word.lemma}
            audioUrl={word.audioUrl}
          />
          <Link href={`/word/${word.slug}/map`} className="tap-button-secondary">
            <Sparkles className="mr-2 h-4 w-4" />
            Open map
          </Link>
        </div>

        <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50/80 p-3">
          <div className="mb-3 flex items-center gap-2">
            <Languages className="h-4 w-4 text-moss-700" />
            <p className="text-sm font-semibold text-slate-800">Novice / Expert mode</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(["novice", "expert"] as DetailMode[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMode(option)}
                className={cn(
                  "tap-button text-sm",
                  mode === option ? "bg-moss-700 text-white" : "bg-white text-slate-600"
                )}
              >
                {option === "novice" ? "Novice" : "Expert"}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="surface-card p-5">
        <p className="section-label">{mode === "novice" ? "Beginner explanation" : "Expert explanation"}</p>
        <p className="mt-3 text-sm leading-7 text-slate-700">{primaryExplanation}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {word.categories.map((entry) => (
            <Link key={entry.category.id} href={`/category/${entry.category.slug}`} className="chip">
              {entry.category.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="surface-card p-5">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-moss-700" />
          <p className="text-base font-semibold text-slate-900">
            {mode === "novice" ? "Meanings and related ideas" : "Meanings, relations, and analysis"}
          </p>
        </div>

        <div className="mt-4 space-y-3">
          {word.meanings.map((meaning) => (
            <div key={meaning.id} className="surface-muted p-3">
              <p className="font-semibold text-slate-900">{meaning.gloss}</p>
              {meaning.description ? <p className="mt-1 text-sm text-slate-600">{meaning.description}</p> : null}
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          {word.relatedSections.map((section) => (
            <div key={section.relationType}>
              <p className="text-sm font-semibold text-slate-900">
                {RELATION_TYPE_LABELS[section.relationType]}
              </p>
              <div className="mt-2 space-y-2">
                {section.items.map((item) => (
                  <Link
                    key={`${item.relationType}-${item.word.id}`}
                    href={`/word/${item.word.slug}`}
                    className="surface-muted flex items-center justify-between gap-3 p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{item.word.lemma}</p>
                      <p className="mt-1 text-sm text-slate-600">{item.word.plainEnglish}</p>
                      {item.label ? <p className="mt-1 text-xs text-slate-500">{item.label}</p> : null}
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {mode === "expert" ? (
        <>
          <section className="surface-card p-5">
            <p className="section-label">Technical details</p>
            <dl className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-700">
              <div className="surface-muted p-3">
                <dt className="font-semibold text-slate-900">Part of speech</dt>
                <dd className="mt-1">{word.partOfSpeech}</dd>
              </div>
              {word.linguisticClass ? (
                <div className="surface-muted p-3">
                  <dt className="font-semibold text-slate-900">Linguistic classification</dt>
                  <dd className="mt-1">{word.linguisticClass}</dd>
                </div>
              ) : null}
              {word.rootStem ? (
                <div className="surface-muted p-3">
                  <dt className="font-semibold text-slate-900">Root or stem</dt>
                  <dd className="mt-1">{word.rootStem}</dd>
                </div>
              ) : null}
              {word.pronunciation ? (
                <div className="surface-muted p-3">
                  <dt className="font-semibold text-slate-900">Pronunciation</dt>
                  <dd className="mt-1">{word.pronunciation}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          {word.morphologyTables.length ? (
            <section className="space-y-4">
              {word.morphologyTables.map((table) => (
                <div key={table.id} className="surface-card overflow-hidden">
                  <div className="border-b border-slate-200/80 px-5 py-4">
                    <p className="section-label">{table.isPlainEnglish ? "Learner table" : "Expert table"}</p>
                    <h3 className="mt-2 text-xl text-slate-900">{table.title}</h3>
                    {table.description ? <p className="mt-2 text-sm text-slate-600">{table.description}</p> : null}
                  </div>
                  <div className="overflow-x-auto px-5 py-4">
                    <table className="min-w-full text-left text-sm text-slate-700">
                      <tbody>
                        {table.entries.map((entry) => (
                          <tr key={entry.id} className="border-b border-slate-100 last:border-b-0">
                            <th className="py-3 pr-4 align-top font-semibold text-slate-900">
                              {entry.rowLabel}
                            </th>
                            <td className="py-3 pr-4 align-top text-slate-500">
                              {entry.columnLabel ?? entry.plainLabel ?? "-"}
                            </td>
                            <td className="py-3 align-top">{entry.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </section>
          ) : null}

          {(word.source || word.notes) ? (
            <section className="surface-card p-5">
              <p className="section-label">Source and notes</p>
              {word.source ? <p className="mt-3 text-sm leading-7 text-slate-700">{word.source}</p> : null}
              {word.notes ? <p className="mt-3 text-sm leading-7 text-slate-600">{word.notes}</p> : null}
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

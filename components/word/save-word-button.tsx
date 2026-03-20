"use client";

import { Bookmark } from "lucide-react";

import { useAppState } from "@/components/providers/app-providers";

type SaveWordButtonProps = {
  word: {
    id: string;
    slug: string;
    lemma: string;
    syllabics?: string | null;
    plainEnglish: string;
    partOfSpeech: string;
  };
};

export function SaveWordButton({ word }: SaveWordButtonProps) {
  const { isWordSaved, toggleSavedWord } = useAppState();
  const saved = isWordSaved(word.id);

  return (
    <button
      type="button"
      onClick={() =>
        toggleSavedWord({
          id: word.id,
          slug: word.slug,
          lemma: word.lemma,
          syllabics: word.syllabics,
          plainEnglish: word.plainEnglish,
          partOfSpeech: word.partOfSpeech
        })
      }
      className={saved ? "tap-button-primary" : "tap-button-secondary"}
    >
      <Bookmark className={`mr-2 h-4 w-4 ${saved ? "fill-current" : ""}`} />
      {saved ? "Saved" : "Save word"}
    </button>
  );
}

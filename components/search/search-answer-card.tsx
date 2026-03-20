import Link from "next/link";
import { AlertCircle, Sparkles } from "lucide-react";

import type { SearchQuestionAnswerState } from "@/lib/search-service";
import type { WordCardModel } from "@/types/view-models";

type SearchAnswerCardProps = {
  answer: SearchQuestionAnswerState;
  matchedWords: WordCardModel[];
};

export function SearchAnswerCard({ answer, matchedWords }: SearchAnswerCardProps) {
  const isAnswered = answer.status === "answered";

  return (
    <section
      className={`rounded-3xl border p-5 ${
        isAnswered ? "border-moss-200 bg-moss-50/80" : "border-amber-200 bg-amber-50/80"
      }`}
    >
      <div className="flex items-start gap-3">
        {isAnswered ? (
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-moss-700" />
        ) : (
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        )}
        <div className="min-w-0 flex-1">
          <p className="section-label">{isAnswered ? "AI answer" : "Question help"}</p>
          <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-700">
            {isAnswered ? answer.answer : answer.message}
          </p>

          {matchedWords.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {matchedWords.map((word) => (
                <Link key={word.id} href={`/word/${word.slug}`} className="chip">
                  {word.lemma}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

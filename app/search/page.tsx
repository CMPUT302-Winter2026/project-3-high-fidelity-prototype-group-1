import Link from "next/link";

import { PageFrame } from "@/components/navigation/page-frame";
import { SearchAnswerCard } from "@/components/search/search-answer-card";
import { ItwewinaSearchFallback } from "@/components/search/itwewina-search-fallback";
import { SearchBar } from "@/components/search/search-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { WordCard } from "@/components/ui/word-card";
import { getSearchExperience } from "@/lib/search-service";
import type { WordCardModel } from "@/types/view-models";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export const runtime = "nodejs";

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const searchExperience = await getSearchExperience(q);
  const results = searchExperience.results;
  const answeredQuestion =
    searchExperience.questionAnswer?.status === "answered" ? searchExperience.questionAnswer : null;
  const matchedWords = answeredQuestion
    ? results.filter((word) => answeredQuestion.matchedWordIds.includes(word.id))
    : [];

  return (
    <PageFrame
      title="Search"
      subtitle="Find words by Cree lemma, syllabics, English gloss, or ask grounded questions about a word."
      backHref="/"
    >
      <div className="space-y-4">
        <SearchBar initialQuery={q} />

        {!q.trim() ? (
          <EmptyState
            title="Try a search"
            description='Search for a Cree word like miskîsik, an English gloss like eye, or ask a question like "What is the grammatical form of pêmowâhkan?"'
          />
        ) : (
          <>
            {searchExperience.questionAnswer ? (
              <SearchAnswerCard answer={searchExperience.questionAnswer} matchedWords={matchedWords as WordCardModel[]} />
            ) : null}

            {results.length === 0 ? (
              <EmptyState
                title={searchExperience.mode === "question" ? "No local word context yet" : "No local matches yet"}
                description={
                  searchExperience.mode === "question"
                    ? "Try another spelling, or let the app import the word it found in your question so GPT can answer from the saved entry."
                    : "Try another spelling, or let the app check Itwewina and save matching words to the database."
                }
                action={
                  <div className="space-y-3">
                    {searchExperience.lookupTerm ? <ItwewinaSearchFallback query={searchExperience.lookupTerm} /> : null}
                    <Link href="/" className="tap-button-primary inline-flex">
                      Browse categories
                    </Link>
                  </div>
                }
              />
            ) : (
              <div className="space-y-3">
                {results.map((word) => (
                  <WordCard key={word.id} word={word as WordCardModel} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </PageFrame>
  );
}

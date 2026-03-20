import { notFound } from "next/navigation";

import { PageFrame } from "@/components/navigation/page-frame";
import { WordDetailView } from "@/components/word/word-detail-view";
import { getWordBySlug } from "@/lib/queries";
import type { WordDetailModel } from "@/types/view-models";

type WordPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function WordPage({ params }: WordPageProps) {
  const { slug } = await params;
  const word = await getWordBySlug(slug);

  if (!word) {
    notFound();
  }

  return (
    <PageFrame title="Word detail" subtitle="Switch between learner-friendly and expert views." backHref="/">
      <WordDetailView word={word as WordDetailModel} />
    </PageFrame>
  );
}

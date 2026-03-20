import { notFound } from "next/navigation";

import { WordEditorForm } from "@/components/admin/word-editor-form";
import { getWordEditorData } from "@/lib/queries";

type EditWordPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditWordPage({ params }: EditWordPageProps) {
  const { id } = await params;
  const data = await getWordEditorData(id);

  if (!data.initialPayload.id) {
    notFound();
  }

  return (
    <WordEditorForm
      mode="edit"
      initialPayload={data.initialPayload}
      categories={data.categories}
      wordOptions={data.wordOptions}
    />
  );
}

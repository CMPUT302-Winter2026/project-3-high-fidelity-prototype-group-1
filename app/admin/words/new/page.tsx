import { WordEditorForm } from "@/components/admin/word-editor-form";
import { getWordEditorData } from "@/lib/queries";

export default async function NewWordPage() {
  const data = await getWordEditorData();

  return (
    <WordEditorForm
      mode="create"
      initialPayload={data.initialPayload}
      categories={data.categories}
      wordOptions={data.wordOptions}
    />
  );
}

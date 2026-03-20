"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

type WordDeleteButtonProps = {
  wordId: string;
  lemma: string;
};

export function WordDeleteButton({ wordId, lemma }: WordDeleteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      className="tap-button-secondary"
      disabled={isPending}
      onClick={() => {
        if (!window.confirm(`Delete "${lemma}"? This cannot be undone.`)) {
          return;
        }

        startTransition(async () => {
          await fetch(`/api/admin/words/${wordId}`, {
            method: "DELETE"
          });
          router.refresh();
        });
      }}
    >
      <Trash2 className="mr-2 h-4 w-4" />
      Delete
    </button>
  );
}

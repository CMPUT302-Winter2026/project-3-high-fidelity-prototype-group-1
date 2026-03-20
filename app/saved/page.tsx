import { PageFrame } from "@/components/navigation/page-frame";
import { SavedWordsPanel } from "@/components/saved/saved-words-panel";

export default function SavedPage() {
  return (
    <PageFrame title="Saved words" subtitle="Your bookmarks live locally on this device." backHref="/">
      <SavedWordsPanel />
    </PageFrame>
  );
}

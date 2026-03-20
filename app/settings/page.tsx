import { PageFrame } from "@/components/navigation/page-frame";
import { SettingsPanel } from "@/components/settings/settings-panel";

export default function SettingsPage() {
  return (
    <PageFrame
      title="Settings"
      subtitle="Adjust reading comfort, Cree/English emphasis, and local device preferences."
      backHref="/"
    >
      <SettingsPanel />
    </PageFrame>
  );
}

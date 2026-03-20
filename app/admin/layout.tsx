import { AdminShell } from "@/components/admin/admin-shell";
import { AdminUnlockCard } from "@/components/admin/admin-unlock-card";
import { hasAdminAccess, isAdminProtected } from "@/lib/admin";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const accessGranted = await hasAdminAccess();

  if (!accessGranted) {
    return <AdminUnlockCard />;
  }

  return <AdminShell isProtected={isAdminProtected()}>{children}</AdminShell>;
}

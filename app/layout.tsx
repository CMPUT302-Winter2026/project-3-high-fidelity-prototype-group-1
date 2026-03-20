import type { Metadata } from "next";

import { BottomNav } from "@/components/navigation/bottom-nav";
import { AppProviders } from "@/components/providers/app-providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "Vocabulary Explorer",
  description:
    "A mobile-first Plains Cree vocabulary explorer prototype for the University of Alberta Language Technology Lab."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -left-12 top-0 h-40 w-40 rounded-full bg-moss-100/80 blur-3xl" />
          <div className="absolute right-0 top-24 h-48 w-48 rounded-full bg-clay-100/80 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-56 w-56 rounded-full bg-lake-100/60 blur-3xl" />
        </div>
        <AppProviders>
          {children}
          <BottomNav />
        </AppProviders>
      </body>
    </html>
  );
}

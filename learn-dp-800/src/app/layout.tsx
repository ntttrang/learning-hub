import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { ThemeApplier, ThemeScript } from "@/components/Theme";
import { asset } from "@/lib/asset";

export const metadata: Metadata = {
  title: "DP-800 Study Hub — Captain Corgi",
  description:
    "An interactive learning platform for Microsoft DP-800: SQL AI Developer Associate. Curriculum, cross-database comparisons, hands-on labs, quizzes, and mock exams.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning spellCheck={false} translate="no">
      <head>
        <ThemeScript />
        <link rel="icon" href={asset("/brand/icons/star.svg")} />
      </head>
      <body className="cc-body">
        <ThemeApplier />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

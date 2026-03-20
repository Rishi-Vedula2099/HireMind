import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HireMind AI — Neural Interview Engine",
  description:
    "An intelligent AI interview simulator that adapts to your resume, target company, and role. Train like a FAANG candidate. Hire-level feedback on every answer.",
  keywords: ["AI interview", "mock interview", "FAANG prep", "resume-aware", "technical interview"],
  openGraph: {
    title: "HireMind AI — Neural Interview Engine",
    description: "AI mock interviews personalized to your resume and target company.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${outfit.variable} ${jetbrainsMono.variable}`}>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "rgba(6,13,26,0.95)",
                border: "1px solid rgba(0,212,255,0.25)",
                color: "#e8f4ff",
                borderRadius: "8px",
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "0.82rem",
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}

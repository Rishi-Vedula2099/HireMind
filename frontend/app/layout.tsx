import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Montserrat, Libre_Baskerville, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const libreBaskerville = Libre_Baskerville({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HireMind AI — Kyoto Zen Interview Engine",
  description:
    "An intelligent AI interview simulator that adapts to your resume, target company, and role. Train with focus and calm. Zen-level feedback on every answer.",
  keywords: ["AI interview", "mock interview", "Zen prep", "resume-aware", "technical interview"],
  openGraph: {
    title: "HireMind AI — Kyoto Zen Interview Engine",
    description: "AI mock interviews personalized to your resume with a focused, calm aesthetic.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${montserrat.variable} ${libreBaskerville.variable} ${jetbrainsMono.variable} antialiased`}>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#E9E7E2",
                border: "1px solid rgba(45, 52, 54, 0.2)",
                color: "#2D3436",
                borderRadius: "0px",
                fontFamily: "Montserrat, sans-serif",
                fontSize: "0.82rem",
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}

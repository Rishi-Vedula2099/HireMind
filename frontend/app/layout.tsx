import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "HireMind AI — AI Mock Interviews Powered by Your Resume",
  description:
    "Practice real interviews personalized to your resume, job description, and target company. Adaptive AI questioning that thinks like Google, Amazon, and Microsoft interviewers.",
  keywords: ["mock interview", "AI interview", "technical interview prep", "resume-based interview", "FAANG prep"],
  openGraph: {
    title: "HireMind AI",
    description: "AI-powered mock interviews that adapt to your resume and target company.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} font-sans antialiased bg-gray-950 text-white`}>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#1e293b",
                border: "1px solid rgba(99,102,241,0.3)",
                color: "#f8fafc",
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}

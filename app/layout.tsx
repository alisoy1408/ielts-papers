import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://ielts-papers.com"),
  title: {
    default: "ielts-papers.com — Free IELTS Reading Practice Tests",
    template: "%s | ielts-papers.com",
  },
  description: "Free original IELTS Academic Reading practice tests with computer-based exam format. Timed tests, instant scoring, band score estimates.",
  keywords: ["IELTS", "IELTS Reading", "IELTS practice", "IELTS Academic", "free IELTS test"],
  openGraph: {
    title: "ielts-papers.com — Free IELTS Reading Practice",
    description: "Original IELTS Academic Reading tests with real exam format.",
    url: "https://ielts-papers.com",
    siteName: "ielts-papers.com",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Space_Grotesk, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const headingFont = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
});

const bodyFont = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shepherd Learning",
  description:
    "Short OSHA training videos with knowledge checks after each lesson.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${headingFont.variable} ${bodyFont.variable} antialiased`}
      >
        <header className="sticky top-0 z-30 w-full border-b border-black/10 bg-[#fff7ea]/90 backdrop-blur">
          <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
            <a
              href="/"
              className="text-sm font-semibold uppercase tracking-[0.3em] text-black/70"
            >
              Shepherd Learning
            </a>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}

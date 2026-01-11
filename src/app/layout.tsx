import type { Metadata } from "next";
import { Space_Grotesk, Source_Sans_3 } from "next/font/google";
import AuthGate from "@/components/AuthGate";
import { LanguageProvider } from "@/components/LanguageContext";
import Navbar from "@/components/Navbar";
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
        <LanguageProvider>
          <Navbar />
          <AuthGate>{children}</AuthGate>
        </LanguageProvider>
      </body>
    </html>
  );
}

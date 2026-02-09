import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Personality Analyzer",
  description: "Discover which AI model your GitHub repository resembles",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

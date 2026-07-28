import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "The Night Canopy",
  description: "A late-night ambient space for quiet reflection and grounding.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased dark`}>
      <body className="h-full w-full bg-[#0B0D12] text-gray-300 antialiased select-none font-sans overflow-hidden">
        {children}
      </body>
    </html>
  );
}

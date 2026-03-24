import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SimSolar Interactive Solar System Animation",
  description: "Interactive visual guide to the solar system with adjustable perspective and animation.",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white overflow-hidden">{children}</body>
    </html>
  );
}

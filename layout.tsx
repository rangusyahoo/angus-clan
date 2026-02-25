import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Angus Clan Survivor Fantasy League",
  description: "Survivor 50 Fantasy League",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
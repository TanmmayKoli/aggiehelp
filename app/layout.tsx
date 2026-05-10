import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AggieHelp",
  description: "Verified student mutual aid for small, safe assists.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

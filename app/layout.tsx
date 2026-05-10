import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CampusKind MVP",
  description: "Campus mutual aid platform prototype",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Track My Studying",
    template: "%s | Track My Studying",
  },
  description: "Track study sessions, review trends, and build a steadier study routine.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-50">
        {children}
      </body>
    </html>
  );
}

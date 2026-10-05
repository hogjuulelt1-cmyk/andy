import type { Metadata, Viewport } from "next";
import ko from "../../messages/ko.json";
import "./globals.css";

export const metadata: Metadata = {
  title: ko.app.name,
  description: ko.app.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="min-h-dvh bg-white text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-50">
        {children}
      </body>
    </html>
  );
}

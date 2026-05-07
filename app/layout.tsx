import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Syair - Pencarian Hadits Semantik",
  description: "Jelajahi koleksi Hadits dengan teknologi pencarian semantic dan AI-powered. Frontend pencarian hadits yang terintegrasi dengan backend FastAPI dan OpenSearch.",
  keywords: ["hadits", "islam", "pencarian", "semantic", "AI", "machine learning"],
  authors: [{ name: "Syair Team" }],
  openGraph: {
    title: "Syair - Pencarian Hadits Semantik",
    description: "Jelajahi koleksi Hadits dengan teknologi pencarian semantic dan AI-powered",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className="h-full antialiased scroll-smooth"
      suppressHydrationWarning
    >
      <head>
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className="min-h-full bg-background dark:bg-zinc-950 text-foreground dark:text-white transition-colors duration-300">
        {children}
        <Toaster />
      </body>
    </html>
  );
}

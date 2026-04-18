import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Syair Hadits Search",
  description: "Frontend pencarian hadits yang terintegrasi dengan backend FastAPI dan OpenSearch.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full bg-slate-950 text-slate-50">
        {children}
        <Toaster />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/app/context/ThemeContext";
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
        (function() {
          try {
            var theme = localStorage.getItem('theme') || 'system';
            var isDark = theme === 'dark' || 
              (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
            var root = document.documentElement;
            root.classList.remove('light', 'dark');
            if (isDark) {
              root.classList.add('dark');
            } else {
              root.classList.add('light');
            }
          } catch(e) {}
        })();
      `,
          }}
        />
      </head>
      <body className="min-h-full bg-background text-foreground transition-colors duration-300">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

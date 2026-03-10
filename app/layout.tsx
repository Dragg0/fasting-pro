import { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fallow | Metabolic Mastery",
  description: "The Metabolic Mastery Engine. Optimize your fasting, refeed with precision, and gamify your discipline.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    title: "Fallow | Metabolic Mastery",
    description: "The Metabolic Mastery Engine. Optimize your fasting, refeed with precision, and gamify your discipline.",
    url: "https://fallowfast.vercel.app",
    siteName: "Fallow",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fallow | Metabolic Mastery",
    description: "The Metabolic Mastery Engine. Optimize your fasting, refeed with precision, and gamify your discipline.",
    images: ["/icon.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#05070b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-background text-foreground min-h-screen font-sans selection:bg-cyan-500/30 overflow-x-hidden antialiased">
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.13),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(192,132,252,0.08),transparent_25%)]" />
        <main className="relative z-10 max-w-[1400px] mx-auto p-6 md:p-8">
          {children}
        </main>
        {/* Tooltip portal root — always on top of everything */}
        <div id="tooltip-root" style={{ position: 'fixed', inset: 0, zIndex: 2147483647, pointerEvents: 'none' }} />
      </body>
    </html>
  );
}

import { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fallow - Metabolic Renewal & Discipline",
  description: "Let your body recover its fertility. A high-IQ approach to fasting and willpower.",
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
      <body className="bg-[#05070b] text-[#f4f7fb] min-h-screen font-sans selection:bg-cyan-500/30 overflow-x-hidden antialiased">
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.13),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(192,132,252,0.08),transparent_25%)]" />
        <main className="relative z-10 max-w-[1400px] mx-auto p-6 md:p-8">
          {children}
        </main>
      </body>
    </html>
  );
}

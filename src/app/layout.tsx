import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import AdminNavigation from "@/components/AdminNavigation";
import Navigation from "@/components/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CertifDiag",
  description: "Révisez le diagnostic immobilier et entraînez-vous.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white`}
      >
        <Providers>
          <Navigation />
          <AdminNavigation />
          <main className="max-w-6xl mx-auto px-4 py-8">
            {children}
          </main>
        </Providers>
        <footer className="border-t border-black/[.08] dark:border-white/[.145] text-sm text-center py-6">
          <div className="max-w-6xl mx-auto px-4">
            <p>Tous droits réservés — CertifDiag</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

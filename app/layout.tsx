import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trouver Mon Chantier | Plateforme de Gestion de Projets Construction",
  description: "Trouver Mon Chantier - Plateforme dédiée aux clients pour suivre leurs projets de construction et rénovation. Accédez à votre espace personnel, consultez l'avancement de vos chantiers et communiquez avec votre équipe.",
  keywords: "trouver mon chantier, construction, rénovation, suivi chantier, gestion projets, bâtiment, travaux",
  authors: [{ name: "Trouver Mon Chantier" }],
  openGraph: {
    title: "Trouver Mon Chantier | Plateforme de Gestion de Projets Construction",
    description: "Suivez vos projets de construction et rénovation en temps réel avec Trouver Mon Chantier.",
    type: "website",
    locale: "fr_FR",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}

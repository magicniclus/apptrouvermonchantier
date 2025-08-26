import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Création de Compte - Trouver Mon Chantier | Inscription Client',
  description: 'Créez votre compte client Trouver Mon Chantier pour accéder à votre espace personnel et suivre vos projets de construction et rénovation.',
  keywords: 'création compte, inscription, client, trouver mon chantier, projets construction, rénovation',
  openGraph: {
    title: 'Création de Compte - Trouver Mon Chantier | Inscription Client',
    description: 'Créez votre compte pour accéder à votre espace personnel et suivre vos projets.',
    type: 'website',
  },
};

export default function CreationDeCompteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

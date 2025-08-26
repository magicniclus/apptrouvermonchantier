import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Paramètres - Trouver Mon Chantier | Configuration Compte',
  description: 'Gérez vos paramètres de compte Trouver Mon Chantier. Modifiez vos informations personnelles, préférences et paramètres de notification.',
  keywords: 'paramètres, configuration, compte client, profil, trouver mon chantier, informations personnelles',
  openGraph: {
    title: 'Paramètres - Trouver Mon Chantier | Configuration Compte',
    description: 'Gérez vos paramètres de compte et informations personnelles.',
    type: 'website',
  },
};

export default function ParametreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

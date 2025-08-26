import LoginPage from "@/components/LoginPage";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connexion - Trouver Mon Chantier | Espace Client',
  description: 'Connectez-vous à votre espace client Trouver Mon Chantier pour suivre vos projets de construction et rénovation. Accédez à votre tableau de bord personnalisé.',
  keywords: 'connexion, espace client, trouver mon chantier, projets construction, rénovation, tableau de bord',
  openGraph: {
    title: 'Connexion - Trouver Mon Chantier | Espace Client',
    description: 'Connectez-vous à votre espace client pour suivre vos projets de construction et rénovation.',
    type: 'website',
  },
};

export default function Home() {
  return <LoginPage />;
}

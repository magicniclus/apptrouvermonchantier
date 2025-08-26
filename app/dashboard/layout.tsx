import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard - Trouver Mon Chantier | Gestion de Projets',
  description: 'Tableau de bord client Trouver Mon Chantier. Suivez l\'avancement de vos projets de construction et rénovation, consultez les détails et communiquez avec votre équipe.',
  keywords: 'dashboard, tableau de bord, projets construction, suivi chantier, rénovation, gestion projets',
  openGraph: {
    title: 'Dashboard - Trouver Mon Chantier | Gestion de Projets',
    description: 'Suivez l\'avancement de vos projets de construction et rénovation en temps réel.',
    type: 'website',
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

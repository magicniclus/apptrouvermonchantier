"use client"

import { User, Shield, Building2, ArrowLeft, LogOut, Calculator } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/useAuth"
import { auth } from "@/lib/firebase"
import { signOut } from "firebase/auth"
import { useRouter } from "next/navigation"

interface SettingsSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function SettingsSidebar({ activeTab, onTabChange }: SettingsSidebarProps) {
  const { clientData } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push('/')
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    }
  }

  const settingsItems = [
    {
      id: 'profile',
      title: 'Profil',
      icon: User,
      isActive: activeTab === 'profile',
    },
    {
      id: 'company',
      title: 'Société',
      icon: Building2,
      isActive: activeTab === 'company',
    },
    {
      id: 'access',
      title: 'Accès et droits',
      icon: Shield,
      isActive: activeTab === 'access',
    },
    {
      id: 'compta',
      title: 'Comptabilité',
      icon: Calculator,
      isActive: activeTab === 'compta',
    }
  ]

  if (!clientData) return null

  return (
    <Sidebar className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border">
      <SidebarHeader>
        <div className="flex items-center gap-3 p-2">
          <img src="/favicon.png" alt="Logo" className="w-8 h-8" />
          <div className="flex flex-col">
            <span className="font-semibold text-sidebar-foreground">Trouver-Mon-Chantier</span>
            <span className="text-xs text-sidebar-foreground/70">
              {clientData.prenom} {clientData.nom}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => router.push('/dashboard')}>
                  <ArrowLeft />
                  <span>Retour</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Configuration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    isActive={item.isActive}
                    onClick={() => onTabChange(item.id)}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <LogOut />
              <span>Déconnexion</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

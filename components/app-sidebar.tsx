"use client"

import { Home, Globe, Settings, LogOut, ExternalLink, BookOpen, Receipt, ChevronDown, FileText, Users } from "lucide-react"
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/useAuth"
import { useProjects } from "@/hooks/useProjects"
import { auth } from "@/lib/firebase"
import { signOut } from "firebase/auth"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function AppSidebar() {
  const { clientData } = useAuth()
  const { projects } = useProjects(clientData?.id || null)
  const router = useRouter()
  const [isFacturationOpen, setIsFacturationOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push('/')
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    }
  }

  const navigationItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      isActive: true,
    },
    ...(clientData?.siteInternetClient ? [{
      title: "Mon site",
      url: clientData.siteInternetClient,
      icon: Globe,
      onClick: () => window.open(clientData.siteInternetClient, '_blank'),
      hasExternalIcon: true,
    }] : []),
  ]

  if (!clientData) return null

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-3 p-2">
          <img src="/favicon.png" alt="Logo" className="w-8 h-8" />
          <div className="flex flex-col">
            <span className="font-semibold text-sidebar-foreground">Dashboard</span>
            <span className="text-xs text-sidebar-foreground/70">
              {clientData.prenom} {clientData.nom}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild={!item.onClick}
                    isActive={item.isActive}
                    onClick={item.onClick}
                  >
                    {item.onClick ? (
                      <>
                        <item.icon />
                        <span>{item.title}</span>
                        {item.hasExternalIcon && <ExternalLink className="ml-auto h-4 w-4" />}
                      </>
                    ) : (
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => setIsFacturationOpen(!isFacturationOpen)}
                >
                  <BookOpen />
                  <span>Facturation</span>
                  <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${isFacturationOpen ? 'rotate-180' : ''}`} />
                </SidebarMenuButton>
                
                {isFacturationOpen && (
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild>
                        <a href="/registre">
                          <span>Registre</span>
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild>
                        <a href="/facturation/factures">
                          <span>Factures</span>
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild>
                        <a href="/facturation/devis">
                          <span>Devis</span>
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild>
                        <a href="/dashboard/clients">
                          <span>Clients</span>
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/dashboard/parametre">
                <Settings />
                <span>Paramètres</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
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

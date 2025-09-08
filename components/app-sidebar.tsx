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
import { useRouter, usePathname } from "next/navigation"
import { useState, useEffect } from "react"

export function AppSidebar() {
  const { clientData } = useAuth()
  const { projects } = useProjects(clientData?.id || null)
  const router = useRouter()
  const pathname = usePathname()
  
  // Auto-expand Facturation menu when on related pages
  const facturationPages = ["/dashboard/factures", "/dashboard/devis", "/dashboard/clients"]
  const shouldExpandFacturation = facturationPages.some(page => pathname === page)
  const [isFacturationOpen, setIsFacturationOpen] = useState(shouldExpandFacturation)
  
  // Update facturation menu state when pathname changes
  useEffect(() => {
    setIsFacturationOpen(shouldExpandFacturation)
  }, [shouldExpandFacturation])

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
      isActive: pathname === "/dashboard",
    },
    ...(clientData?.siteInternetClient ? [{
      title: "Mon site",
      url: clientData.siteInternetClient,
      icon: Globe,
      onClick: () => window.open(clientData.siteInternetClient, '_blank'),
      hasExternalIcon: true,
      isActive: false,
    }] : []),
  ]

  if (!clientData) return null

  return (
    <Sidebar>
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
                      <SidebarMenuSubButton 
                        isActive={pathname === "/dashboard/factures"}
                        onClick={() => router.push("/dashboard/factures")}
                      >
                        <span>Factures</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton 
                        isActive={pathname === "/dashboard/devis"}
                        onClick={() => router.push("/dashboard/devis")}
                      >
                        <span>Devis</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton 
                        isActive={pathname === "/dashboard/clients"}
                        onClick={() => router.push("/dashboard/clients")}
                      >
                        <span>Clients</span>
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
            <SidebarMenuButton 
              asChild 
              isActive={pathname === "/dashboard/parametre"}
              className="h-auto p-3"
            >
              <a href="/dashboard/parametre" className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white font-semibold text-sm shadow-md">
                  {clientData?.prenom?.charAt(0)?.toUpperCase()}{clientData?.nom?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex flex-col items-start min-w-0 flex-1">
                  <span className="font-medium text-sm truncate w-full">
                    {clientData?.prenom} {clientData?.nom}
                  </span>
                  <span className="text-xs text-sidebar-foreground/70 truncate w-full">
                    {clientData?.email}
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

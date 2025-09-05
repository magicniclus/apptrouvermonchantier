'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/hooks/useAuth'
import { auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { useState, useMemo, useEffect } from 'react'
import { useProjects } from '@/hooks/useProjects'
import ProjectCard from '@/components/ProjectCard'
import Loader, { PulseLoader } from '@/components/ui/loader'
import { HomeIcon, UserIcon, CogIcon, ChartBarIcon, ExclamationTriangleIcon, ArrowRightOnRectangleIcon, MagnifyingGlassIcon, CalendarIcon, TagIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import {
  SidebarTrigger,
} from '@/components/ui/sidebar'

interface Project {
  id: string
  nom: string
  prenom: string
  email: string
  telephone: string
  motif: string
  status: string
  dateCreation: unknown
  source?: string
  rgpd?: boolean
  uid?: string
}

export default function Dashboard() {
  const { user, clientData, loading: authLoading } = useAuth()
  const { projects, setProjects, loading: projectsLoading, error } = useProjects(clientData?.id || null)
  const router = useRouter()
  
  // États pour les filtres
  const [searchText, setSearchText] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [etapeFilter, setEtapeFilter] = useState('all')

  // Vérification d'authentification
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push('/')
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    }
  }

  // Filtrage des projets
  const filteredProjects = useMemo(() => {
    let filtered = [...projects]

    // Filtre par texte
    if (searchText.trim()) {
      const search = searchText.toLowerCase()
      filtered = filtered.filter(project => 
        project.motif?.toLowerCase().includes(search) ||
        project.nom?.toLowerCase().includes(search) ||
        project.prenom?.toLowerCase().includes(search) ||
        project.email?.toLowerCase().includes(search) ||
        project.status?.toLowerCase().includes(search)
      )
    }

    // Filtre par étape
    if (etapeFilter !== 'all') {
      filtered = filtered.filter(project => 
        project.status?.toLowerCase() === etapeFilter.toLowerCase()
      )
    }

    // Filtre par date
    if (dateFilter !== 'all') {
      const now = new Date()
      filtered = filtered.filter(project => {
        if (!project.dateCreation) return false
        const projectDate = (project.dateCreation as { toDate?: () => Date })?.toDate ? (project.dateCreation as { toDate: () => Date }).toDate() : new Date(project.dateCreation as string | number | Date)
        const diffTime = now.getTime() - projectDate.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        switch (dateFilter) {
          case 'today':
            return diffDays <= 1
          case 'week':
            return diffDays <= 7
          case 'month':
            return diffDays <= 30
          case 'older':
            return diffDays > 30
          default:
            return true
        }
      })
    }

    return filtered
  }, [projects, searchText, dateFilter, etapeFilter])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <PulseLoader text="Chargement du dashboard..." />
      </div>
    )
  }

  if (!user || !clientData) {
    return null
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Mes Projets
          </h1>
          {projectsLoading && (
            <div className="flex items-center gap-2">
              <Loader size="sm" />
              <span className="text-sm text-gray-500">Chargement...</span>
            </div>
          )}
        </div>
      </header>
      
      <div className="flex-1 overflow-auto p-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >

            <motion.div variants={itemVariants} className="mb-6">
          
          {/* Filtres */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex items-center gap-2 max-w-md">
              <MagnifyingGlassIcon className="w-4 h-4 text-gray-500" />
              <Input
                placeholder="Rechercher par nom, projet, email..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="flex items-center gap-2 min-w-[180px]">
              <TagIcon className="w-4 h-4 text-gray-500" />
              <Select value={etapeFilter} onValueChange={setEtapeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="nouveau">Nouveau</SelectItem>
                  <SelectItem value="A contacter">A contacter</SelectItem>
                  <SelectItem value="En cours">En cours</SelectItem>
                  <SelectItem value="En attente">En attente</SelectItem>
                  <SelectItem value="Terminé">Terminé</SelectItem>
                  <SelectItem value="Annulé">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2 min-w-[180px]">
              <CalendarIcon className="w-4 h-4 text-gray-500" />
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les dates</SelectItem>
                  <SelectItem value="today">Aujourd&apos;hui</SelectItem>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                  <SelectItem value="older">Plus ancien</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Compteur de résultats */}
          {searchText || dateFilter !== 'all' || etapeFilter !== 'all' ? (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {filteredProjects.length} projet{filteredProjects.length > 1 ? 's' : ''} trouvé{filteredProjects.length > 1 ? 's' : ''}
              {searchText && ` pour &quot;${searchText}&quot;`}
            </p>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {filteredProjects.length} projet{filteredProjects.length > 1 ? 's' : ''} trouvé{filteredProjects.length > 1 ? 's' : ''}
            </p>
          )}
        </motion.div>

        {error && (
          <motion.div variants={itemVariants} className="mb-6">
            <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
              <CardContent className="flex items-center gap-2 pt-6">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                <p className="text-red-700 dark:text-red-400">{error}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {!projectsLoading && filteredProjects.length === 0 && !error && (
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-12">
                <HomeIcon className="w-12 h-12 text-gray-400" />
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {searchText || dateFilter !== 'all' || etapeFilter !== 'all' ? 'Aucun projet trouvé' : 'Aucun projet'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchText || dateFilter !== 'all' || etapeFilter !== 'all'
                      ? 'Aucun projet ne correspond à vos critères de recherche.'
                      : 'Vous n&apos;avez pas encore de projets enregistrés.'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {!projectsLoading && filteredProjects.length > 0 && (
          <div className="space-y-4">
            {filteredProjects.map((project, index) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                index={index}
                clientId={clientData.id}
                onProjectUpdate={(updatedProject: Project) => {
                  setProjects((prev: Project[]) => prev.map((p: Project) => p.id === updatedProject.id ? updatedProject : p))
                }}
              />
            ))}
          </div>
        )}

          </motion.div>
        </div>
    </>
  )
}

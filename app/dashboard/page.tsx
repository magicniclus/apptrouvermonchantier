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

interface Project {
  id: string
  nom: string
  prenom: string
  email: string
  telephone: string
  projet: string
  etape: string
  date: unknown
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
        project.projet?.toLowerCase().includes(search) ||
        project.nom?.toLowerCase().includes(search) ||
        project.prenom?.toLowerCase().includes(search) ||
        project.email?.toLowerCase().includes(search) ||
        project.etape?.toLowerCase().includes(search)
      )
    }

    // Filtre par étape
    if (etapeFilter !== 'all') {
      filtered = filtered.filter(project => 
        project.etape?.toLowerCase() === etapeFilter.toLowerCase()
      )
    }

    // Filtre par date
    if (dateFilter !== 'all') {
      const now = new Date()
      filtered = filtered.filter(project => {
        if (!project.date) return false
        const projectDate = project.date.toDate ? project.date.toDate() : new Date(project.date)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto px-4 py-8"
      >
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/favicon.png" alt="Logo" className="w-10 h-10" />
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                  Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Bienvenue {clientData.prenom} {clientData.nom}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {clientData?.SiteInternetClient && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(clientData.SiteInternetClient, '_blank')}
                  className="flex items-center gap-2"
                >
                  <GlobeAltIcon className="w-4 h-4" />
                  Mon site
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/parametre')}
                className="flex items-center gap-2"
              >
                <CogIcon className="w-4 h-4" />
                Paramètres
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                Déconnexion
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <motion.div variants={itemVariants}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Projets totaux
                </CardTitle>
                <HomeIcon className="h-4 w-4 text-muted-foreground ml-auto" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projects.length}</div>
                <p className="text-xs text-muted-foreground">
                  {projects.filter(p => p.etape?.toLowerCase() === 'en cours').length} en cours
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Projets terminés
                </CardTitle>
                <ChartBarIcon className="h-4 w-4 text-muted-foreground ml-auto" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {projects.filter(p => p.etape?.toLowerCase() === 'terminé').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Projets finalisés
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Contact
                </CardTitle>
                <UserIcon className="h-4 w-4 text-muted-foreground ml-auto" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">{clientData.telephone}</div>
                <p className="text-xs text-muted-foreground truncate">
                  {clientData.email}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div variants={itemVariants} className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Mes Projets
            </h2>
            {projectsLoading && (
              <div className="flex items-center gap-2">
                <Loader size="sm" />
                <span className="text-sm text-gray-500">Chargement...</span>
              </div>
            )}
          </div>
          
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
                  <SelectItem value="all">Toutes les étapes</SelectItem>
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
  )
}

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import ProjectModal from './ProjectModal'
import {
  CalendarIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline'

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

interface ProjectCardProps {
  project: Project
  index: number
  clientId: string
  onProjectUpdate: (updatedProject: Project) => void
}

export default function ProjectCard({ project, index, clientId, onProjectUpdate }: ProjectCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const getEtapeColor = (etape: string) => {
    switch (etape?.toLowerCase()) {
      case 'a contacter':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      case 'en cours':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'en attente':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      case 'terminé':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'annulé':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const formatDate = (date: unknown) => {
    if (!date) return 'Date non définie'
    try {
      const dateObj = (date as { toDate?: () => Date })?.toDate ? (date as { toDate: () => Date }).toDate() : new Date(date as string | number | Date)
      return dateObj.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return 'Date invalide'
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: index * 0.1 }
    }
  }

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="w-full relative">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsModalOpen(true)
          }}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10"
        >
          <EllipsisHorizontalIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        
        <CardHeader className="pb-3 pr-16">
          <div className="space-y-3">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                {project.projet || 'Projet sans nom'}
              </CardTitle>
              <CardDescription className="mt-1">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4" />
                  {project.prenom} {project.nom}
                </div>
              </CardDescription>
            </div>
            <Badge className={getEtapeColor(project.etape)} style={{width: 'fit-content'}}>
              {project.etape || 'Non défini'}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <CalendarIcon className="w-4 h-4 flex-shrink-0" />
              <span>{formatDate(project.date)}</span>
            </div>
            
            {project.telephone && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <PhoneIcon className="w-4 h-4 flex-shrink-0" />
                <span>{project.telephone}</span>
              </div>
            )}
            
            {project.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <EnvelopeIcon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{project.email}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <ProjectModal
        project={project}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        clientId={clientId}
        onProjectUpdate={onProjectUpdate}
      />
    </motion.div>
  )
}

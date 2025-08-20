'use client'

import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface Project {
  id: string
  nom: string
  email: string
  etape: string
  prenom: string
  projet: string
  telephone: string
  date: any
  [key: string]: any
}

export function useProjects(clientId: string | null) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!clientId) {
      setLoading(false)
      return
    }

    const fetchProjects = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Récupérer les projets depuis clients/{clientId}/projets
        const projectsRef = collection(db, 'clients', clientId, 'projets')
        const querySnapshot = await getDocs(projectsRef)
        
        const projectsList: Project[] = []
        querySnapshot.forEach((doc) => {
          projectsList.push({
            id: doc.id,
            ...doc.data()
          } as Project)
        })
        
        // Trier par date (plus récent en premier)
        projectsList.sort((a, b) => {
          if (a.date && b.date) {
            return b.date.toDate() - a.date.toDate()
          }
          return 0
        })
        
        setProjects(projectsList)
      } catch (err) {
        console.error('Erreur lors de la récupération des projets:', err)
        setError('Impossible de charger les projets')
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [clientId])

  return { projects, setProjects, loading, error, refetch: () => {
    if (clientId) {
      const fetchProjects = async () => {
        try {
          const projectsRef = collection(db, 'clients', clientId, 'projets')
          const querySnapshot = await getDocs(projectsRef)
          const projectsList: Project[] = []
          querySnapshot.forEach((doc) => {
            projectsList.push({ id: doc.id, ...doc.data() } as Project)
          })
          projectsList.sort((a, b) => {
            if (a.date && b.date) return b.date.toDate() - a.date.toDate()
            return 0
          })
          setProjects(projectsList)
        } catch (err) {
          setError('Impossible de charger les projets')
        }
      }
      fetchProjects()
    }
  }}
}

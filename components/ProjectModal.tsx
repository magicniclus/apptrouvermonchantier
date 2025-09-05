'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { doc, updateDoc, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  CalendarIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  HomeIcon,
  ChatBubbleLeftIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline'

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
  commentaires?: Array<{
    id: string
    texte: string
    date: unknown
    auteur: string
  }>
}

interface ProjectModalProps {
  project: Project | null
  isOpen: boolean
  onClose: () => void
  clientId: string
  onProjectUpdate: (updatedProject: Project) => void
}

const statuses = [
  'nouveau',
  'A contacter',
  'En cours',
  'En attente',
  'Terminé',
  'Annulé'
]

const getStatusBadgeColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'nouveau':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
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

export default function ProjectModal({
  project,
  isOpen,
  onClose,
  clientId,
  onProjectUpdate,
}: ProjectModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedProject, setEditedProject] = useState<Project | null>(null)
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [comments, setComments] = useState<Array<{
    id: string
    texte: string
    date: unknown
    auteur: string
  }>>([])

  // Écouter les commentaires en temps réel
  useEffect(() => {
    if (!project || !isOpen) return

    const commentsRef = collection(db, 'clients', clientId, 'projets', project.id, 'commentaires')
    const q = query(commentsRef, orderBy('date', 'desc'))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Array<{
        id: string
        texte: string
        date: unknown
        auteur: string
      }>
      setComments(commentsData)
    })

    return () => unsubscribe()
  }, [project, clientId, isOpen])

  if (!project) return null

  const handleEdit = () => {
    setEditedProject({ ...project })
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setEditedProject(null)
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!editedProject) return

    setIsSaving(true)
    try {
      const projectRef = doc(db, 'clients', clientId, 'projets', project.id)
      await updateDoc(projectRef, {
        status: editedProject.status,
        email: editedProject.email,
      })

      const updatedProject = { ...project, ...editedProject }
      onProjectUpdate(updatedProject)
      setIsEditing(false)
      setEditedProject(null)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    setIsLoading(true)
    try {
      const commentsRef = collection(db, 'clients', clientId, 'projets', project.id, 'commentaires')
      await addDoc(commentsRef, {
        texte: newComment,
        date: serverTimestamp(),
        auteur: 'Client',
      })

      setNewComment('')
    } catch (error) {
      console.error('Erreur lors de l&apos;ajout du commentaire:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      const commentRef = doc(db, 'clients', clientId, 'projets', project.id, 'commentaires', commentId)
      await deleteDoc(commentRef)
    } catch (error) {
      console.error('Erreur lors de la suppression du commentaire:', error)
    }
  }

  const formatDate = (dateCreation: unknown) => {
    if (!dateCreation) return 'Date non définie'
    const dateObj = (dateCreation as { toDate?: () => Date })?.toDate ? (dateCreation as { toDate: () => Date }).toDate() : new Date(dateCreation as string | number | Date)
    return dateObj.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-none w-[95vw] max-h-[90vh] overflow-y-auto" style={{ width: '95vw', maxWidth: 'none' }}>
          <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <HomeIcon className="w-7 h-7" />
                Détails du projet <br/> {project.motif}
              </DialogTitle>
              <DialogDescription>
                Gérez les informations et l&apos;état de ce projet
              </DialogDescription>
            </div>
            <div className="flex items-center gap-3">
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <PencilIcon className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Informations du projet */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HomeIcon className="w-5 h-5" />
                Informations du projet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Toutes les informations en colonnes verticales */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <UserIcon className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Client</p>
                    <p className="text-sm text-gray-600">{project.prenom} {project.nom}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <PhoneIcon className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Téléphone</p>
                    <p className="text-sm text-gray-600">{project.telephone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Date de création</p>
                    <p className="text-sm text-gray-600">{formatDate(project.dateCreation)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <EnvelopeIcon className="w-5 h-5 text-gray-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Email</p>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={editedProject?.email || ''}
                        onChange={(e) => setEditedProject(prev => prev ? { ...prev, email: e.target.value } : null)}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm text-gray-600">{project.email}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <div className={`w-3 h-3 rounded-full ${getStatusBadgeColor(project.status).includes('purple') ? 'bg-purple-500' : 
                      getStatusBadgeColor(project.status).includes('blue') ? 'bg-blue-500' :
                      getStatusBadgeColor(project.status).includes('yellow') ? 'bg-yellow-500' :
                      getStatusBadgeColor(project.status).includes('orange') ? 'bg-orange-500' :
                      getStatusBadgeColor(project.status).includes('green') ? 'bg-green-500' :
                      getStatusBadgeColor(project.status).includes('red') ? 'bg-red-500' : 'bg-gray-500'}`}></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Statut</p>
                    {isEditing ? (
                      <Select
                        value={editedProject?.status || project.status}
                        onValueChange={(value) => setEditedProject(prev => prev ? { ...prev, status: value } : null)}
                      >
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue>
                            {editedProject?.status || project.status}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {statuses.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-gray-600">{project.status}</p>
                    )}
                  </div>
                </div>

                {project.source && (
                  <div className="flex items-center gap-3">
                    <GlobeAltIcon className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Source</p>
                      <p className="text-sm text-gray-600">{project.source}</p>
                    </div>
                  </div>
                )}

                {project.rgpd !== undefined && (
                  <div className="flex items-center gap-3">
                    <CheckIcon className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Consentement RGPD</p>
                      <p className="text-sm text-gray-600">{project.rgpd ? 'Accepté' : 'Refusé'}</p>
                    </div>
                  </div>
                )}
              </div>

            </CardContent>
          </Card>

          {/* Détails du projet */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HomeIcon className="w-5 h-5" />
                Détails du projet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                {project.motif}
              </p>

              {isEditing && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                    {isSaving ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                      />
                    ) : (
                      <CheckIcon className="w-4 h-4 mr-2" />
                    )}
                    Sauvegarder
                  </Button>
                  <Button variant="outline" onClick={handleCancelEdit} className="flex-1">
                    <XMarkIcon className="w-4 h-4 mr-2" />
                    Annuler
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section commentaires */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChatBubbleLeftIcon className="w-5 h-5" />
                Commentaires
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Liste des commentaires existants */}
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {comment.auteur}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {formatDate(comment.date)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <TrashIcon className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {comment.texte}
                      </p>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Aucun commentaire pour le moment
                  </p>
                )}
              </div>

              {/* Ajouter un nouveau commentaire */}
              <div className="space-y-3 border-t pt-4">
                <Label htmlFor="new-comment" className="text-sm font-medium">
                  Ajouter un commentaire
                </Label>
                <Textarea
                  id="new-comment"
                  placeholder="Tapez votre commentaire ici..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                  ) : (
                    <ChatBubbleLeftIcon className="w-4 h-4 mr-2" />
                  )}
                  Ajouter le commentaire
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

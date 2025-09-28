'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PulseLoader } from '@/components/ui/loader'
import { SettingsSidebar } from '../../../components/settings-sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { toast } from 'sonner'
import { 
  User, Shield, Building2, Lock, Mail, Phone, MapPin, 
  Users, Plus, Trash2, Camera, Upload, Calendar,
  Eye, EyeOff, Loader, Download, FileSpreadsheet, FileText
} from 'lucide-react'
import { db, storage, auth } from '@/lib/firebase'
import { 
  collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc, serverTimestamp, getDoc 
} from 'firebase/firestore'
import { 
  ref, uploadBytes, getDownloadURL
} from 'firebase/storage'
import { 
  updatePassword, reauthenticateWithCredential, EmailAuthProvider, createUserWithEmailAndPassword, sendPasswordResetEmail, deleteUser
} from 'firebase/auth'

interface UserRole {
  id: string
  email: string
  role: 'admin' | 'user' | 'viewer'
  nom: string
  prenom: string
  dateCreation: any
  dateInvitation?: any
  status: 'active' | 'inactive' | 'pending'
  invitePar: string
  derniereConnexion?: any
  isPrimary?: boolean
  permissions: {
    clients: { create: boolean, read: boolean, update: boolean, delete: boolean }
    projects: { create: boolean, read: boolean, update: boolean, delete: boolean }
    factures: { create: boolean, read: boolean, update: boolean, delete: boolean }
    devis: { create: boolean, read: boolean, update: boolean, delete: boolean }
    settings: { company: boolean, users: boolean, billing: boolean }
  }
}

interface CompanyData {
  nom: string
  adresse: string
  codePostal: string
  ville: string
  telephone: string
  email: string
  siret: string
  formeJuridique: string
  codeAPE: string
  capital: string
  villeRCS: string
  numeroTVA: string
  dateDebutActivite: string
  logo?: string
}

export default function ParametrePage() {
  const { user, clientData, userData, loading: authLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  
  // Profile form data
  const [profileData, setProfileData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    ville: ''
  })
  
  // Password change data
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  
  // Users management
  const [users, setUsers] = useState<UserRole[]>([])
  const [newUser, setNewUser] = useState({
    email: '',
    nom: '',
    prenom: '',
    role: 'user' as 'admin' | 'user' | 'viewer',
    password: '',
    sendInvitation: true
  })
  const [showAddUser, setShowAddUser] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, userId: string, userName: string}>({
    show: false,
    userId: '',
    userName: ''
  })
  
  // Company data
  const [companyData, setCompanyData] = useState<CompanyData>({
    nom: '',
    adresse: '',
    codePostal: '',
    ville: '',
    telephone: '',
    email: '',
    siret: '',
    formeJuridique: '',
    codeAPE: '',
    capital: '',
    villeRCS: '',
    numeroTVA: '',
    dateDebutActivite: '',
    logo: ''
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')

  useEffect(() => {
    if (clientData && userData) {
      // Utiliser les données de l'utilisateur connecté (userData) pour les informations personnelles
      setProfileData({
        nom: userData.nom || '',
        prenom: userData.prenom || '',
        email: userData.email || '',
        telephone: userData.telephone || clientData.telephone || '',
        ville: userData.ville || clientData.ville || ''
      })
      
      // Load company data from clientData or parametres collection
      setCompanyData({
        nom: clientData.nomEntreprise || '',
        adresse: clientData.adresseEntreprise || '',
        codePostal: clientData.codePostal || '',
        ville: clientData.ville || '',
        telephone: clientData.telephone || '',
        email: clientData.email || '',
        siret: clientData.siret || '',
        formeJuridique: clientData.formeJuridique || '',
        codeAPE: clientData.codeAPE || '',
        capital: clientData.capital || '',
        villeRCS: clientData.villeRCS || '',
        numeroTVA: clientData.numeroTVA || '',
        dateDebutActivite: clientData.dateDebutActivite || '',
        logo: clientData.logoImage || ''
      })
      
      if (clientData.logoImage) {
        setLogoPreview(clientData.logoImage)
      }
    }
  }, [clientData, userData])

  // Load users for access management
  useEffect(() => {
    loadUsers()
  }, [clientData])

  const loadUsers = async () => {
    if (!clientData?.id || !user) return
    
    try {
      // Load users from a users subcollection or separate collection
      const usersRef = collection(db, 'clients', clientData.id, 'users')
      const usersSnapshot = await getDocs(usersRef)
      
      const usersList: UserRole[] = []
      usersSnapshot.forEach((doc: any) => {
        usersList.push({
          id: doc.id,
          ...doc.data()
        } as UserRole)
      })
      
      // Ajouter l'utilisateur connecté s'il n'est pas déjà dans la liste
      const currentUserExists = usersList.some(u => u.email === user.email)
      if (!currentUserExists) {
        usersList.unshift({
          id: user.uid,
          email: user.email || '',
          nom: clientData.nom || '',
          prenom: clientData.prenom || '',
          role: 'admin',
          dateCreation: new Date(),
          dateInvitation: new Date(),
          status: 'active',
          invitePar: '',
          derniereConnexion: new Date(),
          isPrimary: true,
          permissions: {
            clients: { create: true, read: true, update: true, delete: true },
            projects: { create: true, read: true, update: true, delete: true },
            factures: { create: true, read: true, update: true, delete: true },
            devis: { create: true, read: true, update: true, delete: true },
            settings: { company: true, users: true, billing: true }
          }
        })
      }
      
      setUsers(usersList)
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error)
    }
  }

  // Profile handlers
  const handleProfileSave = async () => {
    if (!clientData?.id || !userData?.id) return
    
    setLoading(true)
    try {
      if (userData.isPrimary) {
        // Si c'est l'utilisateur principal, mettre à jour le document client
        const clientRef = doc(db, 'clients', clientData.id)
        await updateDoc(clientRef, profileData)
      } else {
        // Si c'est un sous-compte, mettre à jour dans la sous-collection users
        const userRef = doc(db, `clients/${clientData.id}/users`, userData.id)
        await updateDoc(userRef, profileData)
      }
      toast.success('Profil mis à jour avec succès!')
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error)
      toast.error('Erreur lors de la mise à jour du profil')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (!user) return
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères')
      return
    }
    
    setLoading(true)
    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email!, passwordData.currentPassword)
      await reauthenticateWithCredential(user, credential)
      
      // Update password
      await updatePassword(user, passwordData.newPassword)
      
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      toast.success('Mot de passe modifié avec succès!')
    } catch (error: any) {
      console.error('Erreur lors du changement de mot de passe:', error)
      if (error.code === 'auth/wrong-password') {
        toast.error('Mot de passe actuel incorrect')
      } else {
        toast.error('Erreur lors du changement de mot de passe')
      }
    } finally {
      setLoading(false)
    }
  }

  // User management handlers
  const handleAddUser = async () => {
    if (!clientData?.id || !newUser.email || !newUser.nom || !newUser.prenom) {
      toast.error('Veuillez remplir tous les champs')
      return
    }

    if (!newUser.sendInvitation && !newUser.password) {
      toast.error('Veuillez saisir un mot de passe ou activer l\'envoi d\'invitation')
      return
    }

    setLoading(true)
    try {
      const getPermissionsByRole = (role: 'admin' | 'user' | 'viewer') => {
        switch (role) {
          case 'admin':
            return {
              clients: { create: true, read: true, update: true, delete: true },
              projects: { create: true, read: true, update: true, delete: true },
              factures: { create: true, read: true, update: true, delete: true },
              devis: { create: true, read: true, update: true, delete: true },
              settings: { company: true, users: true, billing: true }
            }
          case 'user':
            return {
              clients: { create: true, read: true, update: true, delete: true },
              projects: { create: true, read: true, update: true, delete: true },
              factures: { create: true, read: true, update: true, delete: true },
              devis: { create: true, read: true, update: true, delete: true },
              settings: { company: false, users: false, billing: false }
            }
          case 'viewer':
            return {
              clients: { create: false, read: true, update: false, delete: false },
              projects: { create: false, read: true, update: false, delete: false },
              factures: { create: false, read: true, update: false, delete: false },
              devis: { create: false, read: true, update: false, delete: false },
              settings: { company: false, users: false, billing: false }
            }
          default:
            return {
              clients: { create: false, read: true, update: false, delete: false },
              projects: { create: false, read: true, update: false, delete: false },
              factures: { create: false, read: true, update: false, delete: false },
              devis: { create: false, read: true, update: false, delete: false },
              settings: { company: false, users: false, billing: false }
            }
        }
      }

      let userCredential = null
      let userId = ''

      // Créer le compte Firebase Auth si un mot de passe est fourni
      if (!newUser.sendInvitation && newUser.password) {
        try {
          userCredential = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password)
          userId = userCredential.user.uid
        } catch (authError: any) {
          if (authError.code === 'auth/email-already-in-use') {
            toast.error('Cette adresse email est déjà utilisée')
          } else {
            toast.error('Erreur lors de la création du compte: ' + authError.message)
          }
          return
        }
      }

      // Ajouter l'utilisateur à Firestore
      const usersRef = collection(db, 'clients', clientData.id, 'users')
      const userData = {
        email: newUser.email,
        nom: newUser.nom,
        prenom: newUser.prenom,
        role: newUser.role,
        dateCreation: new Date(),
        dateInvitation: new Date(),
        status: newUser.sendInvitation ? 'pending' : 'active',
        invitePar: user?.uid || '',
        derniereConnexion: null,
        permissions: getPermissionsByRole(newUser.role),
        isPrimary: false
      }

      if (userId) {
        await addDoc(usersRef, { ...userData, authUid: userId })
      } else {
        await addDoc(usersRef, userData)
      }

      // Envoyer l'invitation par email si demandé
      if (newUser.sendInvitation) {
        try {
          const response = await fetch('/api/send-invitation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: newUser.email,
              nom: newUser.nom,
              prenom: newUser.prenom,
              role: newUser.role,
              clientId: user?.uid || ''
            }),
          })

          if (response.ok) {
            toast.success('Utilisateur ajouté! Email d\'invitation envoyé avec succès.')
          } else {
            toast.error('Utilisateur ajouté mais erreur lors de l\'envoi de l\'invitation')
          }
        } catch (emailError) {
          console.error('Erreur lors de l\'envoi de l\'invitation:', emailError)
          toast.error('Utilisateur ajouté mais erreur lors de l\'envoi de l\'invitation')
        }
      } else {
        toast.success('Utilisateur ajouté avec succès!')
      }
      
      setNewUser({ email: '', nom: '', prenom: '', role: 'user', password: '', sendInvitation: true })
      setShowAddUser(false)
      loadUsers()
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'utilisateur:', error)
      toast.error('Erreur lors de l\'ajout de l\'utilisateur')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!clientData?.id) return
    
    try {
      console.log('=== SUPPRESSION UTILISATEUR ===')
      console.log('ClientId:', clientData.id, 'UserId:', userId)
      
      // Récupérer les données utilisateur pour obtenir l'UID Firebase Auth
      const userRef = doc(db, 'clients', clientData.id, 'users', userId)
      const userDoc = await getDoc(userRef)
      
      if (!userDoc.exists()) {
        throw new Error('Utilisateur non trouvé')
      }
      
      const userData = userDoc.data()
      console.log('Données utilisateur à supprimer:', userData)
      
      // Supprimer l'utilisateur de Firestore
      await deleteDoc(userRef)
      console.log('Utilisateur supprimé de Firestore')
      
      // Supprimer l'utilisateur de Firebase Auth via l'API
      if (userData.uid) {
        console.log('Suppression Firebase Auth via API...')
        const deleteResponse = await fetch('/api/delete-user', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userUid: userData.uid
          }),
        })

        const deleteResult = await deleteResponse.json()
        console.log('Résultat suppression Firebase Auth:', deleteResult)

        if (deleteResponse.ok) {
          toast.success('Utilisateur supprimé complètement (Firestore + Firebase Auth)')
        } else {
          toast.success(`Utilisateur supprimé de Firestore. Erreur Firebase Auth: ${deleteResult.details}`)
        }
      } else {
        toast.success('Utilisateur supprimé avec succès!')
      }

      loadUsers()
      setDeleteConfirm({ show: false, userId: '', userName: '' })
    } catch (error: any) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error)
      toast.error(`Erreur lors de la suppression: ${error.message}`)
    }
  }

  const confirmDeleteUser = (userId: string, userName: string) => {
    setDeleteConfirm({ show: true, userId, userName })
  }

  // Company handlers
  const handleLogoUpload = async (file: File) => {
    if (!clientData?.id) return
    
    setLoading(true)
    try {
      const logoRef = ref(storage, `logos/${clientData.id}/${file.name}`)
      await uploadBytes(logoRef, file)
      const logoURL = await getDownloadURL(logoRef)
      
      setCompanyData(prev => ({ ...prev, logo: logoURL }))
      setLogoPreview(logoURL)
      
      // Update in database
      const clientRef = doc(db, 'clients', clientData.id)
      await updateDoc(clientRef, { logoImage: logoURL })
      
      toast.success('Logo uploadé avec succès!')
    } catch (error) {
      console.error('Erreur lors de l\'upload du logo:', error)
      toast.error('Erreur lors de l\'upload du logo')
    } finally {
      setLoading(false)
    }
  }

  const handleCompanySave = async () => {
    if (!clientData?.id) return
    
    setLoading(true)
    try {
      const clientRef = doc(db, 'clients', clientData.id)
      await updateDoc(clientRef, {
        nomEntreprise: companyData.nom,
        adresseEntreprise: companyData.adresse,
        codePostal: companyData.codePostal,
        ville: companyData.ville,
        telephone: companyData.telephone,
        email: companyData.email,
        siret: companyData.siret,
        formeJuridique: companyData.formeJuridique,
        codeAPE: companyData.codeAPE,
        capital: companyData.capital,
        villeRCS: companyData.villeRCS,
        numeroTVA: companyData.numeroTVA,
        dateDebutActivite: companyData.dateDebutActivite
      })
      
      toast.success('Informations société mises à jour avec succès!')
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la société:', error)
      toast.error('Erreur lors de la mise à jour de la société')
    } finally {
      setLoading(false)
    }
  }

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
    visible: { opacity: 1, y: 0 }
  }

  // Redirect effect - must be after all useState declarations
  useEffect(() => {
    if (!authLoading && (!user || !clientData)) {
      router.push('/')
    }
  }, [user, clientData, router, authLoading])

  // === FONCTIONS D'EXPORT COMPTABILITÉ ===
  
  const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    const csvContent = [
      headers.join(';'), // En-têtes
      ...data.map(row => headers.map(header => {
        const value = row[header] || ''
        // Échapper les guillemets et entourer de guillemets si nécessaire
        return typeof value === 'string' && (value.includes(';') || value.includes('"') || value.includes('\n'))
          ? `"${value.replace(/"/g, '""')}"`
          : value
      }).join(';'))
    ].join('\n')
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }) // BOM pour Excel
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const exportClients = async () => {
    if (!user?.uid) {
      toast.error('Utilisateur non connecté')
      return
    }
    
    try {
      setLoading(true)
      console.log('🔄 Export des clients...')
      
      const clientsRef = collection(db, 'clients')
      const clientsSnapshot = await getDocs(query(clientsRef, where('uidclient', '==', user.uid)))
      
      if (!clientsSnapshot.empty) {
        const mainClientDoc = clientsSnapshot.docs[0]
        const clientsSubRef = collection(db, `clients/${mainClientDoc.id}/clients`)
        const clientsSubSnapshot = await getDocs(clientsSubRef)
        
        const clientsData = clientsSubSnapshot.docs.map(doc => {
          const data = doc.data()
          return {
            'ID': doc.id,
            'Type': data.typeClient === 'entreprise' ? 'Entreprise' : 'Particulier',
            'Nom': data.typeClient === 'entreprise' ? data.nomEntreprise : `${data.nom} ${data.prenom}`,
            'Email': data.email || '',
            'Téléphone': data.telephone || '',
            'Adresse': data.adresse || '',
            'Code Postal': data.codePostal || '',
            'Ville': data.ville || '',
            'SIRET': data.siret || '',
            'N° TVA': data.numeroTVA || '',
            'Code APE': data.codeAPE || '',
            'Statut': data.status || 'actif',
            'Date Création': data.dateCreation ? new Date(data.dateCreation.toDate()).toLocaleDateString('fr-FR') : '',
            'Commentaires': data.commentaires || ''
          }
        })
        
        const headers = ['ID', 'Type', 'Nom', 'Email', 'Téléphone', 'Adresse', 'Code Postal', 'Ville', 'SIRET', 'N° TVA', 'Code APE', 'Statut', 'Date Création', 'Commentaires']
        exportToCSV(clientsData, 'clients', headers)
        
        toast.success(`${clientsData.length} clients exportés avec succès`)
      } else {
        toast.error('Aucun client trouvé')
      }
    } catch (error) {
      console.error('Erreur export clients:', error)
      toast.error('Erreur lors de l\'export des clients')
    } finally {
      setLoading(false)
    }
  }

  const exportDevis = async () => {
    if (!user?.uid) {
      toast.error('Utilisateur non connecté')
      return
    }
    
    try {
      setLoading(true)
      console.log('🔄 Export des devis...')
      
      const clientsRef = collection(db, 'clients')
      const clientsSnapshot = await getDocs(query(clientsRef, where('uidclient', '==', user.uid)))
      
      if (!clientsSnapshot.empty) {
        const mainClientDoc = clientsSnapshot.docs[0]
        const devisRef = collection(db, `clients/${mainClientDoc.id}/devis`)
        const devisSnapshot = await getDocs(devisRef)
        
        const devisData = devisSnapshot.docs.map(doc => {
          const data = doc.data()
          return {
            'N° Devis': data.numeroDevis || doc.id,
            'Client': data.clientNom || '',
            'Email Client': data.clientEmail || '',
            'Date Création': data.dateCreation ? new Date(data.dateCreation.toDate()).toLocaleDateString('fr-FR') : '',
            'Date Validité': data.dateValidite ? new Date(data.dateValidite.toDate()).toLocaleDateString('fr-FR') : '',
            'Statut': data.status || 'brouillon',
            'Montant HT': data.montantTotalHT ? `${data.montantTotalHT.toFixed(2)} €` : '0,00 €',
            'Montant TVA': data.montantTotalTVA ? `${data.montantTotalTVA.toFixed(2)} €` : '0,00 €',
            'Montant TTC': data.montantTotalTTC ? `${data.montantTotalTTC.toFixed(2)} €` : '0,00 €',
            'Conditions': data.conditions || '',
            'Notes': data.notes || '',
            'SIRET Client': data.clientSiret || '',
            'N° TVA Client': data.clientNumeroTVA || '',
            'Nb Lignes': data.lignes ? data.lignes.length : 0,
            'Date Modification': data.lastModified ? new Date(data.lastModified.toDate()).toLocaleDateString('fr-FR') : ''
          }
        })
        
        const headers = ['N° Devis', 'Client', 'Email Client', 'Date Création', 'Date Validité', 'Statut', 'Montant HT', 'Montant TVA', 'Montant TTC', 'Conditions', 'Notes', 'SIRET Client', 'N° TVA Client', 'Nb Lignes', 'Date Modification']
        exportToCSV(devisData, 'devis', headers)
        
        toast.success(`${devisData.length} devis exportés avec succès`)
      } else {
        toast.error('Aucun devis trouvé')
      }
    } catch (error) {
      console.error('Erreur export devis:', error)
      toast.error('Erreur lors de l\'export des devis')
    } finally {
      setLoading(false)
    }
  }

  const exportFactures = async () => {
    if (!user?.uid) {
      toast.error('Utilisateur non connecté')
      return
    }
    
    try {
      setLoading(true)
      console.log('🔄 Export des factures...')
      
      const clientsRef = collection(db, 'clients')
      const clientsSnapshot = await getDocs(query(clientsRef, where('uidclient', '==', user.uid)))
      
      if (!clientsSnapshot.empty) {
        const mainClientDoc = clientsSnapshot.docs[0]
        const facturesRef = collection(db, `clients/${mainClientDoc.id}/factures`)
        const facturesSnapshot = await getDocs(facturesRef)
        
        const facturesData = facturesSnapshot.docs.map(doc => {
          const data = doc.data()
          return {
            'N° Facture': data.numeroFacture || doc.id,
            'Client': data.clientNom || '',
            'Email Client': data.clientEmail || '',
            'Date Création': data.dateCreation ? new Date(data.dateCreation.toDate()).toLocaleDateString('fr-FR') : '',
            'Date Échéance': data.dateEcheance ? new Date(data.dateEcheance.toDate()).toLocaleDateString('fr-FR') : '',
            'Statut': data.statut || 'brouillon',
            'Montant HT': data.montantTotalHT ? `${data.montantTotalHT.toFixed(2)} €` : '0,00 €',
            'Montant TVA': data.montantTotalTVA ? `${data.montantTotalTVA.toFixed(2)} €` : '0,00 €',
            'Montant TTC': data.montantTotalTTC ? `${data.montantTotalTTC.toFixed(2)} €` : '0,00 €',
            'Conditions': data.conditions || '',
            'Notes': data.notes || '',
            'SIRET Client': data.clientSiret || '',
            'N° TVA Client': data.clientNumeroTVA || '',
            'Nb Lignes': data.lignes ? data.lignes.length : 0,
            'Origine Devis': data.originDevis ? data.originDevis.numeroDevis : '',
            'Date Modification': data.lastModified ? new Date(data.lastModified.toDate()).toLocaleDateString('fr-FR') : ''
          }
        })
        
        const headers = ['N° Facture', 'Client', 'Email Client', 'Date Création', 'Date Échéance', 'Statut', 'Montant HT', 'Montant TVA', 'Montant TTC', 'Conditions', 'Notes', 'SIRET Client', 'N° TVA Client', 'Nb Lignes', 'Origine Devis', 'Date Modification']
        exportToCSV(facturesData, 'factures', headers)
        
        toast.success(`${facturesData.length} factures exportées avec succès`)
      } else {
        toast.error('Aucune facture trouvée')
      }
    } catch (error) {
      console.error('Erreur export factures:', error)
      toast.error('Erreur lors de l\'export des factures')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <PulseLoader text="Chargement des paramètres..." />
      </div>
    )
  }

  if (!user || !clientData) {
    return null
  }

  return (
    <>
      <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 overflow-auto ml-0">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Paramètres
            </h1>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="p-6 space-y-6"
          >
          {/* Profile Section */}
          {activeTab === 'profile' && (
            <>
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Informations personnelles
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="prenom">Prénom</Label>
                        <Input
                          id="prenom"
                          value={profileData.prenom}
                          onChange={(e) => setProfileData(prev => ({ ...prev, prenom: e.target.value }))}
                          placeholder="Votre prénom"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="nom">Nom</Label>
                        <Input
                          id="nom"
                          value={profileData.nom}
                          onChange={(e) => setProfileData(prev => ({ ...prev, nom: e.target.value }))}
                          placeholder="Votre nom"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="votre@email.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telephone" className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Téléphone
                      </Label>
                      <Input
                        id="telephone"
                        value={profileData.telephone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, telephone: e.target.value }))}
                        placeholder="Votre numéro de téléphone"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ville" className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Ville
                      </Label>
                      <Input
                        id="ville"
                        value={profileData.ville}
                        onChange={(e) => setProfileData(prev => ({ ...prev, ville: e.target.value }))}
                        placeholder="Votre ville"
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        onClick={handleProfileSave}
                        disabled={loading}
                        className="flex items-center gap-2"
                      >
                        {loading && <Loader className="w-4 h-4" />}
                        Sauvegarder les modifications
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Password Change */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="w-5 h-5" />
                      Changer le mot de passe
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPasswords.current ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          placeholder="Votre mot de passe actuel"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                        >
                          {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          placeholder="Votre nouveau mot de passe"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        >
                          {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Confirmez votre nouveau mot de passe"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        >
                          {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        onClick={handlePasswordChange}
                        disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        {loading && <Loader className="w-4 h-4" />}
                        Changer le mot de passe
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}

          {/* Access & Rights Section */}
          {activeTab === 'access' && (
            <>
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Gestion des utilisateurs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Gérez les utilisateurs ayant accès à votre compte
                      </p>
                      <Button
                        onClick={() => setShowAddUser(true)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        Ajouter un utilisateur
                      </Button>
                    </div>

                    {showAddUser && (
                      <Card className="border-dashed">
                        <CardContent className="pt-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="userEmail">Email</Label>
                              <Input
                                id="userEmail"
                                type="email"
                                value={newUser.email}
                                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="email@exemple.com"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="userRole">Rôle</Label>
                              <select
                                id="userRole"
                                value={newUser.role}
                                onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as 'admin' | 'user' | 'viewer' }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600"
                              >
                                <option value="viewer">Lecteur</option>
                                <option value="user">Utilisateur</option>
                                <option value="admin">Administrateur</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="userNom">Nom</Label>
                              <Input
                                id="userNom"
                                value={newUser.nom}
                                onChange={(e) => setNewUser(prev => ({ ...prev, nom: e.target.value }))}
                                placeholder="Nom"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="userPrenom">Prénom</Label>
                              <Input
                                id="userPrenom"
                                value={newUser.prenom}
                                onChange={(e) => setNewUser(prev => ({ ...prev, prenom: e.target.value }))}
                                placeholder="Prénom"
                              />
                            </div>
                            
                            {/* Password or Invitation Options */}
                            <div className="col-span-full space-y-4 border-t pt-4">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="sendInvitation"
                                  checked={newUser.sendInvitation}
                                  onChange={(e) => setNewUser(prev => ({ ...prev, sendInvitation: e.target.checked, password: e.target.checked ? '' : prev.password }))}
                                  className="rounded"
                                />
                                <Label htmlFor="sendInvitation" className="text-sm">
                                  Envoyer une invitation par email (l'utilisateur créera son mot de passe)
                                </Label>
                              </div>
                              
                              {!newUser.sendInvitation && (
                                <div className="space-y-2">
                                  <Label htmlFor="userPassword">Mot de passe</Label>
                                  <Input
                                    id="userPassword"
                                    type="password"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                                    placeholder="Mot de passe temporaire"
                                  />
                                  <p className="text-xs text-gray-500">
                                    L'utilisateur pourra changer ce mot de passe lors de sa première connexion
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 pt-4">
                            <Button
                              variant="outline"
                              onClick={() => setShowAddUser(false)}
                              className="cursor-pointer"
                            >
                              Annuler
                            </Button>
                            <Button
                              onClick={handleAddUser}
                              disabled={loading}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              {loading && <Loader className="w-4 h-4" />}
                              {newUser.sendInvitation ? 'Inviter' : 'Créer'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {users.length > 0 ? (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Utilisateurs ({users.length})</h3>
                        {users.map((user) => (
                          <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-gray-800">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                {user.prenom?.charAt(0)}{user.nom?.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium">{user.prenom} {user.nom}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                                <p className="text-xs text-gray-500">
                                  Ajouté le {user.dateCreation?.toDate?.()?.toLocaleDateString('fr-FR') || 'N/A'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={user.role === 'admin' ? 'default' : user.role === 'user' ? 'secondary' : 'outline'}
                                className={user.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : ''}
                              >
                                {user.role === 'admin' ? '👑 Administrateur' : user.role === 'user' ? '👤 Utilisateur' : '👁️ Lecteur'}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {user.status === 'active' ? '🟢 Actif' : '🔴 Inactif'}
                              </Badge>
                              {!user.isPrimary && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => confirmDeleteUser(user.id, `${user.prenom} ${user.nom}`)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Aucun utilisateur trouvé</p>
                        <p className="text-sm">Ajoutez des utilisateurs pour collaborer sur ce compte</p>
                      </div>
                    )}

                  </CardContent>
                </Card>
              </motion.div>

              {/* Delete Confirmation Dialog */}
              <Dialog open={deleteConfirm.show} onOpenChange={(open) => !open && setDeleteConfirm({ show: false, userId: '', userName: '' })}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirmer la suppression</DialogTitle>
                    <DialogDescription>
                      Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.
                    </DialogDescription>
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                      <span className="font-medium">
                        {deleteConfirm.userName}
                      </span>
                    </div>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setDeleteConfirm({ show: false, userId: '', userName: '' })}
                      className="cursor-pointer"
                    >
                      Annuler
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteUser(deleteConfirm.userId)}
                      className="cursor-pointer"
                    >
                      Supprimer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}

          {/* Company Section */}
          {activeTab === 'company' && (
            <>
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="w-5 h-5" />
                      Logo de l'entreprise
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="logo">Choisir un logo</Label>
                        <Input
                          id="logo"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setLogoFile(file)
                              const reader = new FileReader()
                              reader.onload = (e) => setLogoPreview(e.target?.result as string)
                              reader.readAsDataURL(file)
                            }
                          }}
                        />
                        {logoFile && (
                          <Button
                            onClick={() => handleLogoUpload(logoFile)}
                            disabled={loading}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Upload className="w-4 h-4" />
                            Uploader le logo
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Informations de l'entreprise
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="companyNom">Nom de l'entreprise</Label>
                        <Input
                          id="companyNom"
                          value={companyData.nom}
                          onChange={(e) => setCompanyData(prev => ({ ...prev, nom: e.target.value }))}
                          placeholder="Nom de votre entreprise"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="siret">N° SIRET</Label>
                        <Input
                          id="siret"
                          value={companyData.siret}
                          onChange={(e) => setCompanyData(prev => ({ ...prev, siret: e.target.value }))}
                          placeholder="12345678901234"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="formeJuridique">Forme juridique</Label>
                        <Input
                          id="formeJuridique"
                          value={companyData.formeJuridique}
                          onChange={(e) => setCompanyData(prev => ({ ...prev, formeJuridique: e.target.value }))}
                          placeholder="SARL, SAS, EURL..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="codeAPE">Code APE</Label>
                        <Input
                          id="codeAPE"
                          value={companyData.codeAPE}
                          onChange={(e) => setCompanyData(prev => ({ ...prev, codeAPE: e.target.value }))}
                          placeholder="1234Z"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="capital">Capital</Label>
                        <Input
                          id="capital"
                          value={companyData.capital}
                          onChange={(e) => setCompanyData(prev => ({ ...prev, capital: e.target.value }))}
                          placeholder="10000 €"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="numeroTVA">N° TVA intracommunautaire</Label>
                        <Input
                          id="numeroTVA"
                          value={companyData.numeroTVA}
                          onChange={(e) => setCompanyData(prev => ({ ...prev, numeroTVA: e.target.value }))}
                          placeholder="FR12345678901"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="villeRCS">Ville RCS</Label>
                        <Input
                          id="villeRCS"
                          value={companyData.villeRCS}
                          onChange={(e) => setCompanyData(prev => ({ ...prev, villeRCS: e.target.value }))}
                          placeholder="Paris"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dateDebutActivite" className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Date de début d'activité
                        </Label>
                        <Input
                          id="dateDebutActivite"
                          type="date"
                          value={companyData.dateDebutActivite}
                          onChange={(e) => setCompanyData(prev => ({ ...prev, dateDebutActivite: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyAdresse" className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Adresse
                      </Label>
                      <Textarea
                        id="companyAdresse"
                        value={companyData.adresse}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, adresse: e.target.value }))}
                        placeholder="Adresse complète de l'entreprise"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="companyCodePostal">Code postal</Label>
                        <Input
                          id="companyCodePostal"
                          value={companyData.codePostal}
                          onChange={(e) => setCompanyData(prev => ({ ...prev, codePostal: e.target.value }))}
                          placeholder="75000"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="companyVille">Ville</Label>
                        <Input
                          id="companyVille"
                          value={companyData.ville}
                          onChange={(e) => setCompanyData(prev => ({ ...prev, ville: e.target.value }))}
                          placeholder="Paris"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="companyTelephone" className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Téléphone
                        </Label>
                        <Input
                          id="companyTelephone"
                          value={companyData.telephone}
                          onChange={(e) => setCompanyData(prev => ({ ...prev, telephone: e.target.value }))}
                          placeholder="01 23 45 67 89"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="companyEmail" className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email
                        </Label>
                        <Input
                          id="companyEmail"
                          type="email"
                          value={companyData.email}
                          onChange={(e) => setCompanyData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="contact@entreprise.com"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={handleCompanySave}
                        disabled={loading}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        {loading && <Loader className="w-4 h-4" />}
                        Sauvegarder
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}

          {/* Comptabilité Section */}
          {activeTab === 'compta' && (
            <>
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5" />
                      Exports comptables
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-sm text-gray-600 mb-6">
                      Exportez vos données au format CSV pour votre comptabilité. Les fichiers sont compatibles avec Excel et la plupart des logiciels comptables.
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Export Clients */}
                      <div className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">Clients</h3>
                            <p className="text-sm text-gray-500">Base clients complète</p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>• Informations de contact</div>
                          <div>• SIRET, TVA, Code APE</div>
                          <div>• Dates de création</div>
                          <div>• Statuts et commentaires</div>
                        </div>
                        <Button 
                          onClick={exportClients}
                          disabled={loading}
                          className="w-full"
                          variant="outline"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {loading ? 'Export...' : 'Exporter CSV'}
                        </Button>
                      </div>

                      {/* Export Devis */}
                      <div className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">Devis</h3>
                            <p className="text-sm text-gray-500">Tous les devis créés</p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>• Numéros et dates</div>
                          <div>• Clients et montants</div>
                          <div>• Statuts et validité</div>
                          <div>• Informations fiscales</div>
                        </div>
                        <Button 
                          onClick={exportDevis}
                          disabled={loading}
                          className="w-full"
                          variant="outline"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {loading ? 'Export...' : 'Exporter CSV'}
                        </Button>
                      </div>

                      {/* Export Factures */}
                      <div className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <FileSpreadsheet className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">Factures</h3>
                            <p className="text-sm text-gray-500">Toutes les factures</p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>• Numéros et échéances</div>
                          <div>• Montants HT/TTC/TVA</div>
                          <div>• Statuts de paiement</div>
                          <div>• Traçabilité devis</div>
                        </div>
                        <Button 
                          onClick={exportFactures}
                          disabled={loading}
                          className="w-full"
                          variant="outline"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {loading ? 'Export...' : 'Exporter CSV'}
                        </Button>
                      </div>
                    </div>

                    {/* Informations sur les formats */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                      <h4 className="font-medium text-blue-900 mb-2">Formats d'export disponibles</h4>
                      <div className="text-sm text-blue-800 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          <span><strong>CSV (Excel)</strong> - Format standard avec séparateur point-virgule, compatible Excel France</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          <span><strong>Encodage UTF-8</strong> - Caractères spéciaux et accents préservés</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          <span><strong>Dates françaises</strong> - Format JJ/MM/AAAA</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          <span><strong>Montants formatés</strong> - Avec symbole € et décimales</span>
                        </div>
                      </div>
                    </div>

                    {/* Conseils d'utilisation */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Conseils d'utilisation</h4>
                      <div className="text-sm text-gray-700 space-y-1">
                        <div>• Les fichiers sont nommés automatiquement avec la date d'export</div>
                        <div>• Ouvrez avec Excel, LibreOffice Calc ou votre logiciel comptable</div>
                        <div>• Les données sont exportées en temps réel depuis votre base</div>
                        <div>• Répétez l'export régulièrement pour avoir les dernières données</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </motion.div>
        </div>
      </div>
    </>
  )
}

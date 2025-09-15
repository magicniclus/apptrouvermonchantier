'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { X, Upload, Plus, Trash2, Settings, FileText, Calendar, ArrowRight, ArrowLeft, ChevronDown, MoreHorizontal, Edit, Copy, Download, Eye } from 'lucide-react'
import DevisFooter from '@/components/DevisFooter'
import { useAuth } from '@/hooks/useAuth'
import { useClients, Client } from '@/hooks/useClients'
import { genererProchainNumero } from '@/lib/numerotation'
import { ClientDrawer } from '@/components/ClientDrawer'
import { PrestationDrawer } from '@/components/PrestationDrawer'
import { PrestationsListDrawer } from '@/components/PrestationsListDrawer'
import { collection, addDoc, serverTimestamp, getDocs, query, where, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { toast } from 'sonner'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { generateDevisPDF, previewDevisPDF } from '@/lib/pdf-generator'
import { PulseLoader } from '@/components/ui/loader'

interface DevisLine {
  id: string
  designation: string
  quantite: number
  unite?: string
  prixUnitaireHT: number
  remise: number
  montantHT: number
  tauxTVA: number
  typePrestation?: string
  isDesignationOnly?: boolean
}

export default function DevisDetailPage() {
  const params = useParams()
  const { user, clientData } = useAuth()
  const { clients } = useClients()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [devisDataFromDB, setDevisDataFromDB] = useState<any>(null)
  
  // States - Read-only mode
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isClientDrawerOpen, setIsClientDrawerOpen] = useState(false)
  const [isPrestationDrawerOpen, setIsPrestationDrawerOpen] = useState(false)
  const [isPrestationsListOpen, setIsPrestationsListOpen] = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [showOptions, setShowOptions] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  // Devis data
  const [devisData, setDevisData] = useState({
    numeroDevis: '', // Sera généré automatiquement
    dateCreation: '',
    dateValidite: '',
    validiteDuree: 60,
    conditions: '',
    notes: '',
    validiteTexte: '60 jours' // Texte personnalisable pour la validité
  })
  
  // État pour le numéro de devis généré
  const [numeroDevis, setNumeroDevis] = useState<string>('')
  const [isGeneratingNumber, setIsGeneratingNumber] = useState(false)
  const [brouillonId, setBrouillonId] = useState<string | null>(null)
  const [showExitModal, setShowExitModal] = useState(false)
  const [isAutoSaving, setIsAutoSaving] = useState(false)

  // Fetch devis data from Firebase
  useEffect(() => {
    if (!user || !params.id) return

    const fetchDevis = async () => {
      try {
        setLoading(true)
        // Find main client document using uidclient
        const clientsQuery = query(
          collection(db, 'clients'),
          where('uidclient', '==', user.uid)
        )
        const clientsSnapshot = await getDocs(clientsQuery)
        
        if (clientsSnapshot.empty) {
          console.error('No client document found for user:', user.uid)
          setLoading(false)
          return
        }

        const mainClientDoc = clientsSnapshot.docs[0]
        console.log('Found main client document:', mainClientDoc.id)

        // Get devis from subcollection
        const devisDoc = await getDoc(doc(db, `clients/${mainClientDoc.id}/devis`, params.id as string))
        
        if (devisDoc.exists()) {
          const devisDataFromDB = devisDoc.data()
          setDevisDataFromDB(devisDataFromDB)
          console.log('Fetched devis data:', devisDataFromDB)
          
          // Populate form data from database
          setDevisData({
            numeroDevis: devisDataFromDB.numeroDevis || '',
            dateCreation: devisDataFromDB.dateCreation ? 
              (devisDataFromDB.dateCreation.toDate ? devisDataFromDB.dateCreation.toDate().toISOString().split('T')[0] : devisDataFromDB.dateCreation) : '',
            dateValidite: devisDataFromDB.dateValidite ? 
              (devisDataFromDB.dateValidite.toDate ? devisDataFromDB.dateValidite.toDate().toISOString().split('T')[0] : devisDataFromDB.dateValidite) : '',
            validiteDuree: devisDataFromDB.validiteDuree || 60,
            conditions: devisDataFromDB.conditions || '',
            notes: devisDataFromDB.notes || '',
            validiteTexte: devisDataFromDB.validiteTexte || '60 jours'
          })
          
          // Set lignes from database
          if (devisDataFromDB.lignes) {
            setLignes(devisDataFromDB.lignes)
          }
          
          // Set options from database
          if (devisDataFromDB.options) {
            setOptions(devisDataFromDB.options)
          }
          
          // Set other fields
          if (devisDataFromDB.adresseLivraison) {
            setAdresseLivraison(devisDataFromDB.adresseLivraison)
          }
          
          if (devisDataFromDB.intituleDocument) {
            setIntituleDocument(devisDataFromDB.intituleDocument)
          }
          
          if (devisDataFromDB.remiseGlobale) {
            setRemiseGlobale(devisDataFromDB.remiseGlobale)
          }
          
          if (devisDataFromDB.clientSiret) {
            setClientSiret(devisDataFromDB.clientSiret)
          }
          
          if (devisDataFromDB.clientNumeroTVA) {
            setClientNumeroTVA(devisDataFromDB.clientNumeroTVA)
          }
          
          // Find and set selected client
          if (devisDataFromDB.clientId) {
            const client = clients.find(c => c.id === devisDataFromDB.clientId)
            if (client) {
              setSelectedClient(client)
              setClientSearch(`${client.nom} ${client.prenom}`)
            }
          }
          
        } else {
          console.error('Devis not found:', params.id)
        }
      } catch (error) {
        console.error('Error fetching devis:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDevis()
  }, [user, params.id, clients])
  
  // Générer le numéro de devis  // Ne plus créer de brouillon automatiquement au chargement
  // Le brouillon sera créé uniquement lors de l'enregistrement
  
  // Line items
  const [lignes, setLignes] = useState<DevisLine[]>([
    {
      id: 'ligne-1',
      designation: '',
      quantite: 1,
      prixUnitaireHT: 0,
      remise: 0,
      montantHT: 0,
      tauxTVA: 0,
      typePrestation: 'Presta',
      isDesignationOnly: false
    }
  ])

  // State for editing line with prestations
  const [editingLineId, setEditingLineId] = useState<string | null>(null)
  
  // Options
  const [options, setOptions] = useState({
    typeFacturation: 'rapide',
    formatElectronique: 'complet',
    adresseLivraison: false,
    siretClient: false,
    tvaIntracommunautaire: false,
    conditionsAcceptation: true,
    intituleDocument: false,
    champLibre: false,
    remiseGlobale: false
  })

  // Delivery address state
  const [adresseLivraison, setAdresseLivraison] = useState({
    adresse: '',
    complementAdresse: '',
    codePostal: '',
    ville: '',
    pays: 'France'
  })

  // Document title state
  const [intituleDocument, setIntituleDocument] = useState('')

  // Global discount state
  const [remiseGlobale, setRemiseGlobale] = useState({
    pourcentage: 0,
    montant: 0
  })

  // Manual client info state (like delivery address)
  const [clientSiret, setClientSiret] = useState('')
  const [clientNumeroTVA, setClientNumeroTVA] = useState('')

  // Pre-populate SIRET and TVA when client is selected or options change
  useEffect(() => {
    if (selectedClient && options.siretClient && !clientSiret) {
      setClientSiret(selectedClient.siret || '')
    }
  }, [selectedClient, options.siretClient])

  useEffect(() => {
    if (selectedClient && options.tvaIntracommunautaire && !clientNumeroTVA) {
      setClientNumeroTVA(selectedClient.numeroTVA || '')
    }
  }, [selectedClient, options.tvaIntracommunautaire])

  // Filtered clients for dropdown
  const filteredClients = clients.filter(client =>
    client.nom.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.prenom.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.email.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.nomEntreprise.toLowerCase().includes(clientSearch.toLowerCase())
  )

  // Calculate totals
  const calculateTotals = () => {
    const sousTotal = lignes.reduce((sum, ligne) => sum + ligne.montantHT, 0)
    const remiseHT = options.remiseGlobale ? (sousTotal * remiseGlobale.pourcentage / 100) : 0
    const totalHT = sousTotal - remiseHT
    const totalTVA = lignes.reduce((sum, ligne) => {
      const ligneHT = ligne.montantHT
      return sum + (ligneHT * ligne.tauxTVA / 100)
    }, 0) - (remiseHT * 0.2) // Apply discount to TVA as well
    const totalTTC = totalHT + totalTVA
    return { sousTotal, remiseHT, totalHT, totalTVA, totalTTC }
  }

  const { sousTotal, remiseHT, totalHT, totalTVA, totalTTC } = calculateTotals()
  
  // Vérifier si toutes les TVA sont à 0%
  const allTVAZero = lignes.every(ligne => ligne.tauxTVA === 0)

  // Update line amount when quantity, price or discount changes
  const updateLigne = (id: string, field: keyof DevisLine, value: any) => {
    setLignes(prev => prev.map(ligne => {
      if (ligne.id === id) {
        const updated = { ...ligne, [field]: value }
        if (options.typeFacturation === 'rapide') {
          // En mode rapide, le montant HT est directement le prix unitaire
          if (field === 'prixUnitaireHT') {
            updated.montantHT = value
            updated.quantite = 1 // Toujours 1 en mode rapide
            updated.remise = 0 // Pas de remise en mode rapide
          }
        } else {
          // En mode complet, calcul normal
          if (field === 'quantite' || field === 'prixUnitaireHT' || field === 'remise') {
            const montantBrut = updated.quantite * updated.prixUnitaireHT
            updated.montantHT = montantBrut - (montantBrut * updated.remise / 100)
          }
        }
        return updated
      }
      return ligne
    }))
  }

  const addLigne = () => {
    const newLigne: DevisLine = {
      id: `ligne-${Date.now()}`,
      designation: '',
      quantite: 1,
      unite: '',
      prixUnitaireHT: 0,
      remise: 0,
      montantHT: 0,
      tauxTVA: 0,
      typePrestation: 'Presta',
      isDesignationOnly: false
    }
    setLignes(prev => [...prev, newLigne])
  }

  const addLignePrestation = () => {
    const newLigne: DevisLine = {
      id: `prestation-${Date.now()}`,
      designation: 'Prestation type',
      quantite: 1,
      unite: 'heure',
      prixUnitaireHT: 0,
      remise: 0,
      montantHT: 0,
      tauxTVA: 20,
      typePrestation: 'Presta',
      isDesignationOnly: false
    }
    setLignes(prev => [...prev, newLigne])
  }

  const addLigneDesignation = () => {
    const newLigne: DevisLine = {
      id: `designation-${Date.now()}`,
      designation: '',
      quantite: 0,
      unite: '',
      prixUnitaireHT: 0,
      remise: 0,
      montantHT: 0,
      tauxTVA: 0,
      typePrestation: 'Presta',
      isDesignationOnly: true
    }
    setLignes(prev => [...prev, newLigne])
  }

  const removeLigne = (id: string) => {
    if (lignes.length > 1) {
      setLignes(prev => prev.filter(ligne => ligne.id !== id))
    }
  }

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client)
    setClientSearch(`${client.nom} ${client.prenom}`)
    setShowClientDropdown(false)
  }

  const handleCreateClient = () => {
    setShowClientDropdown(false)
    setIsClientDrawerOpen(true)
  }

  // Créer un brouillon initial (sans numéro de devis)
  const creerBrouillon = async () => {
    console.log('=== DÉBUT CRÉATION BROUILLON ===')
    console.log('clientData:', clientData)
    console.log('user:', user)
    
    if (!user?.uid) {
      console.error('❌ Pas d\'utilisateur connecté')
      toast.error('Utilisateur non connecté')
      return
    }

    try {
      console.log('🔍 Recherche du client principal pour UID:', user.uid)
      
      // Find main client document
      const clientsRef = collection(db, 'clients')
      const clientsSnapshot = await getDocs(query(clientsRef, where('uidclient', '==', user.uid)))
      
      console.log('📊 Nombre de clients trouvés:', clientsSnapshot.size)
      
      if (clientsSnapshot.empty) {
        console.error('❌ Aucun client principal trouvé pour UID:', user.uid)
        toast.error('Erreur: profil client non trouvé')
        return
      }

      const mainClientDoc = clientsSnapshot.docs[0]
      console.log('✅ Client principal trouvé:', mainClientDoc.id)
      console.log('📄 Données client:', mainClientDoc.data())
      
      // Generate automatic numero devis
      let numeroDevis = ''
      try {
        numeroDevis = await genererProchainNumero(user.uid, 'devis')
        console.log('✅ Numéro de devis généré automatiquement:', numeroDevis)
      } catch (error) {
        console.error('❌ Erreur lors de la génération du numéro:', error)
        // Continue without numero if generation fails
      }

      // Créer un brouillon avec numéro de devis automatique
      const brouillonData = {
        dateCreation: serverTimestamp(),
        dateValidite: new Date(devisData.dateValidite || new Date()),
        validiteDuree: devisData.validiteDuree,
        validiteTexte: devisData.validiteTexte || '',
        clientId: selectedClient?.id || null,
        clientNom: selectedClient ? (selectedClient.typeClient === 'entreprise' ? selectedClient.nomEntreprise : `${selectedClient.nom} ${selectedClient.prenom}`) : '',
        clientEmail: selectedClient?.email || '',
        clientSiret: options.siretClient ? clientSiret : (selectedClient?.siret || ''),
        clientNumeroTVA: options.tvaIntracommunautaire ? clientNumeroTVA : (selectedClient?.numeroTVA || ''),
        clientCodeAPE: selectedClient?.codeAPE || '',
        numeroDevis: numeroDevis,
        lignes: lignes || [],
        montantTotalHT: totalHT || 0,
        montantTotalTVA: totalTVA || 0,
        montantTotalTTC: totalTTC || 0,
        status: 'brouillon',
        type: 'devis',
        conditions: devisData.conditions || '',
        notes: devisData.notes || '',
        options: options,
        adresseLivraison: options.adresseLivraison ? adresseLivraison : null,
        intituleDocument: options.intituleDocument ? intituleDocument : null,
        remiseGlobale: options.remiseGlobale ? remiseGlobale : null,
        uidclient: user.uid,
        mainClientId: mainClientDoc.id,
        lastModified: serverTimestamp()
      }

      console.log('📝 Données du brouillon à créer:', brouillonData)
      console.log('👤 Client sélectionné:', selectedClient)
      console.log('🏢 SIRET client:', selectedClient?.siret)
      console.log('💼 TVA client:', selectedClient?.numeroTVA)
      console.log('🎯 Chemin de la collection:', `clients/${mainClientDoc.id}/devis`)
      
      const devisRef = collection(db, `clients/${mainClientDoc.id}/devis`)
      console.log('📁 Référence collection créée')
      
      const docRef = await addDoc(devisRef, brouillonData)
      
      console.log('🎉 SUCCÈS! Brouillon créé avec ID:', docRef.id)
      setBrouillonId(docRef.id)
      toast.success(`Brouillon créé: ${docRef.id}`)
      
    } catch (error: any) {
      console.error('💥 ERREUR COMPLÈTE:', error)
      console.error('Type d\'erreur:', error.constructor?.name)
      console.error('Message:', error.message)
      console.error('Code:', error.code)
      toast.error(`Erreur: ${error.message || 'Erreur inconnue'}`)
    }
    
    console.log('=== FIN CRÉATION BROUILLON ===')
  }

  // Sauvegarder les modifications du devis
  const sauvegarderDevis = async () => {
    if (!user?.uid || !params.id) {
      toast.error('Utilisateur non connecté ou devis non trouvé')
      return
    }

    setIsAutoSaving(true)
    try {
      console.log('Sauvegarde des modifications du devis:', params.id)
      
      const devisDataToSave = {
        dateCreation: devisData.dateCreation ? new Date(devisData.dateCreation) : serverTimestamp(),
        dateValidite: devisData.dateValidite ? new Date(devisData.dateValidite) : new Date(),
        validiteDuree: devisData.validiteDuree,
        validiteTexte: devisData.validiteTexte,
        clientId: selectedClient?.id || null,
        clientNom: selectedClient ? (selectedClient.typeClient === 'entreprise' ? selectedClient.nomEntreprise : `${selectedClient.nom} ${selectedClient.prenom}`) : '',
        clientEmail: selectedClient?.email || '',
        clientSiret: options.siretClient ? clientSiret : (selectedClient?.siret || ''),
        clientNumeroTVA: options.tvaIntracommunautaire ? clientNumeroTVA : (selectedClient?.numeroTVA || ''),
        clientCodeAPE: selectedClient?.codeAPE || '',
        numeroDevis: devisData.numeroDevis,
        lignes: lignes.map(ligne => ({
          id: ligne.id,
          designation: ligne.designation,
          quantite: ligne.quantite,
          unite: ligne.unite,
          prixUnitaireHT: ligne.prixUnitaireHT,
          remise: ligne.remise,
          montantHT: ligne.montantHT,
          tauxTVA: ligne.tauxTVA,
          typePrestation: ligne.typePrestation,
          isDesignationOnly: ligne.isDesignationOnly
        })),
        montantTotalHT: totalHT,
        montantTotalTVA: totalTVA,
        montantTotalTTC: totalTTC,
        conditions: devisData.conditions,
        notes: devisData.notes,
        options: options,
        adresseLivraison: options.adresseLivraison ? adresseLivraison : null,
        intituleDocument: options.intituleDocument ? intituleDocument : null,
        remiseGlobale: options.remiseGlobale ? remiseGlobale : null,
        lastModified: serverTimestamp()
      }

      console.log('Données à sauvegarder:', devisDataToSave)

      // Find main client document
      const clientsRef = collection(db, 'clients')
      const clientsSnapshot = await getDocs(query(clientsRef, where('uidclient', '==', user.uid)))
      
      if (!clientsSnapshot.empty) {
        const mainClientDoc = clientsSnapshot.docs[0]
        const devisRef = doc(db, `clients/${mainClientDoc.id}/devis`, params.id as string)
        await updateDoc(devisRef, devisDataToSave)
        console.log('Devis sauvegardé avec succès')
        toast.success('Modifications sauvegardées avec succès')
      } else {
        console.error('Client principal non trouvé pour la sauvegarde')
        toast.error('Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      toast.error('Erreur lors de la sauvegarde des modifications')
    } finally {
      setIsAutoSaving(false)
    }
  }

  // Sauvegarder manuellement le brouillon
  const sauvegarderBrouillon = async () => {
    if (!user?.uid) {
      toast.error('Utilisateur non connecté')
      return
    }

    if (!brouillonId) {
      // Créer un nouveau brouillon
      await creerBrouillon()
      return
    }

    setIsAutoSaving(true)
    try {
      console.log('Sauvegarde manuelle du brouillon:', brouillonId)
      
      // Generate numero devis if not already present
      let numeroDevis = devisData.numeroDevis
      if (!numeroDevis && user?.uid) {
        try {
          numeroDevis = await genererProchainNumero(user.uid, 'devis')
          console.log('Numéro de devis généré:', numeroDevis)
        } catch (error) {
          console.error('Erreur lors de la génération du numéro:', error)
          // Continue without numero if generation fails
        }
      }
      
      const brouillonData = {
        dateCreation: devisData.dateCreation,
        dateValidite: new Date(devisData.dateValidite),
        validiteDuree: devisData.validiteDuree,
        validiteTexte: devisData.validiteTexte,
        clientId: selectedClient?.id || null,
        clientNom: selectedClient ? (selectedClient.typeClient === 'entreprise' ? selectedClient.nomEntreprise : `${selectedClient.nom} ${selectedClient.prenom}`) : '',
        clientEmail: selectedClient?.email || '',
        clientSiret: options.siretClient ? clientSiret : (selectedClient?.siret || ''),
        clientNumeroTVA: options.tvaIntracommunautaire ? clientNumeroTVA : (selectedClient?.numeroTVA || ''),
        clientCodeAPE: selectedClient?.codeAPE || '',
        numeroDevis: numeroDevis,
        status: 'brouillon',
        type: 'devis',
        lignes: lignes.map(ligne => ({
          id: ligne.id,
          designation: ligne.designation,
          quantite: ligne.quantite,
          unite: ligne.unite,
          prixUnitaireHT: ligne.prixUnitaireHT,
          remise: ligne.remise,
          montantHT: ligne.montantHT,
          tauxTVA: ligne.tauxTVA,
          typePrestation: ligne.typePrestation,
          isDesignationOnly: ligne.isDesignationOnly
        })),
        montantTotalHT: totalHT,
        montantTotalTVA: totalTVA,
        montantTotalTTC: totalTTC,
        conditions: devisData.conditions,
        notes: devisData.notes,
        options: options,
        adresseLivraison: options.adresseLivraison ? adresseLivraison : null,
        intituleDocument: options.intituleDocument ? intituleDocument : null,
        remiseGlobale: options.remiseGlobale ? remiseGlobale : null,
        uidclient: user.uid,
        lastModified: serverTimestamp()
      }

      console.log('Données à sauvegarder:', brouillonData)
      console.log('👤 Client sélectionné pour sauvegarde:', selectedClient)
      console.log('🏢 SIRET client pour sauvegarde:', selectedClient?.siret)
      console.log('💼 TVA client pour sauvegarde:', selectedClient?.numeroTVA)

      // Find main client document
      const clientsRef = collection(db, 'clients')
      const clientsSnapshot = await getDocs(query(clientsRef, where('uidclient', '==', user.uid)))
      
      if (!clientsSnapshot.empty) {
        const mainClientDoc = clientsSnapshot.docs[0]
        const devisRef = doc(db, `clients/${mainClientDoc.id}/devis`, brouillonId)
        await updateDoc(devisRef, brouillonData)
        console.log('Brouillon sauvegardé avec succès')
        toast.success('Brouillon sauvegardé avec succès')
      } else {
        console.error('Client principal non trouvé pour la sauvegarde')
        toast.error('Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde manuelle:', error)
      toast.error('Erreur lors de la sauvegarde du brouillon')
    } finally {
      setIsAutoSaving(false)
    }
  }

  // Supprimer le brouillon
  const supprimerBrouillon = async () => {
    if (!brouillonId || !clientData?.id || !user?.uid) return

    try {
      const clientsRef = collection(db, 'clients')
      const clientsSnapshot = await getDocs(query(clientsRef, where('uidclient', '==', user.uid)))
      
      if (!clientsSnapshot.empty) {
        const mainClientDoc = clientsSnapshot.docs[0]
        const devisRef = doc(db, `clients/${mainClientDoc.id}/devis`, brouillonId)
        await deleteDoc(devisRef)
        setBrouillonId(null)
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du brouillon:', error)
    }
  }

  // Gérer la fermeture avec la croix
  const handleClose = () => {
    setShowExitModal(true)
  }

  // Confirmer la fermeture et conserver le brouillon
  const confirmerFermeture = () => {
    setShowExitModal(false)
    router.push('/dashboard/devis')
  }

  // Confirmer la fermeture et supprimer le brouillon
  const confirmerSuppressionEtFermeture = async () => {
    await supprimerBrouillon()
    setShowExitModal(false)
    router.push('/dashboard/devis')
  }

  const handleEdit = () => {
    router.push(`/dashboard/devis/${params.id}/modifier`)
  }

  const handleDuplicate = () => {
    // TODO: Implement duplicate functionality
    console.log('Duplicate devis:', params.id)
  }

  const handleDownloadPDF = async () => {
    try {
      // Sauvegarder les modifications avant de télécharger le PDF
      await sauvegarderDevis()
      
      const devisForPDF = {
        numeroDevis: devisData.numeroDevis || '',
        dateCreation: devisData.dateCreation || new Date().toISOString(),
        validiteTexte: devisData.validiteTexte || '30 jours',
        lignes: lignes.map(ligne => ({
          designation: ligne.designation,
          quantite: ligne.quantite,
          unite: ligne.unite || '',
          prixUnitaireHT: ligne.prixUnitaireHT,
          tauxTVA: ligne.tauxTVA,
          montantHT: ligne.montantHT
        })),
        montantTotalHT: totalHT,
        montantTotalTVA: totalTVA,
        montantTotalTTC: totalTTC,
        conditions: devisData.conditions,
        notes: devisData.notes,
        options: options,
        adresseLivraison: adresseLivraison,
        remiseGlobale: options.remiseGlobale ? remiseGlobale : undefined,
        sousTotal: options.remiseGlobale ? sousTotal : undefined,
        remiseHT: options.remiseGlobale ? remiseHT : undefined
      }

      const clientForPDF = {
        typeClient: (selectedClient?.typeClient || 'particulier') as 'particulier' | 'entreprise',
        nom: selectedClient?.nom,
        prenom: selectedClient?.prenom,
        nomEntreprise: selectedClient?.nomEntreprise,
        adresse: selectedClient?.adresse,
        complementAdresse: selectedClient?.complementAdresse,
        codePostal: selectedClient?.codePostal,
        ville: selectedClient?.ville,
        pays: 'France',
        siret: clientSiret,
        numeroTVA: clientNumeroTVA
      }

      const companyForPDF = {
        nom: clientData?.nomEntreprise || clientData?.nom || 'Mon Entreprise',
        formeJuridique: clientData?.formeJuridique,
        adresseSiege: {
          adresse: clientData?.adresseEntreprise || clientData?.adresse || '',
          codePostal: clientData?.codePostal || '',
          ville: clientData?.ville || ''
        },
        siret: clientData?.siret || '',
        numeroTVA: clientData?.numeroTVA || '',
        codeAPE: clientData?.codeAPE || '',
        logo: clientData?.logoImage
      }

      await generateDevisPDF(devisForPDF, clientForPDF, companyForPDF)
      toast.success('PDF téléchargé avec succès')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Erreur lors de la génération du PDF')
    }
  }

  const handlePreviewPDF = async () => {
    try {
      // Sauvegarder les modifications avant de prévisualiser le PDF
      await sauvegarderDevis()
      
      // Generate PDF as blob for preview
      const devisForPDF = {
        numeroDevis: devisData.numeroDevis || '',
        dateCreation: devisData.dateCreation || new Date().toISOString(),
        validiteTexte: devisData.validiteTexte || '30 jours',
        lignes: lignes.map(ligne => ({
          designation: ligne.designation,
          quantite: ligne.quantite,
          unite: ligne.unite || '',
          prixUnitaireHT: ligne.prixUnitaireHT,
          tauxTVA: ligne.tauxTVA,
          montantHT: ligne.montantHT
        })),
        montantTotalHT: totalHT,
        montantTotalTVA: totalTVA,
        montantTotalTTC: totalTTC,
        conditions: devisData.conditions,
        notes: devisData.notes,
        options: options,
        adresseLivraison: adresseLivraison,
        remiseGlobale: options.remiseGlobale ? remiseGlobale : undefined,
        sousTotal: options.remiseGlobale ? sousTotal : undefined,
        remiseHT: options.remiseGlobale ? remiseHT : undefined
      }

      const clientForPDF = {
        typeClient: (selectedClient?.typeClient || 'particulier') as 'particulier' | 'entreprise',
        nom: selectedClient?.nom,
        prenom: selectedClient?.prenom,
        nomEntreprise: selectedClient?.nomEntreprise,
        adresse: selectedClient?.adresse,
        complementAdresse: selectedClient?.complementAdresse,
        codePostal: selectedClient?.codePostal,
        ville: selectedClient?.ville,
        pays: 'France',
        siret: clientSiret,
        numeroTVA: clientNumeroTVA
      }

      const companyForPDF = {
        nom: clientData?.nomEntreprise || clientData?.nom || 'Mon Entreprise',
        formeJuridique: clientData?.formeJuridique,
        adresseSiege: {
          adresse: clientData?.adresseEntreprise || clientData?.adresse || '',
          codePostal: clientData?.codePostal || '',
          ville: clientData?.ville || ''
        },
        siret: clientData?.siret || '',
        numeroTVA: clientData?.numeroTVA || '',
        codeAPE: clientData?.codeAPE || '',
        logo: clientData?.logoImage
      }

      await previewDevisPDF(devisForPDF, clientForPDF, companyForPDF)
      
      toast.success('PDF généré avec succès')
    } catch (error) {
      console.error('Error previewing PDF:', error)
      toast.error('Erreur lors de la prévisualisation du PDF')
    }
  }

  const handleDelete = async () => {
    if (!user || !params.id) return

    try {
      // Find main client document using uidclient
      const clientsQuery = query(
        collection(db, 'clients'),
        where('uidclient', '==', user.uid)
      )
      const clientsSnapshot = await getDocs(clientsQuery)
      
      if (clientsSnapshot.empty) {
        console.error('No client document found for user:', user.uid)
        return
      }

      const mainClientDoc = clientsSnapshot.docs[0]
      
      // Delete devis from subcollection
      await deleteDoc(doc(db, `clients/${mainClientDoc.id}/devis`, params.id as string))
      
      console.log('Devis deleted successfully')
      toast.success('Devis supprimé avec succès')
      router.push('/dashboard/devis')
    } catch (error) {
      console.error('Error deleting devis:', error)
      toast.error('Erreur lors de la suppression du devis')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <PulseLoader />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le devis</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce devis ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="relative bg-gray-50 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        {/* Gradient shadow underneath */}
        <div className="absolute -bottom-8 left-0 right-0 h-8 bg-gradient-to-b from-gray-50 to-transparent pointer-events-none z-10"></div>
        
        {/* Left: Back button + Title */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="cursor-pointer" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-medium text-gray-700">Devis {devisData.numeroDevis}</h1>
        </div>
        
        {/* Right: Action buttons */}
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handlePreviewPDF}>
            <Eye className="h-4 w-4 mr-2" />
            Aperçu PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Télécharger PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowOptions(!showOptions)}
            className="cursor-pointer"
          >
            <Settings className="w-4 h-4 mr-2" />
            Options
          </Button>
        </div>
      </div>

      <div className="flex justify-center p-8 pb-24">
        {/* A4 Document Container */}
        <div className="relative">
          {/* A4 Page */}
          <div className="w-[210mm] min-h-[297mm] bg-white shadow-lg p-8 space-y-6 flex flex-col" style={{width: '210mm', minHeight: '297mm'}}>
            
            {/* Company Info Section */}
            <div className="flex items-start justify-between mb-8">
              <div className="flex flex-col items-start gap-3">
                <div className="w-16 h-16 bg-gray-50 rounded border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-100">
                  {clientData?.logoImage ? (
                    <img src={clientData.logoImage} alt="Logo" className="w-full h-full object-contain rounded" />
                  ) : (
                    <Upload className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <div className="space-y-0.5">
                  {clientData?.formeJuridique && (
                    <div className="text-xs text-gray-500 uppercase font-medium">
                      {clientData.formeJuridique}
                    </div>
                  )}
                  <div className="font-medium text-base">
                    {clientData?.nomEntreprise || `Entreprise individuelle ${clientData?.prenom?.toUpperCase()} ${clientData?.nom?.toUpperCase()}`}
                  </div>
                  <div className="text-xs text-gray-600">
                    {clientData?.adresseEntreprise || clientData?.ville || '22 RUE DE L\'OURME'}
                  </div>
                  <div className="text-xs text-gray-600">
                    {clientData?.codePostal || '33100'} {clientData?.ville || 'BORDEAUX FR'}
                  </div>
                </div>

                {/* Delivery Address Section - Conditional */}
                {options.adresseLivraison && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Adresse de livraison</h4>
                    <div className="space-y-2 max-w-xs">
                      <Input
                        placeholder="Adresse"
                        value={adresseLivraison.adresse}
                        onChange={(e) => setAdresseLivraison(prev => ({ ...prev, adresse: e.target.value }))}
                        className="h-7 text-xs"
                      />
                      <Input
                        placeholder="Complément d'adresse"
                        value={adresseLivraison.complementAdresse}
                        onChange={(e) => setAdresseLivraison(prev => ({ ...prev, complementAdresse: e.target.value }))}
                        className="h-7 text-xs"
                      />
                      <div className="flex gap-2">
                        <Input
                          placeholder="Code postal"
                          value={adresseLivraison.codePostal}
                          onChange={(e) => setAdresseLivraison(prev => ({ ...prev, codePostal: e.target.value }))}
                          className="h-7 text-xs w-20"
                        />
                        <Input
                          placeholder="Ville"
                          value={adresseLivraison.ville}
                          onChange={(e) => setAdresseLivraison(prev => ({ ...prev, ville: e.target.value }))}
                          className="h-7 text-xs flex-1"
                        />
                      </div>
                      <Input
                        placeholder="Pays"
                        value={adresseLivraison.pays}
                        onChange={(e) => setAdresseLivraison(prev => ({ ...prev, pays: e.target.value }))}
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Client Info Section - Top Right */}
              <div className="space-y-2 mt-32 w-92">
                {selectedClient && (
                  <div className="text-right mb-1">
                    <span 
                      className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer flex items-center justify-end"
                      onClick={() => setIsClientDrawerOpen(true)}
                    >
                      Fiche client <ArrowRight className="w-4 h-4 ml-1" />
                    </span>
                  </div>
                )}
                <div className="relative">
                  <Input
                    placeholder="Nom du client"
                    value={clientSearch}
                    readOnly
                    className="h-8 text-sm pr-8 bg-gray-50"
                  />
                </div>
                <Input
                  placeholder="Adresse"
                  value={selectedClient?.adresse || ''}
                  readOnly
                  className="h-8 text-sm bg-gray-50"
                />
                <Input
                  placeholder="Complément d'adresse"
                  value={selectedClient?.complementAdresse || ''}
                  readOnly
                  className="h-8 text-sm bg-gray-50"
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="Code postal"
                    value={selectedClient?.codePostal || ''}
                    readOnly
                    className="h-8 text-sm flex-1 bg-gray-50"
                  />
                  <Input
                    placeholder="Ville"
                    value={selectedClient?.ville || ''}
                    readOnly
                    className="h-8 text-sm flex-2 bg-gray-50"
                  />
                </div>

                {/* SIREN/SIRET Field - Conditional */}
                {options.siretClient && (
                  <div className="mt-3">
                    <Label className="text-xs font-medium text-gray-700">SIRET</Label>
                    <Input
                      value={clientSiret}
                      readOnly
                      placeholder="12345678901234"
                      className="h-8 text-sm mt-1 bg-gray-50"
                    />
                  </div>
                )}

                {/* TVA Intracommunautaire Field - Conditional */}
                {options.tvaIntracommunautaire && (
                  <div className="mt-3">
                    <Label className="text-xs font-medium text-gray-700">TVA intracommunautaire</Label>
                    <Input
                      value={clientNumeroTVA}
                      readOnly
                      placeholder="FR12345678901"
                      className="h-8 text-sm mt-1 bg-gray-50"
                    />
                  </div>
                )}
              </div>
            </div>


            {/* Document Title - Conditional */}
            {options.intituleDocument && (
              <div className="mt-8 mb-6">
                <div className="text-start text-lg font-bold px-2 py-1">
                  {intituleDocument || 'DEVIS'}
                </div>
              </div>
            )}

            {/* Devis Details */}
            <div className="grid grid-cols-3 gap-4 mt-2">
              <div>
                <Label className="text-xs font-medium text-gray-700">N° de devis</Label>
                <Input 
                  value={devisData.numeroDevis || 'Non généré'}
                  readOnly 
                  className="mt-1 h-8 text-sm bg-gray-50 text-gray-500" 
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-700">Date d'émission</Label>
                <Input 
                  type="date" 
                  value={devisData.dateCreation}
                  readOnly
                  className="mt-1 h-8 text-sm bg-gray-50"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-700">Période de validité</Label>
                <div className="flex items-center mt-1">
                  <Input 
                    value={devisData.validiteTexte}
                    readOnly
                    className="h-8 text-sm flex-1 bg-gray-50"
                    placeholder="60 jours"
                  />
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-3">
              {/* En-têtes selon le type de facturation */}
              {/* {options.typeFacturation === 'rapide' ? (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="bg-blue-100 text-blue-700 border-blue-200 h-7 text-xs">
                    Désignation
                  </Button>
                  <Button variant="outline" size="sm" className="bg-blue-100 text-blue-700 border-blue-200 h-7 text-xs">
                    TVA
                  </Button>
                  <Button variant="outline" size="sm" className="bg-blue-100 text-blue-700 border-blue-200 h-7 text-xs">
                    Montant HT
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="bg-blue-100 text-blue-700 border-blue-200 h-7 text-xs">
                    Désignation
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    TVA
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    Montant HT
                  </Button>
                </div>
              )} */}

              {/* Tableau selon le type de facturation */}
              {options.typeFacturation === 'rapide' ? (
                <div className="relative">
                  <div className="border rounded-lg overflow-visible">
                    <table className="w-full">
                      <thead className="bg-blue-50">
                        <tr>
                          <th className="text-left p-2 font-medium text-gray-700 text-xs border-r border-gray-200">Désignation</th>
                          <th className="text-center p-2 font-medium text-gray-700 w-16 text-xs border-r border-gray-200">TVA</th>
                          <th className="text-center p-2 font-medium text-gray-700 w-20 text-xs">Montant HT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lignes.map((ligne, index) => (
                          <tr key={ligne.id} className={`border-t ${ligne.isDesignationOnly ? 'bg-gray-50' : ''} group hover:bg-gray-50 relative`}>
                          {ligne.isDesignationOnly ? (
                            <td className="p-2 relative" colSpan={3}>
                              <Input
                                placeholder="Description / Titre de section"
                                value={ligne.designation}
                                onChange={(e) => updateLigne(ligne.id, 'designation', e.target.value)}
                                className="border-0 shadow-none p-0 h-auto focus-visible:ring-0 text-xs font-medium text-gray-700 bg-transparent"
                              />
                              {lignes.length > 1 && (
                                <button
                                  onClick={() => removeLigne(ligne.id)}
                                  className="absolute -right-6 top-1/2 -translate-y-1/2 h-6 w-6 p-0 bg-white border border-gray-200 shadow-sm hover:bg-red-50 hover:border-red-200 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20"
                                >
                                  <Trash2 className="w-3 h-3 text-gray-500 hover:text-red-500" />
                                </button>
                              )}
                            </td>
                          ) : (
                            <>
                              <td className="p-2 border-r border-gray-200">
                                <Input
                                  placeholder="Désignation"
                                  value={ligne.designation}
                                  onChange={(e) => updateLigne(ligne.id, 'designation', e.target.value)}
                                  className="border-0 shadow-none p-0 h-auto focus-visible:ring-0 text-xs"
                                />
                              </td>
                              <td className="p-2 border-r border-gray-200">
                                <Select value={ligne.tauxTVA.toString()} onValueChange={(value) => updateLigne(ligne.id, 'tauxTVA', parseFloat(value))}>
                                  <SelectTrigger className="w-16 h-6 text-xs border-0 shadow-none p-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="0">0 %</SelectItem>
                                    <SelectItem value="2.1">2,1 %</SelectItem>
                                    <SelectItem value="5.5">5,5 %</SelectItem>
                                    <SelectItem value="8.5">8,5 %</SelectItem>
                                    <SelectItem value="10">10 %</SelectItem>
                                    <SelectItem value="20">20 %</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="p-2 relative">
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  value={ligne.prixUnitaireHT === 0 ? '' : ligne.prixUnitaireHT.toString()}
                                  onChange={(e) => {
                                    const value = e.target.value
                                    if (/^[0-9.,]*$/.test(value)) {
                                      const numValue = value === '' ? 0 : parseFloat(value.replace(',', '.')) || 0
                                      updateLigne(ligne.id, 'prixUnitaireHT', numValue)
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                      e.preventDefault()
                                    }
                                  }}
                                  className="border-0 shadow-none p-0 h-auto focus-visible:ring-0 text-right text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <div className="absolute -right-6 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                                  <button
                                    onClick={() => {
                                      setEditingLineId(ligne.id)
                                      setIsPrestationsListOpen(true)
                                    }}
                                    className="h-6 w-6 p-0 bg-white border border-gray-200 shadow-sm hover:bg-blue-50 hover:border-blue-200 rounded flex items-center justify-center"
                                    title="Choisir une prestation type"
                                  >
                                    <MoreHorizontal className="w-3 h-3 text-gray-500 hover:text-blue-500" />
                                  </button>
                                  {lignes.length > 1 && (
                                    <button
                                      onClick={() => removeLigne(ligne.id)}
                                      className="h-6 w-6 p-0 bg-white border border-gray-200 shadow-sm hover:bg-red-50 hover:border-red-200 rounded flex items-center justify-center"
                                      title="Supprimer la ligne"
                                    >
                                      <Trash2 className="w-3 h-3 text-gray-500 hover:text-red-500" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                        ))}
                        
                        {/* Global discount line for rapide mode */}
                        {options.remiseGlobale && (
                          <tr className="border-t-2 border-gray-300 bg-blue-50">
                            <td className="p-2 border-r border-gray-200 font-medium text-sm">
                              Remise globale
                            </td>
                            <td className="p-2 border-r border-gray-200 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  value={remiseGlobale.pourcentage === 0 ? '' : remiseGlobale.pourcentage.toString()}
                                  onChange={(e) => {
                                    const value = e.target.value
                                    if (/^[0-9.,]*$/.test(value)) {
                                      const numValue = value === '' ? 0 : parseFloat(value.replace(',', '.')) || 0
                                      if (numValue <= 100) {
                                        setRemiseGlobale(prev => ({
                                          ...prev,
                                          pourcentage: numValue
                                        }))
                                      }
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                      e.preventDefault()
                                    }
                                  }}
                                  className="w-12 h-6 text-xs text-center border-0 shadow-none p-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  placeholder="0"
                                />
                                <span className="text-xs text-gray-500">%</span>
                              </div>
                            </td>
                            <td className="p-2 text-center text-sm font-medium">
                              -{remiseHT.toFixed(2)}
                            </td>
                          </tr>
                        )}
                    </tbody>
                  </table>
                </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="border rounded-lg overflow-visible">
                    <table className="w-full">
                      <thead className="bg-blue-50">
                        <tr>
                          <th className="text-left p-2 font-medium text-gray-700 text-xs border-r border-gray-200">Désignation</th>
                          <th className="text-center p-2 font-medium text-gray-700 w-16 text-xs border-r border-gray-200">Quantité</th>
                          <th className="text-center p-2 font-medium text-gray-700 w-16 text-xs border-r border-gray-200">Unité</th>
                          <th className="text-center p-2 font-medium text-gray-700 w-20 text-xs border-r border-gray-200">Prix unitaire</th>
                          <th className="text-center p-2 font-medium text-gray-700 w-16 text-xs border-r border-gray-200">TVA</th>
                          <th className="text-center p-2 font-medium text-gray-700 w-20 text-xs">Montant HT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lignes.map((ligne, index) => (
                          <tr key={ligne.id} className={`border-t ${ligne.isDesignationOnly ? 'bg-gray-50' : ''} group hover:bg-gray-50 relative`}>
                          {ligne.isDesignationOnly ? (
                            <td className="p-2 border-r border-gray-200 relative" colSpan={6}>
                              <Input
                                placeholder="Description / Titre de section"
                                value={ligne.designation}
                                onChange={(e) => updateLigne(ligne.id, 'designation', e.target.value)}
                                className="border-0 shadow-none p-0 h-auto focus-visible:ring-0 text-xs font-medium text-gray-700 bg-transparent"
                              />
                              {lignes.length > 1 && (
                                <button
                                  onClick={() => removeLigne(ligne.id)}
                                  className="absolute -right-6 top-1/2 -translate-y-1/2 h-6 w-6 p-0 bg-white border border-gray-200 shadow-sm hover:bg-red-50 hover:border-red-200 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20"
                                >
                                  <Trash2 className="w-3 h-3 text-gray-500 hover:text-red-500" />
                                </button>
                              )}
                            </td>
                          ) : (
                            <>
                              <td className="p-2 border-r border-gray-200">
                                <div className="flex gap-2 items-center">
                                  <Select key={`prestation-${ligne.id}`} value={ligne.typePrestation || 'Presta'} onValueChange={(value) => updateLigne(ligne.id, 'typePrestation', value)}>
                                    <SelectTrigger className="w-20 h-6 text-xs border-0 shadow-none p-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Presta">Presta</SelectItem>
                                      <SelectItem value="Biens">Biens</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <textarea
                                    placeholder="Désignation"
                                    value={ligne.designation}
                                    onChange={(e) => updateLigne(ligne.id, 'designation', e.target.value)}
                                    className="border-0 shadow-none p-0 h-auto focus-visible:ring-0 text-xs flex-1 resize-none overflow-hidden bg-transparent font-sans"
                                    rows={1}
                                    style={{
                                      minHeight: '1.5rem',
                                      height: 'auto',
                                      fontFamily: 'inherit',
                                      lineHeight: '1.5rem',
                                      verticalAlign: 'middle'
                                    }}
                                    onInput={(e) => {
                                      const target = e.target as HTMLTextAreaElement
                                      target.style.height = 'auto'
                                      target.style.height = target.scrollHeight + 'px'
                                    }}
                                  />
                                </div>
                              </td>
                              <td className="p-2 border-r border-gray-200">
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  value={ligne.quantite === 0 ? '' : ligne.quantite.toString()}
                                  onChange={(e) => {
                                    const value = e.target.value
                                    // Permettre seulement chiffres, +, -, et virgule
                                    if (/^[0-9+,\-]*$/.test(value)) {
                                      const numValue = value === '' ? 0 : parseFloat(value.replace(',', '.')) || 0
                                      updateLigne(ligne.id, 'quantite', numValue)
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    // Empêcher les flèches haut/bas
                                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                      e.preventDefault()
                                    }
                                  }}
                                  className="border-0 shadow-none p-0 h-auto focus-visible:ring-0 text-center text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </td>
                              <td className="p-2 border-r border-gray-200">
                                <Select key={`unite-${ligne.id}`} value={ligne.unite || ''} onValueChange={(value) => updateLigne(ligne.id, 'unite', value)}>
                                  <SelectTrigger className="w-16 h-6 text-xs border-0 shadow-none p-1">
                                    <SelectValue placeholder="Rechercher une unité..." />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-60">
                                    <SelectItem value="article">article</SelectItem>
                                    <SelectItem value="cm">cm</SelectItem>
                                    <SelectItem value="forfait">forfait</SelectItem>
                                    <SelectItem value="heure">heure</SelectItem>
                                    <SelectItem value="jour">jour</SelectItem>
                                    <SelectItem value="kg">kg</SelectItem>
                                    <SelectItem value="km">km</SelectItem>
                                    <SelectItem value="litre">litre</SelectItem>
                                    <SelectItem value="minute">minute</SelectItem>
                                    <SelectItem value="ml">ml</SelectItem>
                                    <SelectItem value="mois">mois</SelectItem>
                                    <SelectItem value="mot">mot</SelectItem>
                                    <SelectItem value="m²">m²</SelectItem>
                                    <SelectItem value="m³">m³</SelectItem>
                                    <SelectItem value="mètre">mètre</SelectItem>
                                    <SelectItem value="page">page</SelectItem>
                                    <SelectItem value="semaine">semaine</SelectItem>
                                    <SelectItem value="tonne">tonne</SelectItem>
                                    <SelectItem value="unité">unité</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="p-2 border-r border-gray-200">
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  value={ligne.prixUnitaireHT === 0 ? '' : ligne.prixUnitaireHT.toString()}
                                  onChange={(e) => {
                                    const value = e.target.value
                                    if (/^[0-9.,]*$/.test(value)) {
                                      const numValue = value === '' ? 0 : parseFloat(value.replace(',', '.')) || 0
                                      updateLigne(ligne.id, 'prixUnitaireHT', numValue)
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                      e.preventDefault()
                                    }
                                  }}
                                  className="border-0 shadow-none p-0 h-auto focus-visible:ring-0 text-center text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </td>
                              <td className="p-2 border-r border-gray-200">
                                <Select value={ligne.tauxTVA.toString()} onValueChange={(value) => updateLigne(ligne.id, 'tauxTVA', parseFloat(value))}>
                                  <SelectTrigger className="w-16 h-6 text-xs border-0 shadow-none p-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="0">0 %</SelectItem>
                                    <SelectItem value="2.1">2,1 %</SelectItem>
                                    <SelectItem value="5.5">5,5 %</SelectItem>
                                    <SelectItem value="8.5">8,5 %</SelectItem>
                                    <SelectItem value="10">10 %</SelectItem>
                                    <SelectItem value="20">20 %</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="p-2 relative">
                                <Input
                                  type="text"
                                  value={ligne.montantHT === 0 ? '' : ligne.montantHT.toString()}
                                  className="border-0 shadow-none p-0 h-auto focus-visible:ring-0 text-center text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  readOnly
                                />
                                <div className="absolute -right-6 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                                  <button
                                    onClick={() => {
                                      setEditingLineId(ligne.id)
                                      setIsPrestationsListOpen(true)
                                    }}
                                    className="h-6 w-6 p-0 bg-white border border-gray-200 shadow-sm hover:bg-blue-50 hover:border-blue-200 rounded flex items-center justify-center"
                                    title="Choisir une prestation type"
                                  >
                                    <MoreHorizontal className="w-3 h-3 text-gray-500 hover:text-blue-500" />
                                  </button>
                                  {lignes.length > 1 && (
                                    <button
                                      onClick={() => removeLigne(ligne.id)}
                                      className="h-6 w-6 p-0 bg-white border border-gray-200 shadow-sm hover:bg-red-50 hover:border-red-200 rounded flex items-center justify-center"
                                      title="Supprimer la ligne"
                                    >
                                      <Trash2 className="w-3 h-3 text-gray-500 hover:text-red-500" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                        ))}
                        
                        {/* Global discount line for complet mode */}
                        {options.remiseGlobale && (
                          <tr className="border-t-2 border-gray-300 bg-blue-50">
                            <td className="p-2 border-r border-gray-200 font-medium text-sm">
                              Remise globale
                            </td>
                            <td className="p-2 border-r border-gray-200"></td>
                            <td className="p-2 border-r border-gray-200"></td>
                            <td className="p-2 border-r border-gray-200"></td>
                            <td className="p-2 border-r border-gray-200 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  value={remiseGlobale.pourcentage === 0 ? '' : remiseGlobale.pourcentage.toString()}
                                  onChange={(e) => {
                                    const value = e.target.value
                                    if (/^[0-9.,]*$/.test(value)) {
                                      const numValue = value === '' ? 0 : parseFloat(value.replace(',', '.')) || 0
                                      if (numValue <= 100) {
                                        setRemiseGlobale(prev => ({
                                          ...prev,
                                          pourcentage: numValue
                                        }))
                                      }
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                      e.preventDefault()
                                    }
                                  }}
                                  className="w-12 h-6 text-xs text-center border-0 shadow-none p-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  placeholder="0"
                                />
                                <span className="text-xs text-gray-500">%</span>
                              </div>
                            </td>
                            <td className="p-2 text-center text-sm font-medium">
                              -{remiseHT.toFixed(2)}
                            </td>
                          </tr>
                        )}
                    </tbody>
                  </table>
                </div>
                </div>
              )}

              <div className="relative inline-flex items-center border border-green-200 rounded-md hover:border-green-300 bg-white">
                <div 
                  onClick={addLigne}
                  className="flex items-center px-3 py-2 text-green-600 hover:text-green-700 hover:bg-green-50 cursor-pointer rounded-l-md text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Ligne simple
                </div>
                <div className="w-px bg-green-300 h-6"></div>
                <div className="relative">
                  <Select value="" onValueChange={(value) => {
                    if (value === 'prestation') {
                      addLignePrestation()
                    } else if (value === 'designation') {
                      addLigneDesignation()
                    } else if (value === 'prestations-list') {
                      setIsPrestationsListOpen(true)
                    } else if (value === 'create-prestation') {
                      setIsPrestationDrawerOpen(true)
                    }
                  }}>
                    <SelectTrigger className="w-8 h-8 p-0 border-0 rounded-r-md hover:bg-green-50 focus:ring-0 opacity-0 absolute inset-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prestation">Ligne de prestation type</SelectItem>
                      <SelectItem value="designation">Ligne de désignation</SelectItem>
                      <SelectItem value="prestations-list">
                          Prestations types
                      </SelectItem>
                      <Separator className="my-1" />
                      <SelectItem value="create-prestation">
                        <div className="flex items-center text-blue-600">
                          <Plus className="w-4 h-4 mr-2" />
                          Créer une prestation type
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="w-8 h-8 rounded-r-md hover:bg-green-50 flex items-center justify-center pointer-events-none">
                    <ChevronDown className="w-3 h-3 text-green-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-2 text-right border-t pt-4">
              {options.remiseGlobale && remiseHT > 0 ? (
                <>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Sous-total HT</span>
                    <span className="font-medium">{sousTotal.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Remise HT</span>
                    <span className="font-medium">-{remiseHT.toFixed(2)} €</span>
                  </div>
                  <div className={`flex justify-between ${allTVAZero ? 'text-lg font-bold text-blue-600' : 'text-xs'}`}>
                    <span className={allTVAZero ? '' : 'text-gray-600'}>Total HT</span>
                    <span className={allTVAZero ? '' : 'font-medium'}>{totalHT.toFixed(2)} €</span>
                  </div>
                </>
              ) : (
                <div className={`flex justify-between ${allTVAZero ? 'text-lg font-bold text-blue-600' : 'text-xs'}`}>
                  <span className={allTVAZero ? '' : 'text-gray-600'}>Total HT</span>
                  <span className={allTVAZero ? '' : 'font-medium'}>{totalHT.toFixed(2)} €</span>
                </div>
              )}
              {!allTVAZero && (
                <>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">TVA</span>
                    <span className="font-medium">{totalTVA.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-blue-600 border-t pt-2">
                    <span>Total TTC</span>
                    <span>{totalTTC.toFixed(2)} €</span>
                  </div>
                </>
              )}
            </div>

            {/* Spacer to push footer to bottom */}
            <div className="flex-grow"></div>
            
            {/* Footer with legal text and company info */}
            <DevisFooter 
              showConditions={options.conditionsAcceptation} 
              showCompanyInfo={options.siretClient}
              showFreeField={options.champLibre}
              devisId={params.id as string}
              devisConditionsAcceptation={devisDataFromDB?.conditionsAcceptation}
              devisCustomCompanyInfo={devisDataFromDB?.customCompanyInfo}
              customConditionsText={devisDataFromDB?.conditionsAcceptation}
              onConditionsChange={(newConditions) => {
                // Sauvegarder directement dans Firebase dans clients/{idclient}/devis/{iddevis}/conditionsAcceptation
                console.log('💾 Sauvegarde conditions dans devis:', newConditions)
              }}
            />
          </div>
          
          {/* Options Card - Positioned at top right of A4 sheet */}
          <div className={`absolute top-0 -right-80 w-72 bg-white border rounded-lg shadow-lg p-4 space-y-4 z-10 transition-all duration-300 ease-in-out ${
            showOptions ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8 pointer-events-none'
          }`}>
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-4 h-4" />
              <h3 className="font-medium">Options</h3>
            </div>

            {/* Type de facturation */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-blue-600">Type de facturation</Label>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <input 
                    type="radio" 
                    id="rapide" 
                    name="typeFacturation" 
                    checked={options.typeFacturation === 'rapide'} 
                    onChange={() => setOptions(prev => ({ ...prev, typeFacturation: 'rapide' }))}
                    className="w-3 h-3" 
                  />
                  <Label htmlFor="rapide" className="text-xs">Rapide</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="radio" 
                    id="complet" 
                    name="typeFacturation" 
                    checked={options.typeFacturation === 'complet'}
                    onChange={() => setOptions(prev => ({ ...prev, typeFacturation: 'complet' }))}
                    className="w-3 h-3" 
                  />
                  <Label htmlFor="complet" className="text-xs">Complet</Label>
                </div>
              </div>
            </div>

            {/* Client */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-blue-600">Client</Label>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="adresseLivraison" 
                    checked={options.adresseLivraison}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, adresseLivraison: checked as boolean }))}
                    className="w-3 h-3" 
                  />
                  <Label htmlFor="adresseLivraison" className="text-xs">Adresse de livraison</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="siretClient" 
                    checked={options.siretClient}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, siretClient: checked as boolean }))}
                    className="w-3 h-3" 
                  />
                  <Label htmlFor="siretClient" className="text-xs">SIRET du client</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="tvaIntra" 
                    checked={options.tvaIntracommunautaire}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, tvaIntracommunautaire: checked as boolean }))}
                    className="w-3 h-3" 
                  />
                  <Label htmlFor="tvaIntra" className="text-xs">N° de TVA intracommunautaire</Label>
                </div>
              </div>
            </div>


            {/* Info complémentaires */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-blue-600">Info complémentaires</Label>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="conditionsAcceptation" 
                    checked={options.conditionsAcceptation} 
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, conditionsAcceptation: checked as boolean }))}
                    className="w-3 h-3" 
                  />
                  <Label htmlFor="conditionsAcceptation" className="text-xs">Conditions d'acceptation</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="intituleDocument" 
                    checked={options.intituleDocument}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, intituleDocument: checked as boolean }))}
                    className="w-3 h-3" 
                  />
                  <Label htmlFor="intituleDocument" className="text-xs">Intitulé du document</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="champLibre" 
                    checked={options.champLibre}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, champLibre: checked as boolean }))}
                    className="w-3 h-3" 
                  />
                  <Label htmlFor="champLibre" className="text-xs">Champ libre</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="remiseGlobale" 
                    checked={options.remiseGlobale}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, remiseGlobale: checked as boolean }))}
                    className="w-3 h-3" 
                  />
                  <Label htmlFor="remiseGlobale" className="text-xs">Remise globale</Label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      <ClientDrawer 
        open={isClientDrawerOpen} 
        onOpenChange={setIsClientDrawerOpen}
        editingClient={selectedClient}
      />

      <PrestationDrawer 
        open={isPrestationDrawerOpen} 
        onOpenChange={setIsPrestationDrawerOpen}
      />

      <PrestationsListDrawer 
        open={isPrestationsListOpen} 
        onOpenChange={setIsPrestationsListOpen}
        onSelectPrestation={(prestation) => {
          if (editingLineId) {
            // Remplacer la ligne existante
            setLignes(prev => prev.map(ligne => 
              ligne.id === editingLineId 
                ? {
                    ...ligne,
                    designation: prestation.designation,
                    unite: prestation.unite,
                    prixUnitaireHT: prestation.prixUnitaire,
                    montantHT: prestation.prixUnitaire * ligne.quantite,
                    tauxTVA: prestation.tauxTVA,
                    typePrestation: prestation.type === 'prestation' ? 'Presta' : 'Biens'
                  }
                : ligne
            ))
            setEditingLineId(null)
          } else {
            // Ajouter la prestation sélectionnée comme nouvelle ligne
            const newLine: DevisLine = {
              id: Date.now().toString(),
              designation: prestation.designation,
              quantite: 1,
              unite: prestation.unite,
              prixUnitaireHT: prestation.prixUnitaire,
              remise: 0,
              montantHT: prestation.prixUnitaire,
              tauxTVA: prestation.tauxTVA,
              typePrestation: prestation.type === 'prestation' ? 'Presta' : 'Biens',
              isDesignationOnly: false
            }
            setLignes(prev => [...prev, newLine])
          }
        }}
        onEditPrestation={(prestation) => {
          setIsPrestationsListOpen(false)
          // Ouvrir le PrestationDrawer en mode édition
          setIsPrestationDrawerOpen(true)
        }}
      />

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-transparent p-4 flex justify-center z-30">
        <Button 
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 cursor-pointer shadow-lg"
          onClick={sauvegarderDevis}
          size="lg"
          disabled={isAutoSaving}
        >
          <FileText className="w-4 h-4 mr-2" />
          {isAutoSaving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
        </Button>
      </div>

    </div>
  )
}

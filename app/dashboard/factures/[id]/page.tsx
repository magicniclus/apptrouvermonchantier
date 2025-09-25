'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { X, Upload, Plus, Trash2, Settings, FileText, Calendar, ArrowRight, ArrowLeft, ChevronDown, MoreHorizontal, Edit, Copy, Download, Eye, Receipt } from 'lucide-react'
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

interface FactureLine {
  id: string
  designation: string
  description?: string
  quantite: number
  unite?: string
  prixUnitaireHT: number
  remise: number
  montantHT: number
  tauxTVA: number
  typePrestation?: string
  isDesignationOnly?: boolean
  isRemiseGlobale?: boolean
}

export default function FactureDetailPage() {
  const params = useParams()
  const { user, clientData } = useAuth()
  const { clients } = useClients()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [factureDataFromDB, setFactureDataFromDB] = useState<any>(null)
  
  // States - Read-only mode
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isClientDrawerOpen, setIsClientDrawerOpen] = useState(false)
  const [isPrestationDrawerOpen, setIsPrestationDrawerOpen] = useState(false)
  const [isPrestationsListOpen, setIsPrestationsListOpen] = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [showOptions, setShowOptions] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showConfirmFactureDialog, setShowConfirmFactureDialog] = useState(false)
  
  // Facture data
  const [factureData, setFactureData] = useState({
    numeroFacture: '', // Sera généré automatiquement
    dateCreation: '',
    dateEcheance: '',
    echeanceDuree: 30,
    conditions: '',
    notes: '',
    echeanceTexte: '30 jours', // Texte personnalisable pour l'échéance
    conditionsAcceptation: '',
    champLibre: '',
    motifExonerationTVA: 'aucun'
  })
  
  // État pour le numéro de facture généré
  const [numeroFacture, setNumeroFacture] = useState<string>('')
  const [isGeneratingNumber, setIsGeneratingNumber] = useState(false)
  const [brouillonId, setBrouillonId] = useState<string | null>(null)
  const [showExitModal, setShowExitModal] = useState(false)
  const [isAutoSaving, setIsAutoSaving] = useState(false)

  // Fetch facture data from Firebase
  useEffect(() => {
    if (!user || !params.id) return

    const fetchFacture = async () => {
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

        // Get facture from subcollection
        const factureDoc = await getDoc(doc(db, `clients/${mainClientDoc.id}/factures`, params.id as string))
        
        if (factureDoc.exists()) {
          const factureDataFromDB = factureDoc.data()
          setFactureDataFromDB(factureDataFromDB)
          console.log('Fetched devis data:', factureDataFromDB)
          
          // Populate form data from database
          setFactureData({
            numeroFacture: factureDataFromDB.numeroFacture || '',
            dateCreation: factureDataFromDB.dateCreation ? 
              (factureDataFromDB.dateCreation.toDate ? factureDataFromDB.dateCreation.toDate().toISOString().split('T')[0] : factureDataFromDB.dateCreation) : '',
            dateEcheance: factureDataFromDB.dateEcheance ? 
              (factureDataFromDB.dateEcheance.toDate ? factureDataFromDB.dateEcheance.toDate().toISOString().split('T')[0] : factureDataFromDB.dateEcheance) : '',
            echeanceDuree: factureDataFromDB.echeanceDuree || 30,
            conditions: factureDataFromDB.conditions || '',
            notes: factureDataFromDB.notes || '',
            echeanceTexte: factureDataFromDB.echeanceTexte || '30 jours',
            conditionsAcceptation: factureDataFromDB.conditionsAcceptation || '',
            champLibre: factureDataFromDB.champLibre || '',
            motifExonerationTVA: factureDataFromDB.motifExonerationTVA || 'aucun'
          })
          
          // Set lignes from database
          if (factureDataFromDB.lignes) {
            setLignes(factureDataFromDB.lignes)
          }
          
          // Set options from database and activate champLibre if data exists
          let updatedOptions = factureDataFromDB.options || {}
          
          // Activer automatiquement l'option champLibre si des données existent
          console.log('🔍 Checking champLibre data:', factureDataFromDB.champLibre)
          if (factureDataFromDB.champLibre && factureDataFromDB.champLibre.trim() !== '') {
            console.log('✅ Activating champLibre option because data exists:', factureDataFromDB.champLibre)
            updatedOptions = { ...updatedOptions, champLibre: true }
          } else {
            console.log('❌ No champLibre data found or empty')
          }
          
          setOptions(prev => ({ ...prev, ...updatedOptions }))
          
          // Set other fields
          if (factureDataFromDB.adresseLivraison) {
            setAdresseLivraison(factureDataFromDB.adresseLivraison)
          }
          
          if (factureDataFromDB.intituleDocument) {
            setIntituleDocument(factureDataFromDB.intituleDocument)
          }
          
          if (factureDataFromDB.remiseGlobale) {
            setRemiseGlobale(factureDataFromDB.remiseGlobale)
            // Activer automatiquement l'option si une remise existe
            if (factureDataFromDB.remiseGlobale.montant > 0) {
              console.log('✅ Activation automatique de l\'option remiseGlobale car remise détectée:', factureDataFromDB.remiseGlobale)
              updatedOptions = { ...updatedOptions, remiseGlobale: true }
            }
          }
          
          if (factureDataFromDB.clientSiret) {
            setClientSiret(factureDataFromDB.clientSiret)
          }
          
          if (factureDataFromDB.clientNumeroTVA) {
            setClientNumeroTVA(factureDataFromDB.clientNumeroTVA)
          }
          
          // Find and set selected client
          if (factureDataFromDB.clientId) {
            const client = clients.find(c => c.id === factureDataFromDB.clientId)
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

    fetchFacture()
  }, [user, params.id, clients])
  
  // Générer le numéro de devis  // Ne plus créer de brouillon automatiquement au chargement
  // Le brouillon sera créé uniquement lors de l'enregistrement
  
  // Line items
  const [lignes, setLignes] = useState<FactureLine[]>([
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
    const remiseHT = (options.remiseGlobale && remiseGlobale && remiseGlobale.pourcentage > 0) ? (sousTotal * remiseGlobale.pourcentage / 100) : 0
    const totalHT = sousTotal - remiseHT
    const totalTVA = lignes.reduce((sum, ligne) => {
      const ligneHT = ligne.montantHT
      return sum + (ligneHT * ligne.tauxTVA / 100)
    }, 0)
    const totalTTC = totalHT + totalTVA
    return { sousTotal, remiseHT, totalHT, totalTVA, totalTTC }
  }

  const { sousTotal, remiseHT, totalHT, totalTVA, totalTTC } = calculateTotals()
  
  // Vérifier si au moins une TVA est à 0%
  const anyTVAZero = lignes.some(ligne => ligne.tauxTVA === 0)

  // Fonction pour obtenir le texte d'exonération de TVA
  const getMotifExonerationText = (motif: string) => {
    switch (motif) {
      case 'aucun':
        return 'Aucun motif d\'exonération de TVA'
      case 'non_soumis':
        return 'TVA non applicable, art. 293 B du CGI'
      case 'france_sans_tva':
        return 'TVA non applicable'
      case 'hors_france':
        return 'Autoliquidation'
      default:
        return 'Aucun motif d\'exonération de TVA'
    }
  }

  // Update line amount when quantity, price or discount changes
  const updateLigne = (id: string, field: keyof FactureLine, value: any) => {
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
    const newLigne: FactureLine = {
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
    const newLigne: FactureLine = {
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
    const newLigne: FactureLine = {
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
      
      // Generate automatic numero facture
      let numeroFacture = ''
      try {
        numeroFacture = await genererProchainNumero(user.uid, 'factures')
        console.log('✅ Numéro de facture généré automatiquement:', numeroFacture)
      } catch (error) {
        console.error('❌ Erreur lors de la génération du numéro:', error)
        // Continue without numero if generation fails
      }

      // Créer un brouillon avec numéro de facture automatique
      const brouillonData = {
        dateCreation: serverTimestamp(),
        dateEcheance: new Date(factureData.dateEcheance || new Date()),
        echeanceDuree: factureData.echeanceDuree,
        echeanceTexte: factureData.echeanceTexte || '',
        clientId: selectedClient?.id || null,
        clientNom: selectedClient ? (selectedClient.typeClient === 'entreprise' ? selectedClient.nomEntreprise : `${selectedClient.nom} ${selectedClient.prenom}`) : '',
        clientEmail: selectedClient?.email || '',
        clientSiret: options.siretClient ? clientSiret : (selectedClient?.siret || ''),
        clientNumeroTVA: options.tvaIntracommunautaire ? clientNumeroTVA : (selectedClient?.numeroTVA || ''),
        clientCodeAPE: selectedClient?.codeAPE || '',
        numeroFacture: numeroFacture,
        lignes: lignes || [],
        montantTotalHT: totalHT || 0,
        montantTotalTVA: totalTVA || 0,
        montantTotalTTC: totalTTC || 0,
        status: 'brouillon',
        type: 'facture',
        conditions: factureData.conditions || '',
        notes: factureData.notes || '',
        options: {
          ...options,
          typeFacturation: options.typeFacturation as 'rapide' | 'complet',
          remiseGlobale: (remiseGlobale && remiseGlobale.montant > 0) || options.remiseGlobale
        },
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
      console.log('🎯 Chemin de la collection:', `clients/${mainClientDoc.id}/factures`)
      
      const devisRef = collection(db, `clients/${mainClientDoc.id}/factures`)
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

  // Validation des données avant sauvegarde
  const validerDonnees = () => {
    // Vérifier qu'un client est sélectionné
    if (!selectedClient) {
      return {
        valide: false,
        message: "Vous devez sélectionner un client pour enregistrer le devis."
      }
    }
    
    // Filtrer les lignes non-designation pour la validation
    const lignesNonDesignation = lignes.filter(ligne => !ligne.isDesignationOnly)
    
    // Vérifier qu'il y a au moins une prestation/produit
    if (lignesNonDesignation.length === 0) {
      return {
        valide: false,
        message: "Aucune prestation ou produit n'a été ajouté. Veuillez ajouter au moins un élément à votre devis."
      }
    }
    
    // Vérifier que toutes les lignes non-designation ont les champs obligatoires remplis
    for (const ligne of lignesNonDesignation) {
      if (!ligne.designation.trim()) {
        return {
          valide: false,
          message: "Une ou plusieurs lignes sont incomplètes. Veuillez remplir la désignation de toutes les prestations et produits."
        }
      }
      if (ligne.quantite <= 0) {
        return {
          valide: false,
          message: "Une ou plusieurs lignes sont incomplètes. La quantité doit être supérieure à 0 pour toutes les prestations et produits."
        }
      }
      if (ligne.prixUnitaireHT < 0) {
        return {
          valide: false,
          message: "Une ou plusieurs lignes sont incomplètes. Le prix unitaire ne peut pas être négatif."
        }
      }
    }
    
    return { valide: true, message: "" }
  }

  // Sauvegarder les modifications de la facture
  const sauvegarderFacture = async () => {
    if (!user?.uid || !params.id) {
      toast.error('Utilisateur non connecté ou facture non trouvée')
      return
    }

    // Valider les données avant sauvegarde
    const validation = validerDonnees()
    if (!validation.valide) {
      toast.error(validation.message, {
        style: {
          color: '#dc2626',
          fontWeight: 'bold'
        }
      })
      return
    }

    setIsAutoSaving(true)
    try {
      console.log('Sauvegarde des modifications de la facture:', params.id)
      
      // Préparer les données en évitant les valeurs undefined
      const factureDataToSave: any = {
        dateCreation: factureData.dateCreation ? new Date(factureData.dateCreation) : serverTimestamp(),
        dateEcheance: factureData.dateEcheance ? new Date(factureData.dateEcheance) : new Date(),
        echeanceDuree: factureData.echeanceDuree || 30,
        echeanceTexte: factureData.echeanceTexte || '30 jours',
        clientId: selectedClient?.id || null,
        clientNom: selectedClient ? (selectedClient.typeClient === 'entreprise' ? selectedClient.nomEntreprise : `${selectedClient.nom} ${selectedClient.prenom}`) : '',
        clientEmail: selectedClient?.email || '',
        clientSiret: options.siretClient ? (clientSiret || '') : (selectedClient?.siret || ''),
        clientNumeroTVA: options.tvaIntracommunautaire ? (clientNumeroTVA || '') : (selectedClient?.numeroTVA || ''),
        clientCodeAPE: selectedClient?.codeAPE || '',
        numeroFacture: factureData.numeroFacture || '',
        lignes: lignes.map(ligne => ({
          id: ligne.id || '',
          designation: ligne.designation || '',
          quantite: ligne.quantite || 0,
          unite: ligne.unite || '',
          prixUnitaireHT: ligne.prixUnitaireHT || 0,
          remise: ligne.remise || 0,
          montantHT: ligne.montantHT || 0,
          tauxTVA: ligne.tauxTVA || 0,
          typePrestation: ligne.typePrestation || '',
          isDesignationOnly: ligne.isDesignationOnly || false
        })),
        montantTotalHT: totalHT || 0,
        montantTotalTVA: totalTVA || 0,
        montantTotalTTC: totalTTC || 0,
        conditions: factureData.conditions || '',
        notes: factureData.notes || '',
        conditionsAcceptation: factureData.conditionsAcceptation || '',
        champLibre: typeof factureData.champLibre === 'string' ? factureData.champLibre : '',
        motifExonerationTVA: typeof factureData.motifExonerationTVA === 'string' ? factureData.motifExonerationTVA : 'aucun',
        options: {
          ...options,
          typeFacturation: options.typeFacturation as 'rapide' | 'complet',
          remiseGlobale: (remiseGlobale && remiseGlobale.montant > 0) || options.remiseGlobale
        },
        lastModified: serverTimestamp()
      }

      // Ajouter les champs optionnels seulement s'ils ne sont pas null/undefined
      if (options.adresseLivraison && adresseLivraison) {
        factureDataToSave.adresseLivraison = adresseLivraison
      }
      
      if (options.intituleDocument && intituleDocument) {
        factureDataToSave.intituleDocument = intituleDocument
      }
      
      if (options.remiseGlobale && remiseGlobale) {
        factureDataToSave.remiseGlobale = remiseGlobale
      }
      
      // Ajouter modifiePar seulement si user.uid existe
      if (user?.uid) {
        factureDataToSave.modifiePar = user.uid
      }

      console.log('Données à sauvegarder:', factureDataToSave)

      // Find main client document
      const clientsRef = collection(db, 'clients')
      const clientsSnapshot = await getDocs(query(clientsRef, where('uidclient', '==', user.uid)))
      
      if (!clientsSnapshot.empty) {
        const mainClientDoc = clientsSnapshot.docs[0]
        const devisRef = doc(db, `clients/${mainClientDoc.id}/factures`, params.id as string)
        await updateDoc(devisRef, factureDataToSave)
        console.log('Facture sauvegardée avec succès')
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
      
      // Generate numeroFacture if not already present
      let numeroFacture = factureData.numeroFacture
      if (!numeroFacture && user?.uid) {
        try {
          numeroFacture = await genererProchainNumero(user.uid, 'factures')
          console.log('Numéro de facture généré:', numeroFacture)
        } catch (error) {
          console.error('Erreur lors de la génération du numéro:', error)
          // Continue without numero if generation fails
        }
      }
      
      const brouillonData = {
        dateCreation: factureData.dateCreation,
        dateEcheance: new Date(factureData.dateEcheance),
        echeanceDuree: factureData.echeanceDuree,
        echeanceTexte: factureData.echeanceTexte,
        clientId: selectedClient?.id || null,
        clientNom: selectedClient ? (selectedClient.typeClient === 'entreprise' ? selectedClient.nomEntreprise : `${selectedClient.nom} ${selectedClient.prenom}`) : '',
        clientEmail: selectedClient?.email || '',
        clientSiret: options.siretClient ? clientSiret : (selectedClient?.siret || ''),
        clientNumeroTVA: options.tvaIntracommunautaire ? clientNumeroTVA : (selectedClient?.numeroTVA || ''),
        clientCodeAPE: selectedClient?.codeAPE || '',
        numeroFacture: numeroFacture,
        status: 'brouillon',
        type: 'facture',
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
        conditions: typeof factureData.conditions === 'string' ? factureData.conditions : '',
        notes: typeof factureData.notes === 'string' ? factureData.notes : '',
        conditionsAcceptation: factureData.conditionsAcceptation,
        champLibre: typeof factureData.champLibre === 'string' ? factureData.champLibre : '',
        motifExonerationTVA: typeof factureData.motifExonerationTVA === 'string' ? factureData.motifExonerationTVA : 'aucun',
        options: {
          ...options,
          typeFacturation: options.typeFacturation as 'rapide' | 'complet',
          remiseGlobale: (remiseGlobale && remiseGlobale.montant > 0) || options.remiseGlobale
        },
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
        const devisRef = doc(db, `clients/${mainClientDoc.id}/factures`, brouillonId)
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
        const devisRef = doc(db, `clients/${mainClientDoc.id}/factures`, brouillonId)
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

  const handlePreviewPDF = async () => {
    try {
      // Sauvegarder d'abord les modifications
      await sauvegarderFacture()
      
      // Préparer les données pour le PDF (format devis compatible)
      const devisForPDF = {
        numeroDevis: factureData.numeroFacture || '',
        numeroFacture: factureData.numeroFacture || '',
        dateCreation: factureData.dateCreation || new Date().toISOString(),
        validiteTexte: factureData.echeanceTexte || '30 jours',
        echeanceTexte: factureData.echeanceTexte || '30 jours',
        customCompanyInfo: typeof factureDataFromDB?.customCompanyInfo === 'string' 
          ? factureDataFromDB.customCompanyInfo 
          : '',
        intituleDocument: intituleDocument,
        lignes: lignes.map(ligne => ({
          ...ligne,
          unite: ligne.unite || "", // Ensure unite is always a string
          montantHT: ligne.montantHT || 0
        })),
        montantTotalHT: totalHT,
        montantTotalTVA: totalTVA,
        montantTotalTTC: totalTTC,
        conditions: typeof factureData.conditions === 'string' ? factureData.conditions : '',
        notes: typeof factureData.notes === 'string' ? factureData.notes : '',
        conditionsAcceptation: typeof factureDataFromDB?.conditionsAcceptation === 'string' ? factureDataFromDB.conditionsAcceptation : '',
        champLibre: typeof factureData.champLibre === 'string' ? factureData.champLibre : '',
        motifExonerationTVA: typeof factureData.motifExonerationTVA === 'string' ? factureData.motifExonerationTVA : 'aucun',
        options: {
          ...options,
          typeFacturation: options.typeFacturation as 'rapide' | 'complet'
        },
        adresseLivraison: adresseLivraison,
        remiseGlobale: remiseGlobale,
        sousTotal: sousTotal,
        remiseHT: remiseHT
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
      toast.success('Aperçu PDF généré avec succès')
    } catch (error) {
      console.error('Erreur lors de la prévisualisation PDF:', error)
      toast.error('Erreur lors de la génération de l\'aperçu PDF')
    }
  }

  const handleDownloadPDF = async () => {
    try {
      // Sauvegarder d'abord les modifications
      await sauvegarderFacture()
      
      // Préparer les données pour le PDF (format devis compatible)
      const devisForPDF = {
        numeroDevis: factureData.numeroFacture || '',
        numeroFacture: factureData.numeroFacture || '',
        dateCreation: factureData.dateCreation || new Date().toISOString(),
        validiteTexte: factureData.echeanceTexte || '30 jours',
        echeanceTexte: factureData.echeanceTexte || '30 jours',
        customCompanyInfo: typeof factureDataFromDB?.customCompanyInfo === 'string' 
          ? factureDataFromDB.customCompanyInfo 
          : '',
        intituleDocument: intituleDocument,
        lignes: lignes.map(ligne => ({
          ...ligne,
          unite: ligne.unite || "", // Ensure unite is always a string
          montantHT: ligne.montantHT || 0
        })),
        montantTotalHT: totalHT,
        montantTotalTVA: totalTVA,
        montantTotalTTC: totalTTC,
        conditions: typeof factureData.conditions === 'string' ? factureData.conditions : '',
        notes: typeof factureData.notes === 'string' ? factureData.notes : '',
        conditionsAcceptation: typeof factureDataFromDB?.conditionsAcceptation === 'string' ? factureDataFromDB.conditionsAcceptation : '',
        champLibre: typeof factureData.champLibre === 'string' ? factureData.champLibre : '',
        motifExonerationTVA: typeof factureData.motifExonerationTVA === 'string' ? factureData.motifExonerationTVA : 'aucun',
        options: {
          ...options,
          typeFacturation: options.typeFacturation as 'rapide' | 'complet'
        },
        adresseLivraison: adresseLivraison,
        remiseGlobale: remiseGlobale,
        sousTotal: sousTotal,
        remiseHT: remiseHT
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
      toast.success('PDF de la facture téléchargé avec succès !')
    } catch (error) {
      console.error('Erreur lors du téléchargement PDF:', error)
      toast.error('Erreur lors de la génération du PDF')
    }
  }

  const creerFactureDefinitive = async () => {
    try {
      if (!user || !params.id) {
        toast.error('Erreur: utilisateur non connecté ou ID manquant')
        return
      }

      setIsAutoSaving(true)
      
      // D'abord sauvegarder les modifications actuelles
      await sauvegarderFacture()
      
      // Ensuite changer le statut
      const clientsRef = collection(db, 'clients')
      const clientsSnapshot = await getDocs(query(clientsRef, where('uidclient', '==', user.uid)))
      
      if (!clientsSnapshot.empty) {
        const mainClientDoc = clientsSnapshot.docs[0]
        const factureRef = doc(db, `clients/${mainClientDoc.id}/factures`, params.id as string)
        
        await updateDoc(factureRef, {
          statut: 'facturee',
          dateEnvoi: new Date(),
          envoyee: true,
          lastModified: new Date()
        })
        
        console.log('Facture créée avec succès (statut: facturee)')
        toast.success('Facture créée avec succès ! Statut mis à jour vers "Facturée".')
        
        // Recharger les données pour mettre à jour l'interface
        window.location.reload()
      } else {
        toast.error('Erreur lors de la création de la facture')
      }
    } catch (error) {
      console.error('Erreur lors de la création de la facture:', error)
      toast.error('Erreur lors de la création de la facture')
    } finally {
      setIsAutoSaving(false)
      setShowConfirmFactureDialog(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <PulseLoader />
      </div>
    )
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
      
      // Delete facture from subcollection
      await deleteDoc(doc(db, `clients/${mainClientDoc.id}/factures`, params.id as string))
      
      console.log('Facture deleted successfully')
      toast.success('Facture supprimée avec succès')
      router.push('/dashboard/factures')
    } catch (error) {
      console.error('Error deleting facture:', error)
      toast.error('Erreur lors de la suppression de la facture')
    }
  }

  return (

    <div className="min-h-screen bg-gray-100">
      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la facture</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette facture ? Cette action est irréversible.
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
          <h1 className="text-lg font-medium text-gray-700">Facture {factureData.numeroFacture}</h1>
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
                    onChange={(e) => {
                      setClientSearch(e.target.value)
                      setShowClientDropdown(true)
                    }}
                    onFocus={() => setShowClientDropdown(true)}
                    className={`h-8 text-sm pr-8 ${!clientSearch ? 'bg-blue-50' : ''}`}
                  />
                  {(clientSearch || selectedClient) && (
                    <button
                      onClick={() => {
                        setClientSearch('')
                        setSelectedClient(null)
                        setShowClientDropdown(false)
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {showClientDropdown && (
                    <div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-60 overflow-y-auto bg-white border rounded-md shadow-lg">
                      <div className="p-2">
                        {filteredClients.length > 0 ? (
                          <div className="space-y-1">
                            {filteredClients.map((client) => (
                              <div
                                key={client.id}
                                className="p-2 hover:bg-gray-100 cursor-pointer rounded"
                                onClick={() => handleClientSelect(client)}
                              >
                                <div className="font-medium text-sm">
                                  {client.typeClient === 'entreprise' ? client.nomEntreprise : `${client.nom} ${client.prenom}`}
                                </div>
                                <div className="text-xs text-gray-500">{client.email}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-2 text-sm">Aucun client trouvé</div>
                        )}
                        <Separator className="my-2" />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-green-600"
                          onClick={handleCreateClient}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Ajouter un client
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <Input
                  placeholder="Adresse"
                  value={selectedClient?.adresse || ''}
                  onChange={() => {}} // Controlled by selectedClient
                  readOnly={!!selectedClient}
                  className="h-8 text-sm"
                />
                <Input
                  placeholder="Complément d'adresse"
                  value={selectedClient?.complementAdresse || ''}
                  onChange={() => {}} // Controlled by selectedClient
                  readOnly={!!selectedClient}
                  className="h-8 text-sm"
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="Code postal"
                    value={selectedClient?.codePostal || ''}
                    onChange={() => {}} // Controlled by selectedClient
                    readOnly={!!selectedClient}
                    className="h-8 text-sm flex-1"
                  />
                  <Input
                    placeholder="Ville"
                    value={selectedClient?.ville || ''}
                    onChange={() => {}} // Controlled by selectedClient
                    readOnly={!!selectedClient}
                    className="h-8 text-sm flex-2"
                  />
                </div>

                {/* SIREN/SIRET Field - Conditional */}
                {options.siretClient && (
                  <div className="mt-3">
                    <Label className="text-xs font-medium text-gray-700">SIRET</Label>
                    <Input
                      value={clientSiret}
                      onChange={(e) => setClientSiret(e.target.value)}
                      placeholder="12345678901234"
                      className="h-8 text-sm mt-1"
                    />
                  </div>
                )}

                {/* TVA Intracommunautaire Field - Conditional */}
                {options.tvaIntracommunautaire && (
                  <div className="mt-3">
                    <Label className="text-xs font-medium text-gray-700">TVA intracommunautaire</Label>
                    <Input
                      value={clientNumeroTVA}
                      onChange={(e) => setClientNumeroTVA(e.target.value)}
                      placeholder="FR12345678901"
                      className="h-8 text-sm mt-1"
                    />
                  </div>
                )}
              </div>
            </div>


            {/* Document Title - Conditional */}
            {options.intituleDocument && (
              <div className="mt-8 mb-6">
                <Input
                  value={intituleDocument}
                  onChange={(e) => setIntituleDocument(e.target.value)}
                  className="text-start text-lg font-bold border-0 bg-transparent focus:bg-white focus:border focus:border-blue-200 px-2 py-1"
                  placeholder="Intitulé du devis"
                />
              </div>
            )}

            {/* Devis Details */}
            <div className="grid grid-cols-3 gap-4 mt-2">
              <div>
                <Label className="text-xs font-medium text-gray-700">N° de facture</Label>
                <Input 
                  value={factureData.numeroFacture || 'Non généré'}
                  readOnly 
                  className="mt-1 h-8 text-sm bg-gray-50 text-gray-500" 
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-700">Date d'émission</Label>
                <Input 
                  type="date" 
                  value={factureData.dateCreation}
                  onChange={(e) => setFactureData(prev => ({ ...prev, dateCreation: e.target.value }))}
                  className="mt-1 h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-700">Échéance</Label>
                <div className="flex items-center mt-1">
                  <Input 
                    value={factureData.echeanceTexte}
                    onChange={(e) => setFactureData(prev => ({ ...prev, echeanceTexte: e.target.value }))}
                    className="h-8 text-sm flex-1"
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
                          <tr key={ligne.id || `ligne-rapide-${index}`} className={`border-t ${ligne.isDesignationOnly ? 'bg-gray-50' : ''} group hover:bg-gray-50 relative`}>
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
                          <tr key={ligne.id || `ligne-complet-${index}`} className={`border-t ${ligne.isDesignationOnly ? 'bg-gray-50' : ''} group hover:bg-gray-50 relative`}>
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
                    <span className="text-gray-600">{totalTVA > 0 ? 'Sous-total HT' : 'Sous-total'}</span>
                    <span className="font-medium">{sousTotal.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">{totalTVA > 0 ? 'Remise HT' : 'Remise'}</span>
                    <span className="font-medium">-{remiseHT.toFixed(2)} €</span>
                  </div>
                  <div className={`flex justify-between ${anyTVAZero ? 'text-lg font-bold text-blue-600' : 'text-xs'}`}>
                    <span className={anyTVAZero ? '' : 'text-gray-600'}>{totalTVA > 0 ? 'Total HT' : 'Total'}</span>
                    <span className={anyTVAZero ? '' : 'font-medium'}>{totalHT.toFixed(2)} €</span>
                  </div>
                </>
              ) : (
                <div className={`flex justify-between ${anyTVAZero ? 'text-lg font-bold text-blue-600' : 'text-xs'}`}>
                  <span className={anyTVAZero ? '' : 'text-gray-600'}>{totalTVA > 0 ? 'Total HT' : 'Total'}</span>
                  <span className={anyTVAZero ? '' : 'font-medium'}>{totalHT.toFixed(2)} €</span>
                </div>
              )}
              {totalTVA > 0 && (
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
            
            {/* Justification d'absence de TVA si au moins une TVA est à 0% */}
            {anyTVAZero && (
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-700">Motif d'exonération de TVA</Label>
                  <Select value={factureData.motifExonerationTVA} onValueChange={async (value) => {
                    // Mettre à jour le state local
                    setFactureData(prev => ({ ...prev, motifExonerationTVA: value }))
                    console.log('💾 Motif exonération TVA mis à jour:', value)
                    
                    // Sauvegarder immédiatement dans Firebase
                    if (!user?.uid) {
                      console.error('❌ User UID is undefined, cannot save to Firebase')
                      return
                    }
                    
                    try {
                      const mainClientsQuery = query(
                        collection(db, 'clients'),
                        where('uidclient', '==', user.uid)
                      )
                      const mainClientsSnapshot = await getDocs(mainClientsQuery)
                      
                      if (!mainClientsSnapshot.empty) {
                        const mainClientDoc = mainClientsSnapshot.docs[0]
                        const mainClientId = mainClientDoc.id
                        
                        const devisRef = doc(db, `clients/${mainClientId}/factures`, params.id as string)
                        
                        // Préparer les données à sauvegarder en évitant les valeurs undefined
                        const updateData: any = {
                          motifExonerationTVA: value || 'aucun',
                          dateModification: new Date()
                        }
                        
                        // Ajouter modifiePar seulement si user.uid est défini
                        if (user.uid) {
                          updateData.modifiePar = user.uid
                        }
                        
                        await updateDoc(devisRef, updateData)
                        console.log('✅ Motif exonération TVA sauvegardé dans Firebase:', value)
                      }
                    } catch (error) {
                      console.error('❌ Erreur lors de la sauvegarde du motif exonération TVA:', error)
                    }
                  }}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner un motif" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aucun">Aucun motif</SelectItem>
                      <SelectItem value="non_soumis">Je ne suis pas soumis à la TVA</SelectItem>
                      <SelectItem value="france_sans_tva">Prestation France sans TVA</SelectItem>
                      <SelectItem value="hors_france">Prestation Hors France</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  {getMotifExonerationText(factureData.motifExonerationTVA)}
                </div>
              </div>
            )}

            {/* Footer with legal text and company info */}
            <DevisFooter 
              showConditions={options.conditionsAcceptation} 
              showCompanyInfo={options.siretClient}
              showFreeField={options.champLibre}
              devisId={params.id as string}
              devisConditionsAcceptation={factureDataFromDB?.conditionsAcceptation}
              devisCustomCompanyInfo={factureDataFromDB?.customCompanyInfo}
              devisFreeFieldContent={factureData.champLibre}
              customConditionsText={factureDataFromDB?.conditionsAcceptation}
              onConditionsChange={(newConditions) => {
                // Sauvegarder directement dans Firebase dans clients/{idclient}/factures/{idfacture}/conditionsAcceptation
                console.log('💾 Sauvegarde conditions dans facture:', newConditions)
              }}
              onFreeFieldChange={async (newFreeField) => {
                // Mettre à jour le state local
                setFactureData(prev => ({ ...prev, champLibre: newFreeField }))
                console.log('💾 Champ libre mis à jour:', newFreeField)
                
                // Sauvegarder immédiatement dans Firebase
                if (!user?.uid) {
                  console.error('❌ User UID is undefined, cannot save to Firebase')
                  return
                }
                
                try {
                  const mainClientsQuery = query(
                    collection(db, 'clients'),
                    where('uidclient', '==', user.uid)
                  )
                  const mainClientsSnapshot = await getDocs(mainClientsQuery)
                  
                  if (!mainClientsSnapshot.empty) {
                    const mainClientDoc = mainClientsSnapshot.docs[0]
                    const mainClientId = mainClientDoc.id
                    
                    const devisRef = doc(db, `clients/${mainClientId}/factures`, params.id as string)
                    
                    // Préparer les données à sauvegarder en évitant les valeurs undefined
                    const updateData: any = {
                      champLibre: newFreeField || '',
                      dateModification: new Date()
                    }
                    
                    // Ajouter modifiePar seulement si user.uid est défini
                    if (user.uid) {
                      updateData.modifiePar = user.uid
                    }
                    
                    await updateDoc(devisRef, updateData)
                    console.log('✅ ChampLibre sauvegardé dans Firebase:', newFreeField)
                  }
                } catch (error) {
                  console.error('❌ Erreur lors de la sauvegarde du champLibre:', error)
                }
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
            const newLine: FactureLine = {
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

      {/* Fixed Bottom Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-transparent p-4 flex justify-center gap-4 z-30">
        <Button 
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 cursor-pointer shadow-lg"
          onClick={sauvegarderFacture}
          size="lg"
          disabled={isAutoSaving}
        >
          <FileText className="w-4 h-4 mr-2" />
          {isAutoSaving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
        </Button>
        {/* Bouton Créer la facture - seulement si statut = brouillon */}
        {factureDataFromDB?.statut === 'brouillon' && (
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 cursor-pointer shadow-lg"
            onClick={() => setShowConfirmFactureDialog(true)}
            size="lg"
          >
            <Receipt className="w-4 h-4 mr-2" />
            Créer la facture
          </Button>
        )}
      </div>

      {/* Modale de confirmation pour créer la facture */}
      <AlertDialog open={showConfirmFactureDialog} onOpenChange={setShowConfirmFactureDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Créer la facture définitive</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir créer cette facture ? Le statut passera de "brouillon" à "facturée".
              <br /><br />
              <strong>Vous pourrez toujours modifier la facture après sa création.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={creerFactureDefinitive}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Créer la facture
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}

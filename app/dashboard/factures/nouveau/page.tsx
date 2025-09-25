'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { X, Upload, Plus, Trash2, Settings, FileText, Calendar, ArrowRight, ChevronDown, MoreHorizontal } from 'lucide-react'
import DevisFooter from '@/components/DevisFooter'
import { useAuth } from '@/hooks/useAuth'
import { useClients, Client } from '@/hooks/useClients'
import { genererProchainNumero } from '@/lib/numerotation'
import { useRouter } from 'next/navigation'
import { ClientDrawer } from '@/components/ClientDrawer'
import { PrestationDrawer } from '@/components/PrestationDrawer'
import { PrestationsListDrawer } from '@/components/PrestationsListDrawer'
import { collection, addDoc, serverTimestamp, getDocs, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { toast } from 'sonner'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

interface FactureLine {
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

export default function NouvelleFacturePage() {
  const { user, clientData } = useAuth()
  const { clients } = useClients()
  const router = useRouter()
  
  // States
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isClientDrawerOpen, setIsClientDrawerOpen] = useState(false)
  const [isPrestationDrawerOpen, setIsPrestationDrawerOpen] = useState(false)
  const [isPrestationsListOpen, setIsPrestationsListOpen] = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Facture data
  const [factureData, setFactureData] = useState({
    numeroFacture: '', // Sera généré automatiquement
    dateCreation: '',
    dateEcheance: '',
    echeanceDuree: 30,
    conditions: '',
    notes: '',
    echeanceTexte: '30 jours', // Texte personnalisable pour l'échéance
    conditionsAcceptation: 'Facture payable dans les 30 jours suivant la date d\'émission.',
    champLibre: '',
    motifExonerationTVA: 'aucun'
  })

  // État pour la justification d'absence de TVA
  const [motifExonerationTVA, setMotifExonerationTVA] = useState('aucun')
  
  // État pour le numéro de facture généré
  const [numeroFacture, setNumeroFacture] = useState<string>('')
  const [isGeneratingNumber, setIsGeneratingNumber] = useState(false)
  const [brouillonId, setBrouillonId] = useState<string | null>(null)
  const [showExitModal, setShowExitModal] = useState(false)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  
  // Ref pour récupérer les states locaux du DevisFooter
  const getLocalStatesRef = useRef<(() => { localConditionsAcceptation: string; localCustomCompanyInfo: string }) | null>(null)

  // Initialize dates only
  useEffect(() => {
    const today = new Date()
    const echeanceDate = new Date(today)
    echeanceDate.setDate(today.getDate() + factureData.echeanceDuree)
    
    setFactureData(prev => ({
      ...prev,
      dateCreation: today.toISOString().split('T')[0],
      dateEcheance: echeanceDate.toISOString().split('T')[0]
    }))
    setIsInitialized(true)
  }, [factureData.echeanceDuree])
  
  // Générer le numéro de facture automatiquement
  useEffect(() => {
    const genererNumero = async () => {
      if (user?.uid) {
        try {
          const numero = await genererProchainNumero(user.uid, 'factures')
          setNumeroFacture(numero)
        } catch (error) {
          console.error('Erreur génération numéro facture:', error)
        }
      }
    }
    genererNumero()
  }, [user?.uid])
  
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
    siretClient: true,
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
    }, 0)
    const totalTTC = totalHT + totalTVA
    return { sousTotal, remiseHT, totalHT, totalTVA, totalTTC }
  }

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

  const { sousTotal, remiseHT, totalHT, totalTVA, totalTTC } = calculateTotals()
  
  // Vérifier si au moins une TVA est à 0%
  const anyTVAZero = lignes.some(ligne => ligne.tauxTVA === 0)

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

  // Handle client selection
  const handleClientSelect = (client: Client) => {
    setSelectedClient(client)
    setClientSearch(`${client.nom} ${client.prenom}`)
    setShowClientDropdown(false)
  }

  // Handle create client
  const handleCreateClient = () => {
    setShowClientDropdown(false)
    setIsClientDrawerOpen(true)
  }

  // Créer un brouillon de facture
  const creerBrouillon = async () => {
    if (!selectedClient || !user?.uid) {
      toast.error('Veuillez sélectionner un client')
      return
    }

    try {
      console.log('=== DÉBUT CRÉATION BROUILLON FACTURE ===')
      
      // Find main client document
      const clientsRef = collection(db, 'clients')
      const clientsSnapshot = await getDocs(query(clientsRef, where('uidclient', '==', user.uid)))
      
      if (clientsSnapshot.empty) {
        console.error('❌ Aucun client principal trouvé pour UID:', user.uid)
        toast.error('Erreur: profil client non trouvé')
        return
      }

      const mainClientDoc = clientsSnapshot.docs[0]
      console.log('✅ Client principal trouvé:', mainClientDoc.id)
      
      // Récupérer les states locaux du DevisFooter
      const localStates = getLocalStatesRef.current?.() || { localConditionsAcceptation: '', localCustomCompanyInfo: '' }
      // S'assurer que localStates n'a pas de valeurs undefined
      if (localStates.localConditionsAcceptation === undefined) localStates.localConditionsAcceptation = ''
      if (localStates.localCustomCompanyInfo === undefined) localStates.localCustomCompanyInfo = ''
      
      // S'assurer que toutes les variables ont des valeurs par défaut
      const safeOptions = options || {}
      const safeFactureData = factureData || {}
      const safeSelectedClient = selectedClient || {}
      const safeLignes = lignes || []
      const safeAdresseLivraison = adresseLivraison || null
      const safeIntituleDocument = intituleDocument || null
      const safeRemiseGlobale = remiseGlobale || null
      const safeClientSiret = clientSiret || ''
      const safeClientNumeroTVA = clientNumeroTVA || ''
      const safeMotifExonerationTVA = motifExonerationTVA || 'aucun'
      const safeNumeroFacture = numeroFacture || ''
      const safeTotalHT = totalHT || 0
      const safeTotalTTC = totalTTC || 0
      const safeTotalTVA = totalTVA || 0

      // Créer un brouillon avec structure conforme à la référence Firebase + compatibilité devis
      const brouillonData = {
        // === CHAMPS OBLIGATOIRES RÉFÉRENCE FIREBASE ===
        numeroFacture: safeNumeroFacture,
        clientId: selectedClient?.id || null,
        dateCreation: serverTimestamp(),
        dateEcheance: new Date(factureData.dateEcheance || new Date()),
        dateReglement: null,
        statut: 'brouillon', // Conforme à la référence (pas "status")
        montantHT: safeTotalHT, // Conforme à la référence (pas "montantTotalHT")
        montantTTC: safeTotalTTC, // Conforme à la référence (pas "montantTotalTTC")
        montantTVA: safeTotalTVA, // Conforme à la référence (pas "montantTotalTVA")
        tauxTVA: lignes.length > 0 ? lignes[0].tauxTVA : 20, // Taux principal
        devise: 'EUR',
        conditions: {
          delaiPaiement: factureData.echeanceDuree || 30,
          penalitesRetard: 3,
          escompte: 0
        },
        adresseFacturation: {
          nom: selectedClient ? (selectedClient.typeClient === 'entreprise' ? selectedClient.nomEntreprise : `${selectedClient.nom} ${selectedClient.prenom}`) : '',
          adresse: selectedClient?.adresse || '',
          codePostal: selectedClient?.codePostal || '',
          ville: selectedClient?.ville || '',
          pays: 'France'
        },
        lignes: lignes.map(ligne => ({
          articleId: null,
          designation: ligne.designation,
          quantite: ligne.quantite,
          prixUnitaireHT: ligne.prixUnitaireHT,
          remise: ligne.remise || 0,
          montantHT: ligne.montantHT,
          tauxTVA: ligne.tauxTVA,
          // Champs supplémentaires pour compatibilité devis
          id: ligne.id,
          unite: ligne.unite,
          typePrestation: ligne.typePrestation,
          isDesignationOnly: ligne.isDesignationOnly
        })),
        notes: factureData.notes || '',
        fichierPDF: null,
        envoyee: false,
        dateEnvoi: null,
        historique: [{
          date: new Date(),
          action: 'creation_brouillon',
          utilisateur: user.uid,
          details: 'Création du brouillon de facture'
        }],
        
        // === CHAMPS SUPPLÉMENTAIRES POUR COMPATIBILITÉ DEVIS ===
        type: 'facture',
        clientNom: selectedClient ? (selectedClient.typeClient === 'entreprise' ? (selectedClient.nomEntreprise || '') : `${selectedClient.nom || ''} ${selectedClient.prenom || ''}`.trim()) : '',
        clientEmail: selectedClient?.email || '',
        clientSiret: options.siretClient ? (clientSiret || '') : (selectedClient?.siret || ''),
        clientNumeroTVA: options.tvaIntracommunautaire ? (clientNumeroTVA || '') : (selectedClient?.numeroTVA || ''),
        clientCodeAPE: selectedClient?.codeAPE || '',
        echeanceDuree: factureData.echeanceDuree || 30,
        echeanceTexte: factureData.echeanceTexte || '',
        conditionsAcceptation: localStates.localConditionsAcceptation || factureData.conditionsAcceptation || 'Facture payable dans les 30 jours suivant la date d\'émission.',
        champLibre: factureData.champLibre || '',
        motifExonerationTVA: (typeof motifExonerationTVA === 'string' && motifExonerationTVA) || 'aucun',
        customCompanyInfo: localStates.localCustomCompanyInfo || '',
        options: options,
        adresseLivraison: options.adresseLivraison ? adresseLivraison : null,
        intituleDocument: options.intituleDocument ? intituleDocument : null,
        remiseGlobale: options.remiseGlobale ? remiseGlobale : null,
        uidclient: user.uid,
        mainClientId: mainClientDoc.id,
        lastModified: serverTimestamp()
      }

      console.log('📝 Données du brouillon facture à créer:', brouillonData)

      // Fonction pour nettoyer les valeurs undefined
      const cleanObject = (obj: any): any => {
        if (obj === null || obj === undefined) return null
        if (typeof obj !== 'object' || Array.isArray(obj)) return obj
        
        // Gérer les objets Firebase spéciaux (serverTimestamp, etc.)
        if (obj.constructor && obj.constructor.name !== 'Object') return obj
        
        const cleaned: { [key: string]: any } = {}
        for (const [key, value] of Object.entries(obj)) {
          if (value !== undefined) {
            if (value === null) {
              cleaned[key] = null
            } else if (Array.isArray(value)) {
              cleaned[key] = value.filter(item => item !== undefined)
            } else if (typeof value === 'object' && value.constructor && value.constructor.name === 'Object') {
              cleaned[key] = cleanObject(value)
            } else {
              cleaned[key] = value
            }
          }
        }
        return cleaned
      }

      const cleanedBrouillonData = cleanObject(brouillonData)
      console.log('🧹 Données nettoyées (sans undefined):', cleanedBrouillonData)
      
      const facturesRef = collection(db, `clients/${mainClientDoc.id}/factures`)
      const docRef = await addDoc(facturesRef, cleanedBrouillonData)
      
      console.log('🎉 SUCCÈS! Brouillon facture créé avec ID:', docRef.id)
      setBrouillonId(docRef.id)
      toast.success(`Brouillon facture créé: ${docRef.id}`)
      
      // Rediriger vers la page de détail de la facture
      router.push(`/dashboard/factures/${docRef.id}`)
      
    } catch (error: any) {
      console.error('💥 ERREUR CRÉATION BROUILLON FACTURE:', error)
      toast.error(`Erreur: ${error.message || 'Erreur inconnue'}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="relative bg-gray-50 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="cursor-pointer" size="sm" onClick={() => router.push('/dashboard/factures')}>
            <X className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-medium text-gray-700">Nouvelle facture</h1>
        </div>
        
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

            {/* Facture Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">FACTURE</h1>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <Label className="text-xs text-gray-500">N° de facture</Label>
                  <div className="font-medium">{numeroFacture || 'FAC-2025-001'}</div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Date d'émission</Label>
                  <div className="font-medium">{isInitialized && factureData.dateCreation ? new Date(factureData.dateCreation).toLocaleDateString() : ''}</div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Date d'échéance</Label>
                  <div className="font-medium">{isInitialized && factureData.dateEcheance ? new Date(factureData.dateEcheance).toLocaleDateString() : ''}</div>
                </div>
              </div>
            </div>

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
                              <Select key={`tva-${ligne.id}`} value={ligne.tauxTVA.toString()} onValueChange={(value) => updateLigne(ligne.id, 'tauxTVA', parseFloat(value))}>
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
                                >
                                  <MoreHorizontal className="w-3 h-3 text-gray-500" />
                                </button>
                                {lignes.length > 1 && (
                                  <button
                                    onClick={() => removeLigne(ligne.id)}
                                    className="h-6 w-6 p-0 bg-white border border-gray-200 shadow-sm hover:bg-red-50 hover:border-red-200 rounded flex items-center justify-center"
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
                            -{remiseHT.toFixed(2)} €
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              // Mode complet - tableau avec toutes les colonnes
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
                                <Input
                                  placeholder="Désignation"
                                  value={ligne.designation}
                                  onChange={(e) => updateLigne(ligne.id, 'designation', e.target.value)}
                                  className="border-0 shadow-none p-0 h-auto focus-visible:ring-0 text-xs flex-1"
                                />
                              </div>
                            </td>
                            <td className="p-2 border-r border-gray-200">
                              <Input
                                type="number"
                                value={ligne.quantite}
                                onChange={(e) => updateLigne(ligne.id, 'quantite', parseFloat(e.target.value) || 0)}
                                className="border-0 shadow-none p-0 h-auto focus-visible:ring-0 text-center text-xs w-16"
                              />
                            </td>
                            <td className="p-2 border-r border-gray-200">
                              <Input
                                placeholder="unité"
                                value={ligne.unite || ''}
                                onChange={(e) => updateLigne(ligne.id, 'unite', e.target.value)}
                                className="border-0 shadow-none p-0 h-auto focus-visible:ring-0 text-center text-xs w-16"
                              />
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
                                className="border-0 shadow-none p-0 h-auto focus-visible:ring-0 text-center text-xs"
                              />
                            </td>
                            <td className="p-2 border-r border-gray-200">
                              <Select key={`tva-${ligne.id}`} value={ligne.tauxTVA.toString()} onValueChange={(value) => updateLigne(ligne.id, 'tauxTVA', parseFloat(value))}>
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
                              <div className="text-right text-xs font-medium">
                                {ligne.montantHT.toFixed(2)} €
                              </div>
                              <div className="absolute -right-6 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                                <button
                                  onClick={() => {
                                    setEditingLineId(ligne.id)
                                    setIsPrestationsListOpen(true)
                                  }}
                                  className="h-6 w-6 p-0 bg-white border border-gray-200 shadow-sm hover:bg-blue-50 hover:border-blue-200 rounded flex items-center justify-center"
                                >
                                  <MoreHorizontal className="w-3 h-3 text-gray-500" />
                                </button>
                                {lignes.length > 1 && (
                                  <button
                                    onClick={() => removeLigne(ligne.id)}
                                    className="h-6 w-6 p-0 bg-white border border-gray-200 shadow-sm hover:bg-red-50 hover:border-red-200 rounded flex items-center justify-center"
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
                          <td className="p-2 border-r border-gray-200"></td>
                          <td className="p-2 text-center text-sm font-medium">
                            -{remiseHT.toFixed(2)} €
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Add Line Buttons */}
            <div className="flex justify-start mb-4">
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
                    <span className="text-gray-600">{anyTVAZero ? 'Sous-total' : 'Sous-total HT'}</span>
                    <span className="font-medium">{sousTotal.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">{anyTVAZero ? 'Remise' : 'Remise HT'}</span>
                    <span className="font-medium">-{remiseHT.toFixed(2)} €</span>
                  </div>
                  <div className={`flex justify-between ${anyTVAZero ? 'text-lg font-bold text-blue-600' : 'text-xs'}`}>
                    <span className={anyTVAZero ? '' : 'text-gray-600'}>{anyTVAZero ? 'Total' : 'Total HT'}</span>
                    <span className={anyTVAZero ? '' : 'font-medium'}>{totalHT.toFixed(2)} €</span>
                  </div>
                </>
              ) : (
                <div className={`flex justify-between ${anyTVAZero ? 'text-lg font-bold text-blue-600' : 'text-xs'}`}>
                  <span className={anyTVAZero ? '' : 'text-gray-600'}>{anyTVAZero ? 'Total' : 'Total HT'}</span>
                  <span className={anyTVAZero ? '' : 'font-medium'}>{totalHT.toFixed(2)} €</span>
                </div>
              )}
              {!anyTVAZero && (
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
                  <Select value={motifExonerationTVA} onValueChange={setMotifExonerationTVA}>
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
                  {getMotifExonerationText(motifExonerationTVA)}
                </div>
              </div>
            )}

            {/* Footer with legal text and company info */}
            <DevisFooter 
              showConditions={options.conditionsAcceptation}
              showCompanyInfo={options.siretClient}
              showFreeField={options.champLibre}
              customConditionsText={factureData.conditionsAcceptation}
              devisId={brouillonId || "FORCE_FACTURE_MODE"}
              devisConditionsAcceptation={factureData.conditionsAcceptation}
              onConditionsChange={(newConditions) => {
                setFactureData(prev => ({ ...prev, conditionsAcceptation: newConditions }))
              }}
              onFreeFieldChange={(newFreeField) => {
                setFactureData(prev => ({ ...prev, champLibre: newFreeField }))
              }}
              onGetLocalStates={getLocalStatesRef}
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

      {/* Fixed Bottom Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-transparent p-4 flex justify-center gap-4 z-30">
        <Button 
          className="bg-blue-600 hover:shadow-lg transition-all duration-300 ease-in-out text-white px-6 py-3 cursor-pointer"
          onClick={creerBrouillon}
          size="lg"
          variant="outline"
          disabled={!selectedClient}
        >
          <FileText className="w-4 h-4 mr-2" />
          Sauvegarder en brouillon
        </Button>
        <Button 
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 cursor-pointer"
          onClick={creerBrouillon}
          size="lg"
          disabled={!selectedClient}
        >
          <FileText className="w-4 h-4 mr-2" />
          Créer la facture
        </Button>
      </div>

      {/* Drawers */}
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
    </div>
  )
}

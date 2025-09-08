'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { X, Upload, Plus, Trash2, Settings, FileText, Calendar } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useClients, Client } from '@/hooks/useClients'
import { useRouter } from 'next/navigation'
import { ClientDrawer } from '@/components/ClientDrawer'
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { toast } from 'sonner'

interface DevisLine {
  id: string
  designation: string
  quantite: number
  prixUnitaireHT: number
  remise: number
  montantHT: number
  tauxTVA: number
}

export default function NouveauDevisPage() {
  const { user, clientData } = useAuth()
  const { clients } = useClients()
  const router = useRouter()
  
  // States
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isClientDrawerOpen, setIsClientDrawerOpen] = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  
  // Devis data
  const [devisData, setDevisData] = useState({
    numeroDevis: '',
    dateCreation: '',
    dateValidite: '',
    validiteDuree: 30,
    conditions: '',
    notes: ''
  })

  // Initialize data on client side only
  useEffect(() => {
    const now = new Date()
    const validityDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    
    setDevisData({
      numeroDevis: `DEV-${now.getFullYear()}-${String(Date.now()).slice(-3)}`,
      dateCreation: now.toISOString().split('T')[0],
      dateValidite: validityDate.toISOString().split('T')[0],
      validiteDuree: 30,
      conditions: '',
      notes: ''
    })
  }, [])
  
  // Line items
  const [lignes, setLignes] = useState<DevisLine[]>([
    {
      id: '1',
      designation: '',
      quantite: 1,
      prixUnitaireHT: 0,
      remise: 0,
      montantHT: 0,
      tauxTVA: 20
    }
  ])
  
  // Options
  const [options, setOptions] = useState({
    typeFacturation: 'rapide',
    formatElectronique: 'complet',
    adresseLivraison: false,
    siretClient: false,
    tvaIntracommunautaire: false,
    langue: 'francais',
    conditionsAcceptation: true,
    champSignature: true,
    intituleDocument: false,
    champLibre: false,
    remiseGlobale: false
  })

  // Filtered clients for dropdown
  const filteredClients = clients.filter(client =>
    client.nom.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.prenom.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.email.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.nomEntreprise.toLowerCase().includes(clientSearch.toLowerCase())
  )

  // Calculate totals
  const calculateTotals = () => {
    const totalHT = lignes.reduce((sum, ligne) => sum + ligne.montantHT, 0)
    const totalTVA = lignes.reduce((sum, ligne) => sum + (ligne.montantHT * ligne.tauxTVA / 100), 0)
    const totalTTC = totalHT + totalTVA
    return { totalHT, totalTVA, totalTTC }
  }

  const { totalHT, totalTVA, totalTTC } = calculateTotals()

  // Update line amount when quantity, price or discount changes
  const updateLigne = (id: string, field: keyof DevisLine, value: any) => {
    setLignes(prev => prev.map(ligne => {
      if (ligne.id === id) {
        const updated = { ...ligne, [field]: value }
        if (field === 'quantite' || field === 'prixUnitaireHT' || field === 'remise') {
          const montantBrut = updated.quantite * updated.prixUnitaireHT
          updated.montantHT = montantBrut - (montantBrut * updated.remise / 100)
        }
        return updated
      }
      return ligne
    }))
  }

  const addLigne = () => {
    const newLigne: DevisLine = {
      id: Date.now().toString(),
      designation: '',
      quantite: 1,
      prixUnitaireHT: 0,
      remise: 0,
      montantHT: 0,
      tauxTVA: 20
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

  const handleSaveDevis = async () => {
    if (!selectedClient) {
      toast.error('Veuillez sélectionner un client')
      return
    }

    if (lignes.some(ligne => !ligne.designation.trim())) {
      toast.error('Veuillez remplir toutes les désignations')
      return
    }

    try {
      const devisToSave = {
        numeroDevis: devisData.numeroDevis,
        dateCreation: serverTimestamp(),
        dateValidite: new Date(devisData.dateValidite),
        validiteDuree: devisData.validiteDuree,
        clientId: selectedClient.id,
        clientNom: selectedClient.typeClient === 'entreprise' ? selectedClient.nomEntreprise : `${selectedClient.nom} ${selectedClient.prenom}`,
        clientEmail: selectedClient.email,
        lignes: lignes.map(ligne => ({
          designation: ligne.designation,
          quantite: ligne.quantite,
          prixUnitaireHT: ligne.prixUnitaireHT,
          remise: ligne.remise,
          montantHT: ligne.montantHT,
          tauxTVA: ligne.tauxTVA
        })),
        montantTotalHT: totalHT,
        montantTotalTVA: totalTVA,
        montantTotalTTC: totalTTC,
        status: 'brouillon',
        conditions: devisData.conditions,
        notes: devisData.notes,
        options: options,
        uidclient: user?.uid
      }

      // Find main client document by matching uidclient with current user's ID
      const clientsRef = collection(db, 'clients')
      const clientsSnapshot = await getDocs(query(clientsRef, where('uidclient', '==', user?.uid)))
      
      if (!clientsSnapshot.empty) {
        const mainClientDoc = clientsSnapshot.docs[0]
        const devisRef = collection(db, `clients/${mainClientDoc.id}/devis`)
        await addDoc(devisRef, devisToSave)
        
        toast.success('Devis créé avec succès')
        router.push('/dashboard/devis')
      } else {
        toast.error('Erreur lors de la création du devis')
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      toast.error('Erreur lors de la création du devis')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="relative bg-white px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        {/* Gradient shadow underneath */}
        <div className="absolute -bottom-8 left-0 right-0 h-8 bg-gradient-to-b from-white to-transparent pointer-events-none z-10"></div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className=" cursor-pointer" size="sm" onClick={() => router.push('/dashboard/devis')}>
            <X className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-medium text-gray-700">Nouveau devis</h1>
        </div>
      </div>

      <div className="flex justify-center p-8 pb-24">
        {/* A4 Document Container */}
        <div className="relative">
          {/* A4 Page */}
          <div className="w-[210mm] min-h-[297mm] bg-white shadow-lg p-8 space-y-6" style={{width: '210mm', minHeight: '297mm'}}>
            
            {/* Company Info Section */}
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-50 rounded border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-100">
                  {clientData?.logoImage ? (
                    <img src={clientData.logoImage} alt="Logo" className="w-full h-full object-contain rounded" />
                  ) : (
                    <Upload className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <div className="space-y-0.5">
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
              </div>
              <div className="text-right text-xs text-gray-500">
                15 chemin du château<br/>
                33580
              </div>
            </div>

            {/* Client Section */}
            <div className="space-y-3">
              <div className="text-xs font-medium text-gray-700">Client</div>
              <div className="relative">
                <Input
                  placeholder="Nom du client"
                  value={clientSearch}
                  onChange={(e) => {
                    setClientSearch(e.target.value)
                    setShowClientDropdown(true)
                  }}
                  onFocus={() => setShowClientDropdown(true)}
                  className="border-red-200 border-dashed bg-red-50/30"
                />
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
                              <div className="font-medium">
                                {client.typeClient === 'entreprise' ? client.nomEntreprise : `${client.nom} ${client.prenom}`}
                              </div>
                              <div className="text-sm text-gray-500">{client.email}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-2">Aucun client trouvé</div>
                      )}
                      <Separator className="my-2" />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-green-600"
                        onClick={handleCreateClient}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Créer un client
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Devis Details */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs font-medium text-gray-700">Devis</Label>
                <Input value={devisData.numeroDevis} readOnly className="mt-1 h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-700">Date d'émission</Label>
                <Input 
                  type="date" 
                  value={devisData.dateCreation}
                  onChange={(e) => setDevisData(prev => ({ ...prev, dateCreation: e.target.value }))}
                  className="mt-1 h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-700">Période de validité : {devisData.validiteDuree} jours</Label>
                <Input 
                  type="date" 
                  value={devisData.dateValidite}
                  onChange={(e) => setDevisData(prev => ({ ...prev, dateValidite: e.target.value }))}
                  className="mt-1 h-8 text-sm"
                />
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-3">
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

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-2 font-medium text-gray-700 text-xs">Désignation</th>
                      <th className="text-center p-2 font-medium text-gray-700 w-16 text-xs">Qté</th>
                      <th className="text-center p-2 font-medium text-gray-700 w-20 text-xs">Prix HT</th>
                      <th className="text-center p-2 font-medium text-gray-700 w-16 text-xs">%</th>
                      <th className="text-right p-2 font-medium text-gray-700 w-20 text-xs">Montant</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lignes.map((ligne, index) => (
                      <tr key={ligne.id} className="border-t">
                        <td className="p-2">
                          <Input
                            placeholder="Désignation"
                            value={ligne.designation}
                            onChange={(e) => updateLigne(ligne.id, 'designation', e.target.value)}
                            className="border-0 shadow-none p-0 h-auto focus-visible:ring-0 text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={ligne.quantite}
                            onChange={(e) => updateLigne(ligne.id, 'quantite', parseFloat(e.target.value) || 0)}
                            className="border-0 shadow-none p-0 h-auto focus-visible:ring-0 text-center text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={ligne.prixUnitaireHT}
                            onChange={(e) => updateLigne(ligne.id, 'prixUnitaireHT', parseFloat(e.target.value) || 0)}
                            className="border-0 shadow-none p-0 h-auto focus-visible:ring-0 text-center text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={ligne.remise}
                            onChange={(e) => updateLigne(ligne.id, 'remise', parseFloat(e.target.value) || 0)}
                            className="border-0 shadow-none p-0 h-auto focus-visible:ring-0 text-center text-xs"
                          />
                        </td>
                        <td className="p-2 text-right font-medium text-xs">
                          {ligne.montantHT.toFixed(2)} €
                        </td>
                        <td className="p-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLigne(ligne.id)}
                            disabled={lignes.length === 1}
                            className="h-6 w-6 p-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Button variant="ghost" onClick={addLigne} className="text-green-600 hover:text-green-700 hover:bg-green-50 h-8 text-xs">
                <Plus className="w-3 h-3 mr-1" />
                Ligne simple
              </Button>
            </div>

            {/* Totals */}
            <div className="space-y-2 text-right border-t pt-4">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Total HT</span>
                <span className="font-medium">{totalHT.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-blue-600">
                <span>Total TTC</span>
                <span>{totalTTC.toFixed(2)} €</span>
              </div>
            </div>

          </div>
          
          {/* Options Card - Positioned at top right of A4 sheet */}
          <div className="absolute top-0 -right-80 w-72 bg-white border rounded-lg shadow-lg p-4 space-y-4 z-10">
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
                <div className="flex items-center space-x-2">
                  <input 
                    type="radio" 
                    id="electronique" 
                    name="typeFacturation" 
                    checked={options.typeFacturation === 'electronique'}
                    onChange={() => setOptions(prev => ({ ...prev, typeFacturation: 'electronique' }))}
                    className="w-3 h-3" 
                  />
                  <Label htmlFor="electronique" className="text-xs">Format électronique</Label>
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

            {/* Langue */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-blue-600">Langue</Label>
              <div suppressHydrationWarning>
                <Select value={options.langue} onValueChange={(value) => setOptions(prev => ({ ...prev, langue: value }))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="francais">Français</SelectItem>
                    <SelectItem value="anglais">Anglais</SelectItem>
                  </SelectContent>
                </Select>
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
                    id="champSignature" 
                    checked={options.champSignature} 
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, champSignature: checked as boolean }))}
                    className="w-3 h-3" 
                  />
                  <Label htmlFor="champSignature" className="text-xs">Champ signature</Label>
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

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-transparent p-4 flex justify-center z-30">
        <Button 
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 cursor-pointer"
          onClick={handleSaveDevis}
          size="lg"
        >
          <FileText className="w-4 h-4 mr-2" />
          Créer le devis
        </Button>
      </div>

      <ClientDrawer 
        open={isClientDrawerOpen} 
        onOpenChange={setIsClientDrawerOpen}
        editingClient={null}
      />
    </div>
  )
}

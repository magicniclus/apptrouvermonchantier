import React from 'react'
import { pdf } from '@react-pdf/renderer'
import DevisPDF from '../components/DevisPDF'

// Interfaces pour les données du devis
interface DevisData {
  numeroDevis: string
  dateCreation: string
  validiteTexte: string
  lignes: LigneDevis[]
  montantTotalHT: number
  montantTotalTVA: number
  montantTotalTTC: number
  conditions?: string
  notes?: string
  options: {
    adresseLivraison: boolean
    conditionsAcceptation: boolean
    remiseGlobale: boolean
  }
  adresseLivraison?: {
    adresse: string
    complementAdresse: string
    codePostal: string
    ville: string
    pays: string
  }
  remiseGlobale?: {
    pourcentage: number
    montant: number
  }
  sousTotal?: number
  remiseHT?: number
}

interface LigneDevis {
  designation: string
  quantite: number
  unite: string
  prixUnitaireHT: number
  tauxTVA: number
  montantHT: number
}

interface ClientData {
  typeClient: 'particulier' | 'entreprise'
  nom?: string
  prenom?: string
  nomEntreprise?: string
  adresse?: string
  complementAdresse?: string
  codePostal?: string
  ville?: string
  pays?: string
  siret?: string
  numeroTVA?: string
  codeAPE?: string
}

interface CompanyInfo {
  nom: string
  formeJuridique?: string
  adresseSiege: {
    adresse: string
    codePostal: string
    ville: string
  }
  siret: string
  numeroTVA: string
  codeAPE: string
  logo?: string
}

// Fonction pour générer et télécharger le PDF
export const generateDevisPDF = async (
  devis: DevisData,
  client: ClientData,
  company: CompanyInfo
) => {
  try {
    // Créer le document PDF avec React PDF
    const blob = await pdf(<DevisPDF devis={devis} client={client} company={company} />).toBlob()
    
    // Créer un lien de téléchargement
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Devis_${devis.numeroDevis}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error)
    throw error
  }
}

// Fonction pour prévisualiser le PDF
export const previewDevisPDF = async (
  devis: DevisData,
  client: ClientData,
  company: CompanyInfo
) => {
  try {
    // Créer le document PDF avec React PDF
    const blob = await pdf(<DevisPDF devis={devis} client={client} company={company} />).toBlob()
    
    // Ouvrir dans un nouvel onglet
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    
    // Nettoyer l'URL après un délai
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch (error) {
    console.error('Erreur lors de la prévisualisation du PDF:', error)
    throw error
  }
}

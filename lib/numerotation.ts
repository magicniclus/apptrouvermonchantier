import { db } from './firebase'
import { doc, getDoc, setDoc, updateDoc, runTransaction, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'

export interface NumerotationConfig {
  annee: number
  dernier: number
  prefixe: string
}

export interface NumerotationData {
  factures: NumerotationConfig
  devis: NumerotationConfig
  clients: NumerotationConfig
}

/**
 * Trouve le dernier numéro réellement utilisé dans la collection (tous statuts confondus)
 */
async function trouverDernierNumeroUtilise(
  clientId: string,
  type: 'devis' | 'factures',
  annee: number,
  prefixe: string
): Promise<number> {
  try {
    // Chercher le document client principal
    const clientsRef = collection(db, 'clients')
    const clientsSnapshot = await getDocs(query(clientsRef, where('uidclient', '==', clientId)))
    
    if (clientsSnapshot.empty) {
      return 0
    }
    
    const mainClientDoc = clientsSnapshot.docs[0]
    const collectionRef = collection(db, 'clients', mainClientDoc.id, type)
    
    // Chercher tous les documents de l'année avec le bon préfixe (brouillon ET enregistrés)
    const documentsSnapshot = await getDocs(collectionRef)
    
    let dernierNumero = 0
    const prefixeRecherche = `${prefixe}-${annee}-`
    
    documentsSnapshot.forEach((doc) => {
      const data = doc.data()
      const numeroDocument = data.numeroDevis || data.numeroFacture
      
      if (numeroDocument && numeroDocument.startsWith(prefixeRecherche)) {
        // Extraire le numéro de la fin (ex: "DEV-2025-003" -> 3)
        const numeroStr = numeroDocument.split('-')[2]
        const numero = parseInt(numeroStr, 10)
        
        if (!isNaN(numero) && numero > dernierNumero) {
          dernierNumero = numero
        }
      }
    })
    
    return dernierNumero
  } catch (error) {
    console.error('Erreur lors de la recherche du dernier numéro:', error)
    return 0
  }
}

/**
 * Génère le prochain numéro pour un type de document (devis ou facture)
 * Scanne tous les documents existants (brouillon ET enregistrés) et prend le dernier + 1
 */
export async function genererProchainNumero(
  clientId: string,
  type: 'devis' | 'factures'
): Promise<string> {
  const anneeActuelle = new Date().getFullYear()
  const prefixe = type === 'devis' ? 'DEV' : 'FAC'
  
  try {
    // Trouver le dernier numéro réellement utilisé (tous statuts confondus)
    const dernierUtilise = await trouverDernierNumeroUtilise(clientId, type, anneeActuelle, prefixe)
    
    // Le prochain numéro est le dernier + 1, ou 1 si aucun document n'existe
    const prochainNumero = dernierUtilise + 1
    
    // Générer le numéro formaté
    const numeroFormate = `${prefixe}-${anneeActuelle}-${prochainNumero.toString().padStart(3, '0')}`
    
    return numeroFormate
  } catch (error) {
    console.error('Erreur lors de la génération du numéro:', error)
    // En cas d'erreur, retourner le premier numéro de l'année
    return `${prefixe}-${anneeActuelle}-001`
  }
}

/**
 * Vérifie si un numéro existe déjà (sécurité supplémentaire)
 */
export async function verifierNumeroExistant(
  clientId: string,
  numero: string,
  type: 'devis' | 'factures'
): Promise<boolean> {
  // Cette fonction pourrait être étendue pour vérifier dans les collections
  // devis ou factures si nécessaire
  return false
}

/**
 * Obtient la configuration de numérotation actuelle
 */
export async function obtenirConfigurationNumerotation(
  clientId: string
): Promise<NumerotationData | null> {
  try {
    const numerotationRef = doc(db, 'clients', clientId, 'numerotation', 'config')
    const numerotationDoc = await getDoc(numerotationRef)
    
    if (numerotationDoc.exists()) {
      return numerotationDoc.data() as NumerotationData
    }
    
    return null
  } catch (error) {
    console.error('Erreur lors de la récupération de la configuration de numérotation:', error)
    return null
  }
}

/**
 * Initialise la numérotation pour un nouveau client
 */
export async function initialiserNumerotation(clientId: string): Promise<void> {
  const anneeActuelle = new Date().getFullYear()
  
  const numerotationData: NumerotationData = {
    factures: {
      annee: anneeActuelle,
      dernier: 0,
      prefixe: 'FAC'
    },
    devis: {
      annee: anneeActuelle,
      dernier: 0,
      prefixe: 'DEV'
    },
    clients: {
      annee: anneeActuelle,
      dernier: 0,
      prefixe: 'CLI'
    }
  }
  
  const numerotationRef = doc(db, 'clients', clientId, 'numerotation', 'config')
  await setDoc(numerotationRef, numerotationData)
}

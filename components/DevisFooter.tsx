'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Edit3, Save, X } from 'lucide-react'

interface CompanyInfo {
  siret?: string
  numeroTVA?: string
  codeAPE?: string
  customFooterContent?: string
  customCompanyInfo?: string
  freeFieldContent?: string
}

interface ClientData {
  siret?: string
  numeroTVA?: string
  codeAPE?: string
  customFooterContent?: string
}

interface DevisFooterProps {
  className?: string
  showConditions?: boolean
  showCompanyInfo?: boolean
  showFreeField?: boolean
  showVATJustification?: boolean
  allTVAZero?: boolean
  customConditionsText?: string
  devisId?: string
  devisConditionsAcceptation?: string
  devisCustomCompanyInfo?: string
  devisFreeFieldContent?: string
  devisMotifExonerationTVA?: string
  onConditionsChange?: (newConditions: string) => void
  onCompanyInfoChange?: (newCompanyInfo: string) => void
  onFreeFieldChange?: (newFreeField: string) => void
  onVATJustificationChange?: (newMotif: string) => void
  onGetLocalStates?: React.MutableRefObject<(() => { localConditionsAcceptation: string; localCustomCompanyInfo: string }) | null>
}

export default function DevisFooter({ className = '', showConditions = true, showCompanyInfo = true, showFreeField = false, showVATJustification = false, allTVAZero = false, customConditionsText, devisId, devisConditionsAcceptation, devisCustomCompanyInfo, devisFreeFieldContent, devisMotifExonerationTVA, onConditionsChange, onCompanyInfoChange, onFreeFieldChange, onVATJustificationChange, onGetLocalStates }: DevisFooterProps) {
  const { user } = useAuth()
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({})
  const [isEditing, setIsEditing] = useState(false)
  const [customContent, setCustomContent] = useState('')
  const [customCompanyInfo, setCustomCompanyInfo] = useState('')
  const [isEditingCompanyInfo, setIsEditingCompanyInfo] = useState(false)
  const [freeFieldContent, setFreeFieldContent] = useState('')
  const [isEditingFreeField, setIsEditingFreeField] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  // État local pour les conditions modifiées dans un devis (sans jamais sauvegarder dans customFooterContent)
  const [localConditionsAcceptation, setLocalConditionsAcceptation] = useState('')
  // État local pour les informations d'entreprise modifiées dans un devis (sans jamais sauvegarder dans customCompanyInfo)
  const [localCustomCompanyInfo, setLocalCustomCompanyInfo] = useState('')
  // État local pour le champ libre modifié dans un devis (sans jamais sauvegarder dans le client racine)
  const [localFreeFieldContent, setLocalFreeFieldContent] = useState('')
  // État local pour le motif d'exonération de TVA
  const [localMotifExonerationTVA, setLocalMotifExonerationTVA] = useState('aucun')

  useEffect(() => {
    if (user?.uid) {
      loadCompanyInfo()
    }
  }, [user?.uid])

  // Exposer les states locaux au parent via le callback
  useEffect(() => {
    if (onGetLocalStates) {
      onGetLocalStates.current = () => ({
        localConditionsAcceptation,
        localCustomCompanyInfo
      })
    }
  }, [localConditionsAcceptation, localCustomCompanyInfo, onGetLocalStates])

  // Initialiser le contenu du champ libre depuis les props du devis seulement
  useEffect(() => {
    console.log('🔄 DevisFooter - Initialisation du champ libre depuis devis:', devisFreeFieldContent)
    if (devisFreeFieldContent !== undefined) {
      setLocalFreeFieldContent(devisFreeFieldContent)
    }
  }, [devisFreeFieldContent])

  // Initialiser le motif d'exonération de TVA depuis les props du devis
  useEffect(() => {
    if (devisMotifExonerationTVA !== undefined) {
      setLocalMotifExonerationTVA(devisMotifExonerationTVA)
    }
  }, [devisMotifExonerationTVA, devisId])

  const loadCompanyInfo = async () => {
    try {
      setLoading(true)
      
      // Find main client document
      const mainClientsQuery = query(
        collection(db, 'clients'),
        where('uidclient', '==', user?.uid)
      )
      const mainClientsSnapshot = await getDocs(mainClientsQuery)
      
      if (!mainClientsSnapshot.empty) {
        const mainClientDoc = mainClientsSnapshot.docs[0]
        const mainClientId = mainClientDoc.id
        const mainClientData = mainClientDoc.data()
        
        // Get data from main client document (numeroTVA, siret)
        const clientInfo = {
          siret: mainClientData.siret,
          numeroTVA: mainClientData.numeroTVA,
          codeAPE: mainClientData.codeAPE,
          customFooterContent: mainClientData.customFooterContent,
          customCompanyInfo: mainClientData.customCompanyInfo,
          freeFieldContent: mainClientData.freeFieldContent
        }
        
        setCompanyInfo(clientInfo)
        
        // Initialisation différente selon le contexte
        if (devisId) {
          // Mode devis : initialiser localConditionsAcceptation avec customFooterContent par défaut
          // Si le devis a déjà des conditions spécifiques, les utiliser, sinon prendre customFooterContent
          setLocalConditionsAcceptation(devisConditionsAcceptation || clientInfo.customFooterContent || '')
          // Ne PAS initialiser customContent pour éviter de toucher au client racine
          
          // Initialiser localCustomCompanyInfo avec les données du devis ou de la racine
          const defaultCompanyInfo = []
          if (mainClientData.siret) {
            defaultCompanyInfo.push(`SIREN ${mainClientData.siret}`)
          }
          if (mainClientData.codeAPE) {
            defaultCompanyInfo.push(`NAF ${mainClientData.codeAPE}`)
          }
          if (mainClientData.numeroTVA) {
            defaultCompanyInfo.push(`TVA intracommunautaire : ${mainClientData.numeroTVA}`)
          }
          
          // Vérifier si le devis a des informations d'entreprise personnalisées
          // Utiliser les infos du devis si elles existent, sinon les infos par défaut de la racine
          setLocalCustomCompanyInfo(devisCustomCompanyInfo || defaultCompanyInfo.join(' - '))
          
          // Initialiser le champ libre UNIQUEMENT avec les données du devis (pas de fallback client racine)
          setLocalFreeFieldContent(devisFreeFieldContent || '')
        } else {
          // Mode paramètres : initialiser avec le contenu du client racine
          const initialContent = clientInfo.customFooterContent === 'Pour être accepté, le devis doit être daté, signé et suivi de la mention manuscrite « Bon pour accord ».' ? '' : (clientInfo.customFooterContent || '')
          setCustomContent(initialContent)
          
          // Mode paramètres : initialiser le champ libre avec le contenu du client racine
          setFreeFieldContent(clientInfo.freeFieldContent || '')
        }
        
        // Build default company info from database values
        const defaultCompanyInfo = []
        if (mainClientData.siret) {
          defaultCompanyInfo.push(`SIREN ${mainClientData.siret}`)
        }
        if (mainClientData.codeAPE) {
          defaultCompanyInfo.push(`NAF ${mainClientData.codeAPE}`)
        }
        if (mainClientData.numeroTVA) {
          defaultCompanyInfo.push(`TVA intracommunautaire : ${mainClientData.numeroTVA}`)
        }
        
        // Use custom company info if exists, otherwise use built default from database
        setCustomCompanyInfo(mainClientData.customCompanyInfo || defaultCompanyInfo.join(' - '))
        
        // Set free field content - default to empty
        setFreeFieldContent('')
      }
    } catch (error) {
      console.error('Error loading company info:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveCustomContent = async () => {
    try {
      setSaving(true)
      
      console.log('🔍 DEBUG: devisId =', devisId)
      console.log('🔍 DEBUG: typeof devisId =', typeof devisId)
      console.log('🔍 DEBUG: !!devisId =', !!devisId)
      
      if (devisId && devisId !== "FORCE_DEVIS_MODE") {
        // Mode édition devis existant : sauvegarder dans clients/{idclient}/devis/{iddevis}/conditionsAcceptation
        console.log('💾 MODE ÉDITION DEVIS: Sauvegarde dans Firebase devis spécifique')
        
        const mainClientsQuery = query(
          collection(db, 'clients'),
          where('uidclient', '==', user?.uid)
        )
        const mainClientsSnapshot = await getDocs(mainClientsQuery)
        
        if (!mainClientsSnapshot.empty) {
          const mainClientDoc = mainClientsSnapshot.docs[0]
          const mainClientId = mainClientDoc.id
          
          const devisRef = doc(db, `clients/${mainClientId}/devis`, devisId)
          await updateDoc(devisRef, {
            conditionsAcceptation: localConditionsAcceptation,
            lastModified: serverTimestamp()
          })
          
          console.log('✅ Conditions sauvegardées dans le devis:', devisId)
          if (onConditionsChange) {
            onConditionsChange(localConditionsAcceptation)
          }
        }
        
        setIsEditing(false)
        return
      }
      
      if (devisId === "FORCE_DEVIS_MODE") {
        // Mode création nouveau devis : modifications locales uniquement
        console.log('🚫 MODE NOUVEAU DEVIS: Aucune sauvegarde Firebase - modifications locales uniquement')
        setIsEditing(false)
        return
      }
      
      // Mode paramètres globaux uniquement : sauvegarder dans le client racine
      console.log('💾 MODE PARAMÈTRES: Sauvegarde dans Firebase autorisée')
      const mainClientsQuery = query(
        collection(db, 'clients'),
        where('uidclient', '==', user?.uid)
      )
      const mainClientsSnapshot = await getDocs(mainClientsQuery)
      
      if (!mainClientsSnapshot.empty) {
        const mainClientDoc = mainClientsSnapshot.docs[0]
        const mainClientId = mainClientDoc.id
        
        const mainClientRef = doc(db, 'clients', mainClientId)
        const contentToSave = customContent.trim() === '' ? null : customContent
        // PROTECTION ABSOLUE: Ne JAMAIS modifier customFooterContent
        console.log('🚫 PROTECTION: customFooterContent ne sera JAMAIS modifié')
        // await updateDoc(mainClientRef, {
        //   customFooterContent: contentToSave,
        //   dateModification: new Date(),
        //   modifiePar: user?.uid
        // })
        
        setCompanyInfo(prev => ({ ...prev, customFooterContent: customContent }))
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Error saving custom content:', error)
    } finally {
      setSaving(false)
    }
  }

  const saveCustomCompanyInfo = async () => {
    try {
      setSaving(true)
      
      if (devisId && devisId !== "FORCE_DEVIS_MODE") {
        // Mode édition devis existant : sauvegarder dans clients/{idclient}/devis/{iddevis}/customCompanyInfo
        console.log('💾 MODE ÉDITION DEVIS: Sauvegarde customCompanyInfo dans Firebase devis spécifique')
        
        const mainClientsQuery = query(
          collection(db, 'clients'),
          where('uidclient', '==', user?.uid)
        )
        const mainClientsSnapshot = await getDocs(mainClientsQuery)
        
        if (!mainClientsSnapshot.empty) {
          const mainClientDoc = mainClientsSnapshot.docs[0]
          const mainClientId = mainClientDoc.id
          
          const devisRef = doc(db, `clients/${mainClientId}/devis`, devisId)
          await updateDoc(devisRef, {
            customCompanyInfo: localCustomCompanyInfo,
            lastModified: serverTimestamp()
          })
          
          console.log('✅ Informations entreprise sauvegardées dans le devis:', devisId)
        }
        
        setIsEditingCompanyInfo(false)
        return
      }
      
      if (devisId === "FORCE_DEVIS_MODE") {
        // Mode création nouveau devis : modifications locales uniquement
        console.log('🚫 MODE NOUVEAU DEVIS: Aucune sauvegarde customCompanyInfo dans Firebase - modifications locales uniquement')
        setIsEditingCompanyInfo(false)
        return
      }
      
      console.log('💾 MODE PARAMÈTRES: Sauvegarde customCompanyInfo dans Firebase')
      // Find main client document
      const mainClientsQuery = query(
        collection(db, 'clients'),
        where('uidclient', '==', user?.uid)
      )
      const mainClientsSnapshot = await getDocs(mainClientsQuery)
      
      if (!mainClientsSnapshot.empty) {
        const mainClientDoc = mainClientsSnapshot.docs[0]
        const mainClientId = mainClientDoc.id
        
        // Update main client document with custom company info
        const mainClientRef = doc(db, 'clients', mainClientId)
        await updateDoc(mainClientRef, {
          customCompanyInfo: customCompanyInfo,
          dateModification: new Date(),
          modifiePar: user?.uid
        })
        
        setCompanyInfo(prev => ({ ...prev, customCompanyInfo: customCompanyInfo }))
        setIsEditingCompanyInfo(false)
      }
    } catch (error) {
      console.error('Error saving custom company info:', error)
    } finally {
      setSaving(false)
    }
  }

  const saveFreeFieldContent = async () => {
    try {
      setSaving(true)
      
      if (devisId) {
        // Mode devis : JAMAIS sauvegarder dans Firebase, mais notifier le parent
        console.log('🚫 MODE DEVIS: Aucune sauvegarde freeFieldContent dans Firebase')
        console.log('✅ Champ libre mis à jour dans le devis:', devisId)
        if (onFreeFieldChange) {
          onFreeFieldChange(localFreeFieldContent)
        }
        setIsEditingFreeField(false)
        return // SORTIR IMMÉDIATEMENT
      }
      
      console.log('💾 MODE PARAMÈTRES: Sauvegarde freeFieldContent dans Firebase')
      // Find main client document
      const mainClientsQuery = query(
        collection(db, 'clients'),
        where('uidclient', '==', user?.uid)
      )
      const mainClientsSnapshot = await getDocs(mainClientsQuery)
      
      if (!mainClientsSnapshot.empty) {
        const mainClientDoc = mainClientsSnapshot.docs[0]
        const mainClientId = mainClientDoc.id
        
        // Update main client document with free field content
        const mainClientRef = doc(db, 'clients', mainClientId)
        await updateDoc(mainClientRef, {
          freeFieldContent: freeFieldContent,
          dateModification: new Date(),
          modifiePar: user?.uid
        })
        
        setCompanyInfo(prev => ({ ...prev, freeFieldContent: freeFieldContent }))
        setIsEditingFreeField(false)
      }
    } catch (error) {
      console.error('Error saving free field content:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (devisId) {
      // Mode devis : remettre les conditions locales à leur valeur initiale
      setLocalConditionsAcceptation(devisConditionsAcceptation || '')
    } else {
      // Mode paramètres : remettre le contenu du client racine
      setCustomContent(companyInfo.customFooterContent || '')
    }
    setIsEditing(false)
  }

  const handleCancelCompanyInfo = () => {
    if (devisId) {
      // Mode devis : remettre les informations locales à leur valeur initiale
      setLocalCustomCompanyInfo(companyInfo.customCompanyInfo || '')
    } else {
      // Mode paramètres : remettre le contenu du client racine
      setCustomCompanyInfo(companyInfo.customCompanyInfo || '')
    }
    setIsEditingCompanyInfo(false)
  }

  const handleCancelFreeField = () => {
    if (devisId) {
      // Mode devis : remettre le contenu local à sa valeur initiale
      setLocalFreeFieldContent(devisFreeFieldContent || '')
    } else {
      // Mode paramètres : remettre le contenu du client racine
      setFreeFieldContent(companyInfo.freeFieldContent || '')
    }
    setIsEditingFreeField(false)
  }

  if (loading) {
    return (
      <div className={`border-t border-gray-200 pt-4 mt-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  // Default legal text
  const defaultLegalText = "Pour être accepté, le devis doit être daté, signé et suivi de la mention manuscrite « Bon pour accord »."

  // Build company info line
  const companyInfoParts = []
  if (companyInfo.siret) companyInfoParts.push(`SIREN ${companyInfo.siret}`)
  if (companyInfo.codeAPE) companyInfoParts.push(`NAF ${companyInfo.codeAPE}`)
  if (companyInfo.numeroTVA) companyInfoParts.push(`TVA intracommunautaire : ${companyInfo.numeroTVA}`)

  const companyInfoLine = companyInfoParts.join(' - ')

  // Priorité d'affichage : conditions locales devis > texte par défaut
  const displayContent = (devisId ? localConditionsAcceptation : companyInfo.customFooterContent) || defaultLegalText

  return (
    <div className={`border-t border-gray-200 pt-4 mt-6 ${className}`}>
      <div className="relative">
        {/* Edit button - only show when conditions are enabled */}
        {showConditions && (
          <div className="absolute -top-2 -right-2">
            {!isEditing ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-6 w-6 p-0 hover:bg-gray-100"
              >
                <Edit3 className="w-3 h-3" />
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={saveCustomContent}
                  disabled={saving}
                  className="h-6 w-6 p-0 hover:bg-green-100"
                >
                  <Save className="w-3 h-3 text-green-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="h-6 w-6 p-0 hover:bg-red-100"
                >
                  <X className="w-3 h-3 text-red-600" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="pr-8">
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={devisId ? localConditionsAcceptation : customContent}
                onChange={(e) => {
                  if (devisId) {
                    setLocalConditionsAcceptation(e.target.value)
                    // NE PAS notifier le parent - garder les modifications locales uniquement
                  } else {
                    setCustomContent(e.target.value)
                  }
                }}
                placeholder="Saisissez votre contenu personnalisé ou laissez vide pour utiliser le texte par défaut..."
                className="min-h-[80px] text-xs resize-none"
                disabled={saving}
              />
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  Laissez vide pour utiliser le texte par défaut
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (devisId) {
                      setLocalConditionsAcceptation('')
                      // NE PAS notifier le parent - garder les modifications locales uniquement
                    } else {
                      setCustomContent('')
                    }
                  }}
                  className="h-6 text-xs px-2"
                >
                  Texte par défaut
                </Button>
              </div>
              <div className="text-xs text-gray-500 italic">
                "{defaultLegalText}"
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              
              {showConditions && (
                <div className="text-center">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {displayContent}
                  </p>
                </div>
              )}
              {showFreeField && (
                <div className="relative">
                  {/* Edit button for free field */}
                  <div className="absolute -top-2 -right-2">
                    {!isEditingFreeField ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingFreeField(true)}
                        className="h-6 w-6 p-0 hover:bg-gray-100"
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                    ) : (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={saveFreeFieldContent}
                          disabled={saving}
                          className="h-6 w-6 p-0 hover:bg-green-100"
                        >
                          <Save className="w-3 h-3 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelFreeField}
                          className="h-6 w-6 p-0 hover:bg-red-100"
                        >
                          <X className="w-3 h-3 text-red-600" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Free field content */}
                  <div className="pr-8">
                    {isEditingFreeField ? (
                      <div className="space-y-2">
                        <Textarea
                          value={devisId ? localFreeFieldContent : freeFieldContent}
                          onChange={(e) => devisId ? setLocalFreeFieldContent(e.target.value) : setFreeFieldContent(e.target.value)}
                          placeholder="Champ libre"
                          className="min-h-[60px] text-xs resize-none text-center"
                          disabled={saving}
                        />
                        <div className="text-xs text-gray-500 text-center">
                          Champ libre personnalisable
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        {(devisId ? localFreeFieldContent : freeFieldContent) ? (
                          <p className="text-xs text-gray-500 leading-relaxed">
                            {devisId ? localFreeFieldContent : freeFieldContent}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 italic leading-relaxed">
                            Cliquez sur l'icône d'édition pour ajouter du contenu au champ libre
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {showCompanyInfo && (
                <div className="relative">
                  {/* Edit button for company info */}
                  <div className="absolute -top-2 -right-2">
                    {!isEditingCompanyInfo ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingCompanyInfo(true)}
                        className="h-6 w-6 p-0 hover:bg-gray-100"
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                    ) : (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={saveCustomCompanyInfo}
                          disabled={saving}
                          className="h-6 w-6 p-0 hover:bg-green-100"
                        >
                          <Save className="w-3 h-3 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelCompanyInfo}
                          className="h-6 w-6 p-0 hover:bg-red-100"
                        >
                          <X className="w-3 h-3 text-red-600" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Company info content */}
                  <div className="pr-8">
                    {isEditingCompanyInfo ? (
                      <div className="space-y-2">
                        <Textarea
                          value={devisId ? localCustomCompanyInfo : customCompanyInfo}
                          onChange={(e) => {
                            if (devisId) {
                              setLocalCustomCompanyInfo(e.target.value)
                            } else {
                              setCustomCompanyInfo(e.target.value)
                            }
                          }}
                          placeholder="SIREN 12456352987 - NAF 1234Z - TVA intracommunautaire : FR123456789012"
                          className="min-h-[60px] text-xs resize-none text-center"
                          disabled={saving}
                        />
                        <div className="text-xs text-gray-500 text-center">
                          Informations d'entreprise personnalisables
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 text-center">
                        {devisId ? localCustomCompanyInfo : customCompanyInfo}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>


        {/* Character count for editing */}
        {isEditing && (
          <div className="text-right mt-2">
            <span className="text-xs text-gray-500">
              {customContent.length} caractères
            </span>
          </div>
        )}
      </div>
    </div>
  )
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

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
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
}

export default function DevisFooter({ className = '', showConditions = true, showCompanyInfo = true, showFreeField = false }: DevisFooterProps) {
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

  useEffect(() => {
    if (user?.uid) {
      loadCompanyInfo()
    }
  }, [user?.uid])

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
        setCustomContent(clientInfo.customFooterContent || '')
        
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
        
        // Set free field content
        setFreeFieldContent(mainClientData.freeFieldContent || '')
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
      
      // Find main client document
      const mainClientsQuery = query(
        collection(db, 'clients'),
        where('uidclient', '==', user?.uid)
      )
      const mainClientsSnapshot = await getDocs(mainClientsQuery)
      
      if (!mainClientsSnapshot.empty) {
        const mainClientDoc = mainClientsSnapshot.docs[0]
        const mainClientId = mainClientDoc.id
        
        // Update main client document with custom content
        const mainClientRef = doc(db, 'clients', mainClientId)
        await updateDoc(mainClientRef, {
          customFooterContent: customContent,
          dateModification: new Date(),
          modifiePar: user?.uid
        })
        
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
    setCustomContent(companyInfo.customFooterContent || '')
    setIsEditing(false)
  }

  const handleCancelCompanyInfo = () => {
    setCustomCompanyInfo(companyInfo.customCompanyInfo || '')
    setIsEditingCompanyInfo(false)
  }

  const handleCancelFreeField = () => {
    setFreeFieldContent(companyInfo.freeFieldContent || '')
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

  // Use custom content if available, otherwise use default
  const displayContent = companyInfo.customFooterContent || defaultLegalText

  return (
    <div className={`border-t border-gray-200 pt-4 mt-6 ${className}`}>
      <div className="relative">
        {/* Edit button */}
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

        {/* Content */}
        <div className="pr-8">
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={customContent}
                onChange={(e) => setCustomContent(e.target.value)}
                placeholder="Saisissez votre contenu personnalisé ou laissez vide pour utiliser le texte par défaut..."
                className="min-h-[80px] text-xs resize-none"
                disabled={saving}
              />
              <div className="text-xs text-gray-500">
                Laissez vide pour utiliser le texte par défaut : "{defaultLegalText}"
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {showConditions && (
                <div className="text-center">
                  <p className="text-xs text-gray-600 leading-relaxed">
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
                          value={freeFieldContent}
                          onChange={(e) => setFreeFieldContent(e.target.value)}
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
                        {freeFieldContent ? (
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {freeFieldContent}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 italic leading-relaxed">
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
                          value={customCompanyInfo}
                          onChange={(e) => setCustomCompanyInfo(e.target.value)}
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
                        {customCompanyInfo}
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
            <span className="text-xs text-gray-400">
              {customContent.length} caractères
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

// Interfaces pour les données du devis
interface DevisData {
  numeroDevis: string
  dateCreation: string
  validiteTexte: string
  customCompanyInfo?: string
  lignes: LigneDevis[]
  montantTotalHT: number
  montantTotalTVA: number
  montantTotalTTC: number
  conditions?: string
  notes?: string
  conditionsAcceptation?: string
  intituleDocument?: string
  champLibre?: string
  motifExonerationTVA?: string
  options: {
    typeFacturation: 'rapide' | 'complet'
    adresseLivraison: boolean
    conditionsAcceptation: boolean
    remiseGlobale: boolean
    siretClient: boolean
    tvaIntracommunautaire: boolean
    intituleDocument: boolean
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
  description?: string
  quantite: number
  unite: string
  prixUnitaireHT: number
  tauxTVA: number
  montantHT: number
  remise: number
  isDesignationOnly?: boolean
  isRemiseGlobale?: boolean
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

interface DevisPDFProps {
  devis: DevisData
  client: ClientData
  company: CompanyInfo
}

// Styles fidèles au design web
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 32,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#111827',
  },

  // HEADER - Layout identique au web
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  
  // Section entreprise (gauche)
  companySection: {
    width: '45%',
    flexDirection: 'column',
  },
  logoBox: {
    width: 64,
    height: 64,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    border: '2px dashed #e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logo: { width: 60, height: 60, objectFit: 'contain' },
  companyType: { 
    fontSize: 10, 
    color: '#6b7280', 
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 2,
    marginTop: 2,
    letterSpacing: 0.5
  },
  companyName: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginBottom: 2,
    color: '#111827'
  },
  companyAddress: { 
    fontSize: 12, 
    color: '#4b5563', 
    lineHeight: 1.3 
  },

  // Section client (droite)
  clientSection: {
    width: '50%',
    alignItems: 'flex-end',
    marginTop: 90,
    marginBottom: 20
  },
  clientBox: {
    width: '100%',
    paddingTop: 20,
  },
  clientName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'right',
    color: '#111827',
  },
  clientAddress: {
    fontSize: 12,
    color: '#4b5563',
    textAlign: 'right',
    marginBottom: 2
  },
  clientSiret: {
    fontSize: 12,
    color: '#111827',
    textAlign: 'right',
    marginTop: 8,
  },
  clientInfoLabel: {
    fontSize: 8,
    color: '#6b7280',
    fontWeight: 'light',
    textAlign: 'right',
    marginRight: 4,
  },

  clientTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'right',
    color: '#111827',
  },

  // INFOS DEVIS
  devisInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  infoBox: {
    borderRadius: 4,
    padding: 6,
    width: '30%',
  },
  infoLabel: { fontSize: 8, color: '#6b7280', marginBottom: 2, fontWeight: 'light' },
  infoValue: { fontSize: 12, color: '#111827' },

  // TABLEAU
  table: {
    marginTop: 10,
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#dbeafe',
    padding: 8,
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    minHeight: 32,
    alignItems: 'center',
  },
  tableRowEven: { backgroundColor: '#f9fafb' },
  tableRowRemise: { backgroundColor: '#e9eff7', borderTopWidth: 1, borderTopColor: '#2563eb' },
  tableText: {
    fontSize: 10,
    color: '#111827',
  },
  
  // Colonnes mode rapide
  colDesignationRapide: { width: '65%', paddingRight: 8 },
  colTVA: { width: '15%', textAlign: 'center' },
  colMontantRapide: { width: '20%', textAlign: 'right' },
  
  // Colonnes mode complet
  colDesignationComplet: { width: '35%', paddingRight: 8 },
  colQuantite: { width: '12%', textAlign: 'center' },
  colUnite: { width: '12%', textAlign: 'center' },
  colPrixUnitaire: { width: '15%', textAlign: 'right' },
  colMontantComplet: { width: '16%', textAlign: 'right' },
  
  // Textes dans les cellules
  designationText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  descriptionText: {
    fontSize: 9,
    color: '#6b7280',
    lineHeight: 1.3,
  },

  // TOTAUX
  totalsSection: { alignItems: 'flex-end', marginTop: 20 },
  totalRow: {
    flexDirection: 'row',
    width: 200,
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 11,
    color: '#4b5563',
  },
  totalValue: {
    fontSize: 11,
    color: '#111827',
    fontWeight: 'bold',
  },
  totalRowFinal: {
    flexDirection: 'row',
    width: 200,
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 6,
    marginTop: 4,
  },
  totalLabelFinal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  totalValueFinal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2563eb',
  },

  // NOTES
  notesSection: { marginTop: 20 },
  notesTitle: { fontSize: 9, fontWeight: 'bold', marginBottom: 4 },
  notesText: { fontSize: 9, color: '#6b7280', lineHeight: 1.4 },

  // CONDITIONS D'ACCEPTATION
  conditionsAcceptation: {
    marginTop: 8,
    marginBottom: 10,
  },
  conditionsText: {
    fontSize: 8,
    color: '#374151',
    lineHeight: 1.4,
    textAlign: 'justify',
    fontStyle: 'italic',
  },

  // FOOTER
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 32,
    right: 32,
    borderTopWidth: 0.5,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
    textAlign: 'center',
  },
  footerTextMarginTop: {
    marginTop: 8,
  },
})

const DevisPDF: React.FC<DevisPDFProps> = ({ devis, client, company }) => {
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-FR')

  const formatPrice = (price: number) => `${price.toFixed(2)} €`

  // Debug: Afficher les données reçues
  console.log('🎯 DevisPDF - Données reçues:')
  console.log('- devis.remiseGlobale:', devis.remiseGlobale)
  console.log('- devis.sousTotal:', devis.sousTotal)
  console.log('- devis.remiseHT:', devis.remiseHT)
  console.log('- devis.options.remiseGlobale:', devis.options.remiseGlobale)
  console.log('- devis.montantTotalHT:', devis.montantTotalHT)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.headerTop}>
          {/* Section entreprise (gauche) */}
          <View style={styles.companySection}>
            {company.logo ? (
              <Image 
                style={styles.logo} 
                src={`/api/proxy-image?url=${encodeURIComponent(company.logo)}`}
              />
            ) : (
              <View style={styles.logoBox}>
                <Text style={{ fontSize: 8, color: '#9ca3af' }}>LOGO</Text>
              </View>
            )}
            {company.formeJuridique && (
              <Text style={styles.companyType}>{company.formeJuridique}</Text>
            )}
            <Text style={styles.companyName}>{company.nom}</Text>
            <Text style={styles.companyAddress}>{company.adresseSiege.adresse}</Text>
            <Text style={styles.companyAddress}>
              {company.adresseSiege.codePostal} {company.adresseSiege.ville}
            </Text>
             {/* Adresse de livraison conditionnelle */}
            {devis.options.adresseLivraison && devis.adresseLivraison && (
              <View style={{ marginBottom: 36, marginTop: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 2, color: '#111827' }}>
                  Adresse de livraison
                </Text>
                <View style={{  }}>
                  <Text style={{ fontSize: 11, color: '#4b5563', marginBottom: 2 }}>
                    {devis.adresseLivraison.adresse}
                  </Text>
                  {devis.adresseLivraison.complementAdresse && (
                    <Text style={{ fontSize: 11, color: '#4b5563', marginBottom: 2 }}>
                      {devis.adresseLivraison.complementAdresse}
                    </Text>
                  )}
                  <Text style={{ fontSize: 11, color: '#4b5563' }}>
                    {devis.adresseLivraison.codePostal} {devis.adresseLivraison.ville}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Section client (droite) */}
          <View style={styles.clientSection}>
            <View style={styles.clientBox}>
              <Text style={styles.clientTitle}>Client</Text>
              <Text style={styles.clientAddress}>
                {client.typeClient === 'entreprise'
                  ? client.nomEntreprise
                  : `${client.prenom || ''} ${client.nom || ''}`}
              </Text>
              {client.adresse && <Text style={styles.clientAddress}>{client.adresse}</Text>}
              {client.complementAdresse && (
                <Text style={styles.clientAddress}>{client.complementAdresse}</Text>
              )}
              {client.codePostal && client.ville && (
                <Text style={styles.clientAddress}>
                  {client.codePostal} {client.ville}
                </Text>
              )}
              {/* SIRET et TVA conditionnels */}
              {devis.options.siretClient && client.siret && (
                <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'baseline' }}>
                  <Text style={styles.clientInfoLabel}>SIRET: </Text>
                  <Text style={styles.clientAddress}>{client.siret}</Text>
                </View>
              )}
              {devis.options.tvaIntracommunautaire && client.numeroTVA && (
                <View style={{ marginTop: 4, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'baseline' }}>
                  <Text style={styles.clientInfoLabel}>TVA: </Text>
                  <Text style={styles.clientAddress}>{client.numeroTVA}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Intitulé de document conditionnel */}
        {devis.options.intituleDocument && devis.intituleDocument && (
          <View style={{ marginBottom: 24, alignItems: 'flex-start' }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#111827' }}>
              {devis.intituleDocument}
            </Text>
          </View>
        )}

        {/* INFOS DEVIS */}
        <View style={styles.devisInfo}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>N° de devis</Text>
            <Text style={styles.infoValue}>{devis.numeroDevis}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Date d’émission</Text>
            <Text style={styles.infoValue}>{formatDate(devis.dateCreation)}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Période de validité</Text>
            <Text style={styles.infoValue}>{devis.validiteTexte}</Text>
          </View>
        </View>

        {/* TABLEAU - Adaptatif selon le type de facturation */}
        <View style={styles.table}>
          {devis.options.typeFacturation === 'rapide' ? (
            <>
              {/* En-têtes mode rapide */}
              <View style={styles.tableHeader}>
                <Text style={[styles.colDesignationRapide, styles.tableHeaderText]}>Désignation</Text>
                <Text style={[styles.colTVA, styles.tableHeaderText]}>TVA</Text>
                <Text style={[styles.colMontantRapide, styles.tableHeaderText]}>Montant HT</Text>
              </View>

              {/* Lignes mode rapide */}
              {devis.lignes.map((ligne, index) => (
                ligne.isDesignationOnly ? (
                  <View
                    key={index}
                    style={[styles.tableRow, { backgroundColor: '#f9fafb' }]}
                  >
                    <View style={{ width: '100%', paddingRight: 8 }}>
                      <Text style={styles.designationText}>{ligne.designation}</Text>
                      {ligne.description && (
                        <Text style={styles.descriptionText}>{ligne.description}</Text>
                      )}
                    </View>
                  </View>
                ) : ligne.isRemiseGlobale ? (
                  <View
                    key={index}
                    style={[styles.tableRow, styles.tableRowRemise]}
                  >
                    <View style={{ width: '40%', paddingRight: 10 }}>
                      <Text style={styles.designationText}>{ligne.designation}</Text>
                    </View>
                    <Text style={[{ width: '40%', textAlign: 'right' }, styles.tableText]}>{ligne.prixUnitaireHT}%                                                    {formatPrice(ligne.montantHT)}</Text>
                  </View>
                ) : (
                  <View
                    key={index}
                    style={[styles.tableRow, { backgroundColor: '#ffffff' }]}
                  >
                    <View style={styles.colDesignationRapide}>
                      <Text style={styles.designationText}>{ligne.designation}</Text>
                      {ligne.description && (
                        <Text style={styles.descriptionText}>{ligne.description}</Text>
                      )}
                    </View>
                    <Text style={[styles.colTVA, styles.tableText]}>{ligne.tauxTVA}%</Text>
                    <Text style={[styles.colMontantRapide, styles.tableText]}>{formatPrice(ligne.montantHT)}</Text>
                  </View>
                )
              ))}
            </>
          ) : (
            <>
              {/* En-têtes mode complet */}
              <View style={styles.tableHeader}>
                <Text style={[styles.colDesignationComplet, styles.tableHeaderText]}>Désignation</Text>
                <Text style={[styles.colQuantite, styles.tableHeaderText]}>Quantité</Text>
                <Text style={[styles.colUnite, styles.tableHeaderText]}>Unité</Text>
                <Text style={[styles.colPrixUnitaire, styles.tableHeaderText]}>Prix unitaire</Text>
                <Text style={[styles.colTVA, styles.tableHeaderText]}>TVA</Text>
                <Text style={[styles.colMontantComplet, styles.tableHeaderText]}>Montant HT</Text>
              </View>

              {/* Lignes mode complet */}
              {devis.lignes.map((ligne, index) => (
                ligne.isDesignationOnly ? (
                  <View
                    key={index}
                    style={[styles.tableRow, { backgroundColor: '#f9fafb' }]}
                  >
                    <View style={{ width: '100%', paddingRight: 8 }}>
                      <Text style={styles.designationText}>{ligne.designation}</Text>
                      {ligne.description && (
                        <Text style={styles.descriptionText}>{ligne.description}</Text>
                      )}
                    </View>
                  </View>
                ) : ligne.isRemiseGlobale ? (
                  <View
                    key={index}
                    style={[styles.tableRow, styles.tableRowRemise]}
                  >
                    <View style={{ width: '70%', paddingRight: 8 }}>
                      <Text style={styles.designationText}>{ligne.designation}</Text>
                    </View>
                    <Text style={[{ width: '30%', textAlign: 'right' }, styles.tableText]}>{ligne.prixUnitaireHT}%               {formatPrice(ligne.montantHT)}</Text>
                  </View>
                ) : (
                  <View
                    key={index}
                    style={[styles.tableRow, { backgroundColor: '#ffffff' }]}
                  >
                    <View style={styles.colDesignationComplet}>
                      <Text style={styles.designationText}>{ligne.designation}</Text>
                      {ligne.description && (
                        <Text style={styles.descriptionText}>{ligne.description}</Text>
                      )}
                    </View>
                    <Text style={[styles.colQuantite, styles.tableText]}>{ligne.quantite}</Text>
                    <Text style={[styles.colUnite, styles.tableText]}>{ligne.unite}</Text>
                    <Text style={[styles.colPrixUnitaire, styles.tableText]}>{formatPrice(ligne.prixUnitaireHT)}</Text>
                    <Text style={[styles.colTVA, styles.tableText]}>{ligne.tauxTVA}%</Text>
                    <Text style={[styles.colMontantComplet, styles.tableText]}>{formatPrice(ligne.montantHT)}</Text>
                  </View>
                )
              ))}
            </>
          )}
        </View>

        {/* TOTAUX */}
        <View style={styles.totalsSection}>
          {devis.options?.remiseGlobale ? (
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{devis.montantTotalTVA > 0 ? 'Sous-total HT' : 'Sous-total'}</Text>
                <Text style={styles.totalValue}>{formatPrice(devis.sousTotal || 0)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{devis.montantTotalTVA > 0 ? 'Remise HT' : 'Remise'}</Text>
                <Text style={styles.totalValue}>-{formatPrice(devis.remiseHT || 0)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{devis.montantTotalTVA > 0 ? 'Total HT' : 'Total'}</Text>
                <Text style={styles.totalValue}>{formatPrice(devis.montantTotalHT)}</Text>
              </View>
            </>
          ) : (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{devis.montantTotalTVA > 0 ? 'Total HT' : 'Total'}</Text>
              <Text style={styles.totalValue}>{formatPrice(devis.montantTotalHT)}</Text>
            </View>
          )}
          {devis.montantTotalTVA > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TVA</Text>
              <Text style={styles.totalValue}>{formatPrice(devis.montantTotalTVA)}</Text>
            </View>
          )}
          <View style={styles.totalRowFinal}>
            <Text style={styles.totalLabelFinal}>
              {devis.montantTotalTVA > 0 ? 'Total TTC' : 'Total'}
            </Text>
            <Text style={styles.totalValueFinal}>{formatPrice(devis.montantTotalTTC)}</Text>
          </View>
        </View>

        {/* NOTES */}
        {(devis.notes || devis.conditions) && (
          <View style={styles.notesSection}>
            {devis.notes && (
              <View>
                <Text style={styles.notesTitle}>Notes :</Text>
                <Text style={styles.notesText}>{devis.notes}</Text>
              </View>
            )}
            {devis.conditions && (
              <View>
                <Text style={styles.notesTitle}>Conditions :</Text>
                <Text style={styles.notesText}>{devis.conditions}</Text>
              </View>
            )}
          </View>
        )}

        {/* FOOTER */}
        <View style={styles.footer}>
          {devis.motifExonerationTVA && devis.motifExonerationTVA !== 'aucun' && (
            <Text style={[styles.footerText, styles.footerTextMarginTop]}>
              {getMotifExonerationText(devis.motifExonerationTVA)}
            </Text>
          )}
          <Text style={[styles.footerText, styles.footerTextMarginTop]}>
              {devis.conditionsAcceptation || 'Pour être accepté, le devis doit être daté, signé et suivi de la mention manuscrite « Bon pour accord ».'}
            </Text>
          {devis.champLibre && (
            <Text style={[styles.footerText, styles.footerTextMarginTop]}>
              {devis.champLibre}
            </Text>
          )}
          <Text style={[styles.footerText, styles.footerTextMarginTop]}>
            {devis.customCompanyInfo}
          </Text>
        </View>
      </Page>
    </Document>
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

export default DevisPDF

import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

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
  conditionsAcceptation?: string
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

interface DevisPDFProps {
  devis: DevisData
  client: ClientData
  company: CompanyInfo
}

// Styles modernisés
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 32,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#111827',
  },

  // HEADER
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  logoSection: {
    width: '45%',
    flexDirection: 'column',
  },
  logoBox: {
    width: 70,
    height: 35,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logo: { width: 60, height: 30 },
  companyName: { fontSize: 11, fontWeight: 'bold', marginBottom: 2 },
  companyDetails: { fontSize: 8, color: '#6b7280', lineHeight: 1.3 },

  clientSection: {
    width: '50%',
    alignItems: 'flex-end',
    marginTop: 70, // 👈 décale le bloc client plus bas
  },
  clientBox: {
    // backgroundColor: '#f9fafb',
    borderRadius: 4,
    padding: 6,
    width: '100%',
  },
  clientName: {
    fontSize: 10,
    fontWeight: 'bold', // 👈 nom en gras
    marginBottom: 4,
    textAlign: 'right',
  },
  clientText: {
    fontSize: 9,
    color: '#111827',
    textAlign: 'right',
    lineHeight: 1.4,
  },

  // INFOS DEVIS
  devisInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoBox: {
    borderRadius: 4,
    padding: 6,
    width: '30%',
  },
  infoLabel: { fontSize: 7, color: '#6b7280', marginBottom: 2 },
  infoValue: { fontSize: 9, color: '#111827' },

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
    backgroundColor: '#eff6ff',
    padding: 8,
  },
  tableHeaderText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },
  tableRowEven: { backgroundColor: '#f9fafb' },
  col1: { width: '35%' },
  col2: { width: '12%', textAlign: 'center' },
  col3: { width: '12%', textAlign: 'center' },
  col4: { width: '15%', textAlign: 'right' },
  col5: { width: '10%', textAlign: 'center' },
  col6: { width: '16%', textAlign: 'right' },

  // TOTAUX
  totalsSection: { alignItems: 'flex-end', marginTop: 20 },
  totalRow: {
    flexDirection: 'row',
    width: 200,
    justifyContent: 'space-between',
    fontSize: 9,
    marginBottom: 4,
  },
  totalRowFinal: {
    flexDirection: 'row',
    width: 200,
    justifyContent: 'space-between',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2563eb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 6,
    marginTop: 4,
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
    fontSize: 8,
    color: '#9ca3af',
    textAlign: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
})

const DevisPDF: React.FC<DevisPDFProps> = ({ devis, client, company }) => {
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-FR')

  const formatPrice = (price: number) => `${price.toFixed(2)} €`

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.headerTop}>
          {/* Entreprise */}
          <View style={styles.logoSection}>
            {company.logo ? (
              <Image style={styles.logo} src={company.logo} />
            ) : (
              <View style={styles.logoBox}>
                <Text>LOGO</Text>
              </View>
            )}
            {company.formeJuridique && (
              <Text style={styles.companyDetails}>{company.formeJuridique}</Text>
            )}
            <Text style={styles.companyName}>{company.nom}</Text>
            <Text style={styles.companyDetails}>{company.adresseSiege.adresse}</Text>
            <Text style={styles.companyDetails}>
              {company.adresseSiege.codePostal} {company.adresseSiege.ville}
            </Text>
          </View>

          {/* Client */}
          <View style={styles.clientSection}>
            <View style={styles.clientBox}>
              <Text style={styles.clientName}>
                {client.typeClient === 'entreprise'
                  ? client.nomEntreprise
                  : `${client.prenom || ''} ${client.nom || ''}`}
              </Text>
              {client.adresse && <Text style={styles.clientText}>{client.adresse}</Text>}
              {client.complementAdresse && (
                <Text style={styles.clientText}>{client.complementAdresse}</Text>
              )}
              {client.codePostal && client.ville && (
                <Text style={styles.clientText}>
                  {client.codePostal} {client.ville}
                </Text>
              )}
            </View>
          </View>
        </View>

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

        {/* TABLEAU */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.col1, styles.tableHeaderText]}>Désignation</Text>
            <Text style={[styles.col2, styles.tableHeaderText]}>Quantité</Text>
            <Text style={[styles.col3, styles.tableHeaderText]}>Unité</Text>
            <Text style={[styles.col4, styles.tableHeaderText]}>Prix unitaire</Text>
            <Text style={[styles.col5, styles.tableHeaderText]}>TVA</Text>
            <Text style={[styles.col6, styles.tableHeaderText]}>Montant HT</Text>
          </View>

          {devis.lignes.map((ligne, index) => (
            <View
              key={index}
              style={[styles.tableRow, ...(index % 2 === 1 ? [styles.tableRowEven] : [])]}
            >
              <Text style={styles.col1}>{ligne.designation}</Text>
              <Text style={styles.col2}>{ligne.quantite}</Text>
              <Text style={styles.col3}>{ligne.unite}</Text>
              <Text style={styles.col4}>{formatPrice(ligne.prixUnitaireHT)}</Text>
              <Text style={styles.col5}>{ligne.tauxTVA}%</Text>
              <Text style={styles.col6}>{formatPrice(ligne.montantHT)}</Text>
            </View>
          ))}
        </View>

        {/* TOTAUX */}
        <View style={styles.totalsSection}>
          {devis.options.remiseGlobale && devis.sousTotal && devis.remiseHT ? (
            <>
              <View style={styles.totalRow}>
                <Text>Sous-total HT</Text>
                <Text>{formatPrice(devis.sousTotal)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text>Remise HT</Text>
                <Text>-{formatPrice(devis.remiseHT)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text>Total HT</Text>
                <Text>{formatPrice(devis.montantTotalHT)}</Text>
              </View>
            </>
          ) : (
            <View style={styles.totalRow}>
              <Text>Total HT</Text>
              <Text>{formatPrice(devis.montantTotalHT)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text>TVA</Text>
            <Text>{formatPrice(devis.montantTotalTVA)}</Text>
          </View>
          <View style={styles.totalRowFinal}>
            <Text>Total TTC</Text>
            <Text>{formatPrice(devis.montantTotalTTC)}</Text>
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

        {/* CONDITIONS D'ACCEPTATION */}

        {/* FOOTER */}
        <View style={styles.footer}>
          {devis.options.conditionsAcceptation && (
            <Text style={styles.conditionsText}>
              {devis.conditionsAcceptation || 'Pour être accepté, le devis doit être daté, signé et suivi de la mention manuscrite « Bon pour accord ».'}
            </Text>
          )}
          <Text>
            SIREN {company.siret} - NAF {company.codeAPE} - TVA intracommunautaire :{' '}
            {company.numeroTVA}
          </Text>
        </View>
      </Page>
    </Document>
  )
}

export default DevisPDF

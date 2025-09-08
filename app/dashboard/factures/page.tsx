'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Receipt, Plus, Search, Filter, Eye, Edit, Calendar, Euro, Clock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import Loader, { PulseLoader } from '@/components/ui/loader'
import { useRouter } from 'next/navigation'
import { useFactures, Facture } from '@/hooks/useFactures'

export default function FacturesPage() {
  const { user, clientData, loading: authLoading } = useAuth()
  const { factures, loading: facturesLoading } = useFactures()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  console.log('📋 FacturesPage render:', {
    user: user?.uid,
    authLoading,
    facturesLoading,
    facturesCount: factures.length,
    factures
  })

  // Vérification d'authentification
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <PulseLoader text="Chargement des factures..." />
      </div>
    )
  }

  // Filtrer les factures selon le terme de recherche et le statut
  const filteredFactures = factures.filter((factureItem: Facture) => {
    const matchesSearch = 
      factureItem.numeroFacture.toLowerCase().includes(searchTerm.toLowerCase()) ||
      factureItem.clientNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      factureItem.clientEmail.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || factureItem.statut === filterStatus
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'brouillon':
        return <Badge variant="secondary">Brouillon</Badge>
      case 'envoyee':
        return <Badge variant="outline">Envoyée</Badge>
      case 'payee':
        return <Badge variant="default" className="bg-green-600">Payée</Badge>
      case 'en_retard':
        return <Badge variant="destructive">En retard</Badge>
      case 'annulee':
        return <Badge variant="secondary" className="bg-gray-600">Annulée</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (date: any) => {
    if (!date) return '-'
    const dateObj = date.toDate ? date.toDate() : new Date(date)
    return dateObj.toLocaleDateString('fr-FR')
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const isOverdue = (facture: Facture) => {
    if (facture.statut === 'payee' || facture.statut === 'annulee') return false
    if (!facture.dateEcheance) return false
    
    const echeance = facture.dateEcheance.toDate ? facture.dateEcheance.toDate() : new Date(facture.dateEcheance)
    return new Date() > echeance
  }

  if (!user || !clientData) {
    return null
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Factures
          </h1>
        </div>
      </header>
      
      <div className="flex-1 overflow-auto p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="container mx-auto space-y-6"
        >
          {(facturesLoading || authLoading) ? (
            <div className="flex justify-center items-center min-h-[60vh]">
              <PulseLoader text="Chargement des factures..." />
            </div>
          ) : factures.length === 0 ? (
            <motion.div variants={itemVariants} className="flex justify-center items-center min-h-[60vh]">
              <Card className="w-full max-w-md mx-auto">
                <CardContent className="flex flex-col items-center gap-6 py-12 px-8 text-center">
                  <div className="relative">
                    <div className="absolute -top-2 -left-2 w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full opacity-30"></div>
                    <div className="absolute -top-1 -right-1 w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full opacity-40"></div>
                    <div className="absolute -bottom-1 -left-1 w-10 h-10 bg-gray-150 dark:bg-gray-750 rounded-full opacity-50"></div>
                    <div className="relative bg-gray-100 dark:bg-gray-800 rounded-full p-6">
                      <Receipt className="w-12 h-12 text-gray-600 dark:text-gray-400" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                      Vous n'avez pas encore créé de factures
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      Créez vos premières factures pour vos clients et suivez
                      facilement vos paiements et échéances.
                    </p>
                  </div>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    size="lg"
                    onClick={() => {/* TODO: Open facture creation modal */}}
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Créer une nouvelle facture
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <>
              {/* Filtres */}
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Rechercher une facture..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="brouillon">Brouillon</option>
                  <option value="envoyee">Envoyée</option>
                  <option value="payee">Payée</option>
                  <option value="en_retard">En retard</option>
                  <option value="annulee">Annulée</option>
                </select>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => {/* TODO: Open facture creation modal */}}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle facture
                </Button>
              </motion.div>

              {/* Tableau des factures */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Numéro</TableHead>
                          <TableHead>Nom du client</TableHead>
                          <TableHead>Échéance</TableHead>
                          <TableHead>Montant HT</TableHead>
                          <TableHead>Montant TTC</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredFactures.map((factureItem: Facture) => (
                          <TableRow key={factureItem.id} className={isOverdue(factureItem) ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                {formatDate(factureItem.dateCreation)}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {factureItem.numeroFacture}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-semibold">{factureItem.clientNom}</div>
                                <div className="text-sm text-gray-500">{factureItem.clientEmail}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {isOverdue(factureItem) && <Clock className="w-4 h-4 text-red-500" />}
                                <span className={isOverdue(factureItem) ? 'text-red-600 font-medium' : ''}>
                                  {formatDate(factureItem.dateEcheance)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Euro className="w-4 h-4 text-gray-400" />
                                {formatAmount(factureItem.montantHT)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Euro className="w-4 h-4 text-gray-400" />
                                {formatAmount(factureItem.montantTTC)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(factureItem.statut)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {/* TODO: View facture details */}}
                                  className="flex items-center gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  Voir
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {/* TODO: Edit facture */}}
                                  className="flex items-center gap-2"
                                >
                                  <Edit className="w-4 h-4" />
                                  Modifier
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </motion.div>
      </div>
    </>
  )
}

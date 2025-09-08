'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Users, Plus, Search, Filter, Eye, Edit } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import Loader, { PulseLoader } from '@/components/ui/loader'
import { ClientDrawer } from '@/components/ClientDrawer'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useClients, Client } from '@/hooks/useClients'

export default function ClientsPage() {
  const { user, clientData, loading: authLoading } = useAuth()
  const { clients, loading: clientsLoading } = useClients()
  const router = useRouter()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')

  console.log('📋 ClientsPage render:', {
    user: user?.uid,
    authLoading,
    clientsLoading,
    clientsCount: clients.length,
    clients
  })

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setIsDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false)
    setEditingClient(null)
  }

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
        <PulseLoader text="Chargement des clients..." />
      </div>
    )
  }

  // Filtrer les clients selon le terme de recherche et le type
  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.nomEntreprise.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = filterType === 'all' || client.typeClient === filterType
    
    return matchesSearch && matchesType
  })

  if (!user || !clientData) {
    return null
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Clients
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
          {(clientsLoading || authLoading) ? (
            <div className="flex justify-center items-center min-h-[60vh]">
              <PulseLoader text="Chargement des clients..." />
            </div>
          ) : clients.length === 0 ? (
            <motion.div variants={itemVariants} className="flex justify-center items-center min-h-[60vh]">
              <Card className="w-full max-w-md mx-auto">
                <CardContent className="flex flex-col items-center gap-6 py-12 px-8 text-center">
                  <div className="relative">
                    <div className="absolute -top-2 -left-2 w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full opacity-30"></div>
                    <div className="absolute -top-1 -right-1 w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full opacity-40"></div>
                    <div className="absolute -bottom-1 -left-1 w-10 h-10 bg-gray-150 dark:bg-gray-750 rounded-full opacity-50"></div>
                    <div className="relative bg-gray-100 dark:bg-gray-800 rounded-full p-6">
                      <Users className="w-12 h-12 text-gray-600 dark:text-gray-400" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                      Vous n'avez pas encore ajouté de clients
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      Gérez efficacement vos clients et prospects pour optimiser la création
                      de factures et devis, le cœur de votre auto-entreprise!
                    </p>
                  </div>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    size="lg"
                    onClick={() => setIsDrawerOpen(true)}
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Ajouter un nouveau client
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
                    placeholder="Rechercher un client..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600"
                >
                  <option value="all">Tous les types</option>
                  <option value="particulier">Particulier</option>
                  <option value="entreprise">Entreprise</option>
                </select>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => setIsDrawerOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un client
                </Button>
              </motion.div>

              {/* Tableau des clients */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Nom</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Téléphone</TableHead>
                          <TableHead>Ville</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredClients.map((client) => (
                          <TableRow key={client.id}>
                            <TableCell>
                              <Badge variant={client.typeClient === 'entreprise' ? 'default' : 'secondary'}>
                                {client.typeClient === 'entreprise' ? 'Entreprise' : 'Particulier'}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {client.typeClient === 'entreprise' ? (
                                <div>
                                  <div className="font-semibold">{client.nomEntreprise}</div>
                                  <div className="text-sm text-gray-500">{client.nom} {client.prenom}</div>
                                </div>
                              ) : (
                                `${client.nom} ${client.prenom}`
                              )}
                            </TableCell>
                            <TableCell>{client.email || '-'}</TableCell>
                            <TableCell>{client.telephone || '-'}</TableCell>
                            <TableCell>{client.ville || '-'}</TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditClient(client)}
                                className="flex items-center gap-2"
                              >
                                <Edit className="w-4 h-4" />
                                Voir détails
                              </Button>
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
      
      <ClientDrawer 
        open={isDrawerOpen} 
        onOpenChange={handleCloseDrawer}
        editingClient={editingClient}
      />
    </>
  )
}

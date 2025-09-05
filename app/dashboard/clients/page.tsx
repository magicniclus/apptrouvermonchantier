'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Plus } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import Loader, { PulseLoader } from '@/components/ui/loader'
import { ClientDrawer } from '@/components/ClientDrawer'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ClientsPage() {
  const { user, clientData, loading: authLoading } = useAuth()
  const router = useRouter()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

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
          className="container mx-auto"
        >
          <motion.div variants={itemVariants} className="flex justify-center items-center min-h-[60vh]">
            <Card className="w-full max-w-md mx-auto">
              <CardContent className="flex flex-col items-center gap-6 py-12 px-8 text-center">
                {/* Icône avec cercles décoratifs */}
                <div className="relative">
                  <div className="absolute -top-2 -left-2 w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full opacity-30"></div>
                  <div className="absolute -top-1 -right-1 w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full opacity-40"></div>
                  <div className="absolute -bottom-1 -left-1 w-10 h-10 bg-gray-150 dark:bg-gray-750 rounded-full opacity-50"></div>
                  <div className="relative bg-gray-100 dark:bg-gray-800 rounded-full p-6">
                    <Users className="w-12 h-12 text-gray-600 dark:text-gray-400" />
                  </div>
                </div>

                {/* Titre et description */}
                <div className="space-y-3">
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    Vous n'avez pas encore ajouté de clients
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    Gérez efficacement vos clients et prospects pour optimiser la création
                    de factures et devis, le cœur de votre auto-entreprise!
                  </p>
                </div>

                {/* Bouton d'action */}
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
        </motion.div>
      </div>
      
      <ClientDrawer 
        open={isDrawerOpen} 
        onOpenChange={setIsDrawerOpen} 
      />
    </>
  )
}

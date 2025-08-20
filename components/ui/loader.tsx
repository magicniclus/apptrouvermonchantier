'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

interface PulseLoaderProps {
  className?: string
  text?: string
}

export function PulseLoader({ className, text }: PulseLoaderProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      <div className="relative">
        <motion.div
          className="w-20 h-20 bg-primary/20 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 0.3, 0.7]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute inset-0 w-20 h-20 bg-primary/40 rounded-full"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.5, 0.1, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
        />
        <motion.div
          className="absolute inset-2 w-16 h-16 bg-primary/60 rounded-full flex items-center justify-center"
          animate={{
            scale: [1, 0.8, 1],
            opacity: [1, 0.6, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        >
          <Image 
            src="/favicon.png" 
            alt="Logo" 
            width={40} 
            height={40}
            className="rounded-full"
          />
        </motion.div>
      </div>
      {text && (
        <motion.p
          className="text-lg font-medium text-gray-700 dark:text-gray-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  )
}

export default function Loader({ size = 'md', className, text }: LoaderProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <motion.div
        className={cn(
          'border-2 border-primary/20 border-t-primary rounded-full',
          sizeClasses[size]
        )}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
      {text && (
        <motion.p
          className={cn(
            'text-gray-600 dark:text-gray-400 font-medium',
            textSizeClasses[size]
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  )
}

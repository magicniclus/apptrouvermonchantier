'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface AddressSuggestion {
  id: string
  place_name: string
  text: string
  context: Array<{ id: string; text: string }>
}

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onAddressSelect: (address: string, postalCode: string, city: string) => void
  placeholder?: string
  className?: string
}

export function AddressAutocomplete({ 
  value, 
  onChange, 
  onAddressSelect, 
  placeholder = "Entrer l'adresse",
  className = "h-11"
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [justSelected, setJustSelected] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const searchAddresses = async (query: string) => {
    if (!query || query.length < 3 || justSelected || !isFocused) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

    // Test avec des données factices si pas de token
    if (!accessToken) {
      // Données de test
      const mockSuggestions = [
        {
          id: 'mock1',
          place_name: `${query} rue de la Paix, 75001 Paris, France`,
          text: `${query} rue de la Paix`,
          context: [
            { id: 'postcode.123', text: '75001' },
            { id: 'place.456', text: 'Paris' }
          ]
        },
        {
          id: 'mock2', 
          place_name: `${query} avenue des Champs-Élysées, 75008 Paris, France`,
          text: `${query} avenue des Champs-Élysées`,
          context: [
            { id: 'postcode.789', text: '75008' },
            { id: 'place.456', text: 'Paris' }
          ]
        }
      ]
      setSuggestions(mockSuggestions)
      setIsOpen(isFocused)
      return
    }

    setIsLoading(true)
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        new URLSearchParams({
          access_token: accessToken,
          country: 'FR',
          types: 'address',
          limit: '5',
          language: 'fr',
          proximity: '2.3522,48.8566', // Paris coordinates to bias towards mainland France
          bbox: '-5.142,41.333,9.560,51.124' // France mainland bounding box (excludes Corsica)
        })

      const response = await fetch(url)

      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.features || [])
        setIsOpen(isFocused)
      } else {
        console.error('Mapbox API error:', response.status)
      }
    } catch (error) {
      console.error('Erreur lors de la recherche d\'adresse:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchAddresses(value)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [value])

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    // Extraire l'adresse complète et séparer les parties
    const fullAddress = suggestion.place_name
    const parts = fullAddress.split(', ')
    
    // Prendre seulement la première partie qui contient numéro + nom de rue
    const streetAddress = parts[0]
    
    // Marquer qu'une sélection vient d'être faite
    setJustSelected(true)
    
    // Fermer immédiatement les suggestions
    setIsOpen(false)
    setSuggestions([])
    
    // Mettre à jour la valeur avec numéro + nom de rue
    onChange(streetAddress)
    
    // Extraire le code postal et la ville depuis le contexte
    let postalCode = ''
    let city = ''
    
    suggestion.context?.forEach(item => {
      if (item.id.startsWith('postcode')) {
        postalCode = item.text
      } else if (item.id.startsWith('place')) {
        city = item.text
      }
    })

    onAddressSelect(streetAddress, postalCode, city)
    
    // Retirer le focus de l'input pour éviter la réouverture
    if (inputRef.current) {
      inputRef.current.blur()
    }

    // Réinitialiser le flag après un délai
    setTimeout(() => {
      setJustSelected(false)
    }, 1000)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Réinitialiser le flag si l'utilisateur tape manuellement
    setJustSelected(false)
    onChange(e.target.value)
  }

  const handleInputFocus = () => {
    setIsFocused(true)
    // Ne rouvrir que si on a des suggestions ET qu'on n'a pas juste sélectionné une adresse
    if (suggestions.length > 0 && value.length >= 3 && !justSelected) {
      setIsOpen(true)
    }
  }

  const handleInputBlur = () => {
    setIsFocused(false)
    // Délai pour permettre le clic sur les suggestions
    setTimeout(() => {
      setIsOpen(false)
    }, 200)
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      
      {isOpen && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
            >
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {suggestion.text}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {suggestion.place_name}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  )
}

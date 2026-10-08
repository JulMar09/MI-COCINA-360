'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface Kitchen {
  id: string
  name: string
  businessType: string
  country: string
  currency: string
  foodCostTarget: number
  foodCostWarning: number
  foodCostCritical: number
  role?: string
}

interface KitchenContextType {
  kitchen: Kitchen | null
  loading: boolean
  refresh: () => void
}

const KitchenContext = createContext<KitchenContextType>({
  kitchen: null,
  loading: true,
  refresh: () => {},
})

export function KitchenProvider({ children }: { children: React.ReactNode }) {
  const [kitchen, setKitchen] = useState<Kitchen | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchKitchen = useCallback(async () => {
    try {
      const res = await fetch('/api/kitchens/current')
      if (res.ok) {
        const data = await res.json()
        setKitchen(data)
      }
    } catch {
      console.error('Failed to fetch kitchen')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchKitchen()
  }, [fetchKitchen])

  return (
    <KitchenContext.Provider value={{ kitchen, loading, refresh: fetchKitchen }}>
      {children}
    </KitchenContext.Provider>
  )
}

export function useKitchen() {
  return useContext(KitchenContext)
}

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useKitchen } from '@/lib/kitchen-context'
import { formatCurrency } from '@/lib/currency'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/ui/animate'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  ShoppingCart, Check, Clock, Package,
  AlertOctagon, AlertTriangle, Truck,
} from 'lucide-react'

interface ShoppingItem {
  id: string
  name: string
  category: string
  unit: string
  currentStock: number
  targetStock: number
  costPerUnit: number
  suggestedPurchase: number
  stockLevel: string
  stockLevelLabel: string
  stockLevelColor: string
  supplier: { id: string; name: string } | null
  status: 'pending' | 'purchased'
  purchasedAt: string | null
}

type FilterStatus = 'todos' | 'pending' | 'purchased'

export function ShoppingListClient() {
  const { kitchen } = useKitchen()
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos')

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/shopping-list')
      if (res.ok) setItems(await res.json())
    } catch { console.error('Failed to fetch shopping list') } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const currency = kitchen?.currency ?? 'EUR'

  const handleToggle = async (ingredientId: string, newStatus: 'pending' | 'purchased') => {
    setToggling(ingredientId)
    try {
      const res = await fetch('/api/shopping-list/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredientId, status: newStatus }),
      })
      if (res.ok) {
        setItems(prev => prev.map(item =>
          item.id === ingredientId
            ? { ...item, status: newStatus, purchasedAt: newStatus === 'purchased' ? new Date().toISOString() : null }
            : item
        ))
      }
    } catch { console.error('Failed to toggle') }
    finally { setToggling(null) }
  }

  // Counts
  const counts = useMemo(() => {
    let pending = 0, purchased = 0, estimatedCost = 0
    for (const item of items) {
      if (item.status === 'pending') {
        pending++
        estimatedCost += item.suggestedPurchase * item.costPerUnit
      } else {
        purchased++
      }
    }
    return { pending, purchased, total: items.length, estimatedCost }
  }, [items])

  // Filter
  const filtered = useMemo(() => {
    if (filterStatus === 'todos') return items
    return items.filter(i => i.status === filterStatus)
  }, [items, filterStatus])

  // Group by supplier
  const grouped = useMemo(() => {
    const groups: Record<string, { supplierName: string; items: ShoppingItem[] }> = {}
    for (const item of filtered) {
      const key = item.supplier?.id ?? '__sin_proveedor'
      const name = item.supplier?.name ?? 'Sin proveedor'
      if (!groups[key]) groups[key] = { supplierName: name, items: [] }
      groups[key].items.push(item)
    }
    return Object.entries(groups).sort(([a, ga], [b, gb]) => {
      if (a === '__sin_proveedor') return 1
      if (b === '__sin_proveedor') return -1
      return ga.supplierName.localeCompare(gb.supplierName)
    })
  }, [filtered])

  return (
    <div className="space-y-6">
      <FadeIn>
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-primary" /> Lista de compras
          </h1>
          <p className="text-muted-foreground mt-1">Productos necesarios según el inventario</p>
        </div>
      </FadeIn>

      {/* Summary Cards */}
      <FadeIn delay={0.1}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Total Productos</p>
              <p className="text-2xl font-mono font-bold mt-1">{counts.total}</p>
            </CardContent>
          </Card>
          <Card className={counts.pending > 0 ? 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20' : ''}>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Clock className="w-4 h-4 text-amber-500" /> Pendientes
              </p>
              <p className="text-2xl font-mono font-bold mt-1">{counts.pending}</p>
            </CardContent>
          </Card>
          <Card className={counts.purchased > 0 ? 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20' : ''}>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Check className="w-4 h-4 text-emerald-500" /> Comprados
              </p>
              <p className="text-2xl font-mono font-bold mt-1">{counts.purchased}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Coste estimado</p>
              <p className="text-2xl font-mono font-bold mt-1">{formatCurrency(counts.estimatedCost, currency)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">pendientes</p>
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      {/* Filters */}
      <FadeIn delay={0.15}>
        <div className="flex flex-wrap gap-2">
          {([
            { value: 'todos' as FilterStatus, label: 'Todos', count: counts.total },
            { value: 'pending' as FilterStatus, label: 'Pendientes', count: counts.pending, icon: <Clock className="w-3.5 h-3.5" /> },
            { value: 'purchased' as FilterStatus, label: 'Comprados', count: counts.purchased, icon: <Check className="w-3.5 h-3.5" /> },
          ]).map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilterStatus(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border inline-flex items-center gap-1.5 ${
                filterStatus === opt.value
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-background border-border text-muted-foreground hover:bg-accent'
              }`}
            >
              {opt.icon}
              {opt.label}
              <span className="font-mono">({opt.count})</span>
            </button>
          ))}
        </div>
      </FadeIn>

      {/* Content */}
      <FadeIn delay={0.2}>
        {loading ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Cargando lista de compras...</CardContent></Card>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No hay productos que comprar</p>
              <p className="text-sm text-muted-foreground mt-1">Todos los ingredientes están dentro de sus niveles de stock</p>
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No hay productos con el filtro seleccionado</CardContent></Card>
        ) : (
          <div className="space-y-6">
            {grouped.map(([key, group]) => (
              <Card key={key}>
                <div className="px-4 py-3 border-b bg-muted/30 rounded-t-lg">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Truck className="w-4 h-4 text-muted-foreground" />
                    {group.supplierName}
                    <Badge variant="secondary" className="text-xs font-mono">{group.items.length}</Badge>
                  </h3>
                </div>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ingrediente</TableHead>
                          <TableHead className="text-right">Stock actual</TableHead>
                          <TableHead className="text-right">Objetivo</TableHead>
                          <TableHead className="text-right">Compra sugerida</TableHead>
                          <TableHead>Estado stock</TableHead>
                          <TableHead className="text-center">Compra</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.items.map(item => (
                          <TableRow
                            key={item.id}
                            className={item.status === 'purchased' ? 'opacity-60 bg-emerald-50/30' : ''}
                          >
                            <TableCell>
                              <Link
                                href={`/ingredients/${item.id}`}
                                className={`font-medium hover:text-primary transition-colors hover:underline ${
                                  item.status === 'purchased' ? 'line-through text-muted-foreground' : 'text-foreground'
                                }`}
                              >
                                {item.name}
                              </Link>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-mono">{item.currentStock}</span>
                              <span className="text-xs text-muted-foreground ml-1">{item.unit}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-mono text-muted-foreground">{item.targetStock}</span>
                              <span className="text-xs text-muted-foreground ml-1">{item.unit}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-mono font-semibold text-primary">{item.suggestedPurchase}</span>
                              <span className="text-xs text-muted-foreground ml-1">{item.unit}</span>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${item.stockLevelColor} gap-1 text-xs`}>
                                {item.stockLevel === 'critico' && <AlertOctagon className="w-3 h-3" />}
                                {item.stockLevel === 'bajo' && <AlertTriangle className="w-3 h-3" />}
                                {item.stockLevelLabel}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {item.status === 'pending' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 gap-1 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                  disabled={toggling === item.id}
                                  onClick={() => handleToggle(item.id, 'purchased')}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Comprado
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 gap-1 text-xs text-muted-foreground"
                                  disabled={toggling === item.id}
                                  onClick={() => handleToggle(item.id, 'pending')}
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                  Pendiente
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </FadeIn>
    </div>
  )
}

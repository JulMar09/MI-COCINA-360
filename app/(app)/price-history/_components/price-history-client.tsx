'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useKitchen } from '@/lib/kitchen-context'
import { formatCurrency } from '@/lib/currency'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FadeIn } from '@/components/ui/animate'
import { SafeDate } from '@/components/safe-format'
import {
  History,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  X,
} from 'lucide-react'

const SOURCE_LABELS: Record<string, string> = {
  initial: 'Precio inicial',
  manual: 'Edición manual',
  albaran: 'Albarán',
}

const SOURCE_COLORS: Record<string, string> = {
  initial: 'bg-slate-100 text-slate-700',
  manual: 'bg-blue-100 text-blue-700',
  albaran: 'bg-emerald-100 text-emerald-700',
}

export function PriceHistoryClient() {
  const { kitchen } = useKitchen()
  const currency = kitchen?.currency ?? 'EUR'
  const [records, setRecords] = useState<any[]>([])
  const [ingredients, setIngredients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [filterIngredient, setFilterIngredient] = useState<string>('all')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterIngredient && filterIngredient !== 'all') params.set('ingredientId', filterIngredient)
      if (filterDateFrom) params.set('dateFrom', filterDateFrom)
      if (filterDateTo) params.set('dateTo', filterDateTo)
      const res = await fetch(`/api/price-history?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setRecords(data.records ?? [])
        setIngredients(data.ingredients ?? [])
      }
    } catch {
      console.error('Error al cargar historial de precios')
    } finally {
      setLoading(false)
    }
  }, [filterIngredient, filterDateFrom, filterDateTo])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const hasFilters = filterIngredient !== 'all' || filterDateFrom || filterDateTo

  const clearFilters = () => {
    setFilterIngredient('all')
    setFilterDateFrom('')
    setFilterDateTo('')
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-primary" />
            Historial de precios
          </h1>
          <p className="text-muted-foreground mt-1">
            Todos los cambios de precio de los ingredientes de tu cocina
          </p>
        </div>
      </FadeIn>

      {/* Filters */}
      <FadeIn delay={0.1}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros</span>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">
                  <X className="w-3 h-3 mr-1" /> Limpiar
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Ingrediente</Label>
                <Select value={filterIngredient} onValueChange={setFilterIngredient}>
                  <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los ingredientes</SelectItem>
                    {ingredients.map((ing: any) => (
                      <SelectItem key={ing.id} value={ing.id}>{ing.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Desde</Label>
                <Input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Hasta</Label>
                <Input
                  type="date"
                  value={filterDateTo}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterDateTo(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Table */}
      <FadeIn delay={0.2}>
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Cargando...</div>
            ) : records.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {hasFilters ? 'Sin resultados con los filtros seleccionados' : 'No hay registros de precios'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ingrediente</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Precio anterior</TableHead>
                      <TableHead className="text-right">Nuevo precio</TableHead>
                      <TableHead className="text-right">Variación</TableHead>
                      <TableHead className="text-right">Variación %</TableHead>
                      <TableHead>Origen</TableHead>
                      <TableHead>Proveedor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((entry: any) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Link
                            href={`/ingredients/${entry.ingredientId}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {entry.ingredientName}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <SafeDate date={entry.date} options={{ dateStyle: 'medium', timeStyle: 'short' }} locale="es-ES" />
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {entry.previousPrice !== null
                            ? formatCurrency(entry.previousPrice, currency)
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {formatCurrency(entry.price, currency)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {entry.variationAbs !== null ? (
                            <span className={`inline-flex items-center gap-1 ${
                              entry.variationAbs > 0 ? 'text-red-600' : entry.variationAbs < 0 ? 'text-emerald-600' : 'text-muted-foreground'
                            }`}>
                              {entry.variationAbs > 0 ? (
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              ) : entry.variationAbs < 0 ? (
                                <ArrowDownRight className="w-3.5 h-3.5" />
                              ) : null}
                              {entry.variationAbs > 0 ? '+' : ''}{formatCurrency(entry.variationAbs, currency)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {entry.variationPct !== null ? (
                            <span className={`${
                              entry.variationPct > 0 ? 'text-red-600' : entry.variationPct < 0 ? 'text-emerald-600' : 'text-muted-foreground'
                            }`}>
                              {entry.variationPct > 0 ? '+' : ''}{entry.variationPct.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={SOURCE_COLORS[entry.source] ?? 'bg-gray-100 text-gray-700'} variant="secondary">
                            {SOURCE_LABELS[entry.source] ?? entry.source}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {entry.supplierName ?? '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}

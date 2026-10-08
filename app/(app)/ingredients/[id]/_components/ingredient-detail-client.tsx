'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useKitchen } from '@/lib/kitchen-context'
import { formatCurrency } from '@/lib/currency'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FadeIn } from '@/components/ui/animate'
import { SafeDate } from '@/components/safe-format'
import {
  ArrowLeft,
  Carrot,
  History,
  ArrowUpRight,
  ArrowDownRight,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react'
import { analyzeStock } from '@/lib/stock-levels'

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

export function IngredientDetailClient() {
  const params = useParams()
  const router = useRouter()
  const { kitchen } = useKitchen()
  const [ingredient, setIngredient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const ingredientId = params?.id as string
  const currency = kitchen?.currency ?? 'EUR'

  const fetchData = useCallback(async () => {
    if (!ingredientId) return
    try {
      setLoading(true)
      const res = await fetch(`/api/ingredients/${ingredientId}`)
      if (!res.ok) {
        setError('Ingrediente no encontrado')
        return
      }
      const data = await res.json()
      setIngredient(data)
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [ingredientId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  if (error || !ingredient) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/ingredients')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver a Ingredientes
        </Button>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {error ?? 'Ingrediente no encontrado'}
          </CardContent>
        </Card>
      </div>
    )
  }

  const priceHistory = ingredient.priceHistory ?? []
  const latestChange = priceHistory.length >= 2 ? priceHistory[0] : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link href="/ingredients" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Ingredientes
            </Link>
            <h1 className="text-2xl font-display font-bold tracking-tight flex items-center gap-2">
              <Carrot className="w-6 h-6 text-primary" />
              {ingredient.name}
            </h1>
            <p className="text-muted-foreground mt-1">
              {ingredient.category} · {ingredient.unit}
              {ingredient.supplier?.name ? ` · Proveedor: ${ingredient.supplier.name}` : ''}
            </p>
          </div>
        </div>
      </FadeIn>

      {/* Info cards */}
      <FadeIn delay={0.1}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Coste actual</p>
              <p className="text-2xl font-bold font-mono mt-1">
                {formatCurrency(ingredient.costPerUnit ?? 0, currency)}
                <span className="text-sm font-normal text-muted-foreground">/{ingredient.unit}</span>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Stock actual</p>
              {(() => {
                const sa = analyzeStock({
                  currentStock: ingredient.currentStock ?? 0,
                  criticalStock: ingredient.criticalStock ?? 0,
                  minStock: ingredient.minStock ?? 0,
                  targetStock: ingredient.targetStock ?? 0,
                })
                const lvl = sa.levelInfo
                return (
                  <>
                    <p className="text-2xl font-bold font-mono mt-1">
                      {ingredient.currentStock ?? 0}
                      <span className="text-sm font-normal text-muted-foreground"> {ingredient.unit}</span>
                    </p>
                    <Badge className={`${lvl.color} gap-1 text-xs mt-2`}>
                      {lvl.level === 'critico' && <AlertOctagon className="w-3 h-3" />}
                      {lvl.level === 'bajo' && <AlertTriangle className="w-3 h-3" />}
                      {lvl.level === 'optimo' && <CheckCircle2 className="w-3 h-3" />}
                      {lvl.level === 'normal' && <TrendingUp className="w-3 h-3" />}
                      {lvl.label}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
                      {(ingredient.targetStock ?? 0) > 0 && <p>Objetivo: {ingredient.targetStock} {ingredient.unit}</p>}
                      {(ingredient.minStock ?? 0) > 0 && <p>Mínimo: {ingredient.minStock} {ingredient.unit}</p>}
                      {(ingredient.criticalStock ?? 0) > 0 && <p>Crítico: {ingredient.criticalStock} {ingredient.unit}</p>}
                    </div>
                  </>
                )
              })()}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Cambios de precio</p>
              <p className="text-2xl font-bold font-mono mt-1">{priceHistory.length}</p>
              <p className="text-xs text-muted-foreground mt-1">registros en historial</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Última variación</p>
              {latestChange?.variationPct !== null && latestChange?.variationPct !== undefined ? (
                <>
                  <p className={`text-2xl font-bold font-mono mt-1 ${
                    latestChange.variationPct > 0 ? 'text-red-600' : latestChange.variationPct < 0 ? 'text-emerald-600' : ''
                  }`}>
                    {latestChange.variationPct > 0 ? '+' : ''}{latestChange.variationPct.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {latestChange.variationAbs > 0 ? '+' : ''}{formatCurrency(latestChange.variationAbs, currency)}
                  </p>
                </>
              ) : (
                <p className="text-2xl font-bold font-mono mt-1 text-muted-foreground">—</p>
              )}
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      {/* Price history table */}
      <FadeIn delay={0.2}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Historial de precios
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {priceHistory.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No hay registros de precio para este ingrediente
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead className="text-right">Precio anterior</TableHead>
                      <TableHead className="text-right">Variación</TableHead>
                      <TableHead className="text-right">Variación %</TableHead>
                      <TableHead>Origen</TableHead>
                      <TableHead>Proveedor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {priceHistory.map((entry: any) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <SafeDate date={entry.date} options={{ dateStyle: 'medium', timeStyle: 'short' }} locale="es-ES" />
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {formatCurrency(entry.price, currency)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {entry.previousPrice !== null ? formatCurrency(entry.previousPrice, currency) : '—'}
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

      {/* Notes */}
      {ingredient.notes && (
        <FadeIn delay={0.3}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{ingredient.notes}</p>
            </CardContent>
          </Card>
        </FadeIn>
      )}
    </div>
  )
}

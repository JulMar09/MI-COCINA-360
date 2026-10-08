'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useKitchen } from '@/lib/kitchen-context'
import { formatCurrency } from '@/lib/currency'
import { getFoodCostConfig, getFoodCostStatus, FOOD_COST_STATUS_META } from '@/lib/food-cost'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertTriangle, TrendingUp, TrendingDown, Crown } from 'lucide-react'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipe: any
}

export function RecipeDetailDialog({ open, onOpenChange, recipe }: Props) {
  const { kitchen } = useKitchen()
  const currency = kitchen?.currency ?? 'EUR'
  const config = getFoodCostConfig(kitchen)
  const [analysis, setAnalysis] = useState<any>(null)

  useEffect(() => {
    let active = true
    if (open && recipe?.id) {
      setAnalysis(null)
      fetch(`/api/recipes/${recipe.id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => { if (active && data?.analysis) setAnalysis(data.analysis) })
        .catch(() => {})
    }
    return () => { active = false }
  }, [open, recipe?.id])

  if (!recipe) return null

  // Cálculo local de reserva mientras carga el análisis del servidor.
  const localTotal = (recipe?.ingredients ?? []).reduce(
    (sum: number, ri: any) => sum + (ri?.quantity ?? 0) * (ri?.ingredient?.costPerUnit ?? 0), 0
  )
  const localPerPortion = localTotal / Math.max(recipe?.yield ?? 1, 1)
  const localFoodCost = (recipe?.sellingPrice ?? 0) > 0 ? (localPerPortion / (recipe?.sellingPrice ?? 1)) * 100 : 0

  const totalCost = analysis?.totalCost ?? localTotal
  const costPerPortion = analysis?.costPerPortion ?? localPerPortion
  const sellingPrice = analysis?.sellingPrice ?? (recipe?.sellingPrice ?? 0)
  const foodCostPct = analysis?.foodCostPercent ?? localFoodCost
  const grossMargin = analysis?.grossMargin ?? (sellingPrice > 0 ? sellingPrice - costPerPortion : 0)
  const hasIncompleteCost = analysis?.hasIncompleteCost ?? false
  const incompleteIngredients: string[] = analysis?.incompleteIngredients ?? []
  const topContributor = analysis?.topContributor ?? null
  const costEvolution = analysis?.costEvolution ?? null

  const status = analysis?.status ?? getFoodCostStatus(foodCostPct, config, hasIncompleteCost)
  const statusMeta = FOOD_COST_STATUS_META[status as keyof typeof FOOD_COST_STATUS_META]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            {recipe?.name ?? ''}
            <Badge variant="secondary">{recipe?.category ?? ''}</Badge>
            <Badge variant="outline" className={statusMeta?.badge}>
              {statusMeta?.emoji} {statusMeta?.label}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Aviso de coste incompleto */}
          {hasIncompleteCost && (
            <div className="flex items-start gap-2 rounded-lg border border-slate-300 bg-slate-100 p-3 text-sm text-slate-700">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">⚠️ Coste incompleto</p>
                {incompleteIngredients.map((n) => (
                  <p key={n}>El ingrediente {n} no tiene un precio registrado.</p>
                ))}
                <p className="mt-1 opacity-80">El Food Cost mostrado puede ser inferior al real hasta que se registren estos precios.</p>
              </div>
            </div>
          )}

          {/* Resumen económico */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Coste MP Total</p>
              <p className="text-lg font-mono font-bold mt-1">{formatCurrency(totalCost, currency)}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Rendimiento</p>
              <p className="text-lg font-mono font-bold mt-1">{recipe?.yield ?? 1} raciones</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Coste/Ración</p>
              <p className="text-lg font-mono font-bold mt-1">{formatCurrency(costPerPortion, currency)}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Precio Venta</p>
              <p className="text-lg font-mono font-bold mt-1">{formatCurrency(sellingPrice, currency)}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Margen bruto s/ MP</p>
              <p className="text-lg font-mono font-bold mt-1">{formatCurrency(grossMargin, currency)}</p>
            </div>
            <div className={`rounded-lg p-3 text-center ${statusMeta?.bg} ${statusMeta?.text}`}>
              <p className="text-xs opacity-80">Food Cost</p>
              <p className="text-lg font-mono font-bold mt-1">{foodCostPct?.toFixed?.(1) ?? '0.0'}%</p>
            </div>
          </div>

          {/* Margen bruto sobre materia prima (aclaración) */}
          <p className="text-xs text-muted-foreground -mt-2">
            Margen bruto sobre materia prima = Precio de venta − Coste por ración. No incluye otros gastos (personal, energía, etc.).
          </p>

          {/* Evolución del coste y principal contribuyente */}
          {(costEvolution || topContributor) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {costEvolution && (
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    {costEvolution.variationPct >= 0
                      ? <TrendingUp className="w-3.5 h-3.5 text-red-600" />
                      : <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />}
                    Evolución del coste
                  </p>
                  <p className="text-sm">
                    Antes: <span className="font-mono">{formatCurrency(costEvolution.previousCost, currency)}</span>
                    {' → '}
                    Ahora: <span className="font-mono font-medium">{formatCurrency(costEvolution.currentCost, currency)}</span>
                  </p>
                  <p className={`text-sm font-medium mt-1 ${costEvolution.variationPct >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {costEvolution.variationPct >= 0 ? '+' : ''}{costEvolution.variationPct.toFixed(1)}%
                  </p>
                </div>
              )}
              {topContributor && (
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-amber-500" /> Principal contribuyente al coste
                  </p>
                  <p className="text-sm font-medium">{topContributor.name}</p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-mono">{formatCurrency(topContributor.subtotal, currency)}</span>
                    {' · '}{topContributor.pct.toFixed(0)}% del coste total
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Desglose de ingredientes */}
          <div>
            <h3 className="font-medium mb-2">Desglose de Ingredientes ({recipe?.yield ?? 1} raciones)</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingrediente</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead className="text-right">Coste/Ud</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(recipe?.ingredients ?? []).map((ri: any, idx: number) => {
                  const unpriced = (ri?.ingredient?.costPerUnit ?? 0) <= 0
                  const subtotal = (ri?.quantity ?? 0) * (ri?.ingredient?.costPerUnit ?? 0)
                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        {ri?.ingredient?.name ?? ''}
                        {unpriced && (
                          <span className="ml-2 inline-flex items-center gap-1 text-xs text-amber-600">
                            <AlertTriangle className="w-3 h-3" /> sin precio
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">{ri?.quantity ?? 0}</TableCell>
                      <TableCell>{ri?.ingredient?.unit ?? ''}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(ri?.ingredient?.costPerUnit ?? 0, currency)}</TableCell>
                      <TableCell className="text-right font-mono font-medium">{formatCurrency(subtotal, currency)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {recipe?.notes && (
            <div>
              <h3 className="font-medium mb-2">Notas de Preparación</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{recipe.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

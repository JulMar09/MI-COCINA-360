'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useKitchen } from '@/lib/kitchen-context'
import { formatCurrency } from '@/lib/currency'
import { analyzeStock, type StockLevel } from '@/lib/stock-levels'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { FadeIn } from '@/components/ui/animate'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Search, Package, AlertTriangle, AlertOctagon, CheckCircle2,
  TrendingUp, ShoppingCart, ArrowUpDown, Settings2,
} from 'lucide-react'

type SortField = 'name' | 'stock' | 'level' | 'value'
type SortDir = 'asc' | 'desc'

const LEVEL_ORDER: Record<StockLevel, number> = {
  critico: 0, bajo: 1, normal: 2, optimo: 3, sin_configurar: 4,
}

const FILTER_OPTIONS: { value: StockLevel | 'todos'; label: string; icon?: React.ReactNode }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'critico', label: 'Crítico', icon: <AlertOctagon className="w-3.5 h-3.5" /> },
  { value: 'bajo', label: 'Bajo', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  { value: 'normal', label: 'Normal', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  { value: 'optimo', label: 'Óptimo', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { value: 'sin_configurar', label: 'Sin configurar', icon: <Settings2 className="w-3.5 h-3.5" /> },
]

function ProgressBar({ percent, level }: { percent: number; level: StockLevel }) {
  const cappedPercent = Math.min(percent, 100)
  const barColor = {
    critico: 'bg-red-500',
    bajo: 'bg-amber-500',
    normal: 'bg-blue-500',
    optimo: 'bg-emerald-500',
    sin_configurar: 'bg-gray-300',
  }[level]

  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${cappedPercent}%` }}
        />
      </div>
      {percent > 0 && (
        <span className="text-xs text-muted-foreground font-mono w-10 text-right">{percent}%</span>
      )}
    </div>
  )
}

export function InventoryClient() {
  const { kitchen } = useKitchen()
  const [ingredients, setIngredients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState<StockLevel | 'todos'>('todos')
  const [sortField, setSortField] = useState<SortField>('level')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/ingredients')
      if (res.ok) setIngredients(await res.json())
    } catch { console.error('Failed to fetch inventory') } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const currency = kitchen?.currency ?? 'EUR'

  // Analyze every ingredient once
  const analyzed = useMemo(() => {
    return (ingredients ?? []).map((i: any) => {
      const analysis = analyzeStock({
        currentStock: i.currentStock ?? 0,
        criticalStock: i.criticalStock ?? 0,
        minStock: i.minStock ?? 0,
        targetStock: i.targetStock ?? 0,
      })
      const value = (i.currentStock ?? 0) * (i.costPerUnit ?? 0)
      return { ...i, analysis, value }
    })
  }, [ingredients])

  // Filter
  const filtered = useMemo(() => {
    return analyzed.filter((i) => {
      const matchSearch = (i.name ?? '').toLowerCase().includes(search.toLowerCase())
      const matchLevel = levelFilter === 'todos' || i.analysis.levelInfo.level === levelFilter
      return matchSearch && matchLevel
    })
  }, [analyzed, search, levelFilter])

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'name': cmp = (a.name ?? '').localeCompare(b.name ?? ''); break
        case 'stock': cmp = (a.currentStock ?? 0) - (b.currentStock ?? 0); break
        case 'level': cmp = (LEVEL_ORDER[a.analysis.levelInfo.level as StockLevel] ?? 4) - (LEVEL_ORDER[b.analysis.levelInfo.level as StockLevel] ?? 4); break
        case 'value': cmp = a.value - b.value; break
      }
      return sortDir === 'desc' ? -cmp : cmp
    })
  }, [filtered, sortField, sortDir])

  // Counts for summary cards
  const counts = useMemo(() => {
    let criticos = 0, bajos = 0, totalValue = 0
    for (const i of analyzed) {
      if (i.analysis.levelInfo.level === 'critico') criticos++
      if (i.analysis.levelInfo.level === 'bajo') bajos++
      totalValue += i.value
    }
    return { criticos, bajos, totalValue, total: analyzed.length }
  }, [analyzed])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const SortableHeader = ({ field, children, className = '' }: { field: SortField; children: React.ReactNode; className?: string }) => (
    <TableHead
      className={`cursor-pointer select-none hover:text-foreground transition-colors ${className}`}
      onClick={() => handleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortField === field && (
          <ArrowUpDown className="w-3 h-3 text-primary" />
        )}
      </span>
    </TableHead>
  )

  return (
    <div className="space-y-6">
      <FadeIn>
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" /> Inventario
          </h1>
          <p className="text-muted-foreground mt-1">Control de stock y niveles de ingredientes</p>
        </div>
      </FadeIn>

      {/* Summary Cards */}
      <FadeIn delay={0.1}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Total Ingredientes</p>
              <p className="text-2xl font-mono font-bold mt-1">{counts.total}</p>
            </CardContent>
          </Card>
          <Card className={counts.criticos > 0 ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20' : ''}>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                {counts.criticos > 0 && <AlertOctagon className="w-4 h-4 text-red-500" />}
                Stock Crítico
              </p>
              <p className="text-2xl font-mono font-bold mt-1">{counts.criticos}</p>
            </CardContent>
          </Card>
          <Card className={counts.bajos > 0 ? 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20' : ''}>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                {counts.bajos > 0 && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                Stock Bajo
              </p>
              <p className="text-2xl font-mono font-bold mt-1">{counts.bajos}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Valor Total Stock</p>
              <p className="text-2xl font-mono font-bold mt-1">{formatCurrency(counts.totalValue, currency)}</p>
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      {/* Filters */}
      <FadeIn delay={0.15}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ingredientes..."
              className="pl-10"
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTER_OPTIONS.map((opt) => {
              const count = opt.value === 'todos'
                ? analyzed.length
                : analyzed.filter((i) => i.analysis.levelInfo.level === opt.value).length
              const isActive = levelFilter === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => setLevelFilter(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border inline-flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-primary/10 border-primary/30 text-primary'
                      : 'bg-background border-border text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {opt.icon}
                  {opt.label}
                  {count > 0 && <span className="font-mono">({count})</span>}
                </button>
              )
            })}
          </div>
        </div>
      </FadeIn>

      {/* Table */}
      <FadeIn delay={0.2}>
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Cargando inventario...</div>
            ) : sorted.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {levelFilter !== 'todos' || search
                  ? 'No hay ingredientes que coincidan con los filtros'
                  : 'Sin ingredientes en inventario'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableHeader field="name">Ingrediente</SortableHeader>
                      <TableHead>Categoría</TableHead>
                      <SortableHeader field="stock" className="text-right">Stock</SortableHeader>
                      <TableHead>Objetivo</TableHead>
                      <SortableHeader field="level">Estado</SortableHeader>
                      <TableHead>Progreso</TableHead>
                      <TableHead className="text-right">
                        <ShoppingCart className="w-3.5 h-3.5 inline mr-1" />
                        Compra sugerida
                      </TableHead>
                      <SortableHeader field="value" className="text-right">Valor</SortableHeader>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sorted.map((i) => {
                      const { levelInfo, suggestedPurchase, percentOfTarget } = i.analysis
                      return (
                        <TableRow key={i.id} className={levelInfo.borderColor}>
                          <TableCell>
                            <Link
                              href={`/ingredients/${i.id}`}
                              className="font-medium text-foreground hover:text-primary transition-colors hover:underline"
                            >
                              {i.name}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">{i.category}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-mono font-medium">{i.currentStock ?? 0}</span>
                            <span className="text-xs text-muted-foreground ml-1">{i.unit}</span>
                          </TableCell>
                          <TableCell>
                            {(i.targetStock ?? 0) > 0 ? (
                              <span className="font-mono text-sm text-muted-foreground">{i.targetStock} {i.unit}</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${levelInfo.color} gap-1 text-xs`}>
                              {levelInfo.level === 'critico' && <AlertOctagon className="w-3 h-3" />}
                              {levelInfo.level === 'bajo' && <AlertTriangle className="w-3 h-3" />}
                              {levelInfo.level === 'optimo' && <CheckCircle2 className="w-3 h-3" />}
                              {levelInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <ProgressBar percent={percentOfTarget} level={levelInfo.level} />
                          </TableCell>
                          <TableCell className="text-right">
                            {suggestedPurchase > 0 ? (
                              <span className="font-mono text-sm font-medium text-primary">
                                {suggestedPurchase} {i.unit}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {formatCurrency(i.value, currency)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
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

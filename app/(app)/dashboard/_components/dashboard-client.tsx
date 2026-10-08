'use client'

import { useState, useEffect, useCallback } from 'react'
import { useKitchen } from '@/lib/kitchen-context'
import { formatCurrency } from '@/lib/currency'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/animate'
import {
  Carrot,
  Truck,
  BookOpen,
  Package,
  Plus,
  TrendingUp,
  DollarSign,
  ClipboardList,
  ArrowRight,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  ShieldCheck,
  Bell,
  CalendarDays,
  PackageOpen,
  ChefHat,
} from 'lucide-react'
import Link from 'next/link'
import { SafeDate } from '@/components/safe-format'

interface Alert {
  type: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  elementId: string
  href: string
  date: string
}

interface TodayDelivery {
  id: string
  supplierName: string
  ingredientName: string
  quantity: number
  unit: string
  totalPrice: number
}

interface RecentDelivery extends TodayDelivery {
  date: string
}

interface TodaySection {
  todayDeliveryNotes: TodayDelivery[]
  recentDeliveryNotes: RecentDelivery[]
  lowStockCount: number
  alertCount: number
  totalIngredients: number
  totalRecipes: number
}

interface DashboardData {
  ingredientCount: number
  supplierCount: number
  recipeCount: number
  inventoryValue: number
  topRecipes: any[]
  recentPriceChanges: any[]
  currency: string
  alerts: Alert[]
  today: TodaySection
}

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === 'critical') return <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
  if (severity === 'warning') return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
  return <Info className="w-5 h-5 text-blue-500 shrink-0" />
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200',
  }
  const labels: Record<string, string> = {
    critical: 'Crítico',
    warning: 'Atención',
    info: 'Info',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${styles[severity] ?? styles.info}`}>
      {labels[severity] ?? 'Info'}
    </span>
  )
}

export function DashboardClient() {
  const { kitchen } = useKitchen()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard')
      if (res.ok) setData(await res.json())
    } catch {
      console.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const currency = data?.currency ?? kitchen?.currency ?? 'EUR'

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i: number) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="h-40 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  const stats = [
    { label: 'Ingredientes', value: data?.ingredientCount ?? 0, icon: Carrot, color: 'text-emerald-600', bg: 'bg-emerald-50', href: '/ingredients' },
    { label: 'Proveedores', value: data?.supplierCount ?? 0, icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50', href: '/suppliers' },
    { label: 'Recetas', value: data?.recipeCount ?? 0, icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-50', href: '/recipes' },
    { label: 'Valor Inventario', value: formatCurrency(data?.inventoryValue ?? 0, currency), icon: Package, color: 'text-purple-600', bg: 'bg-purple-50', href: '/inventory' },
  ]

  const quickActions = [
    { label: 'Añadir Ingrediente', icon: Carrot, href: '/ingredients?action=new' },
    { label: 'Añadir Proveedor', icon: Truck, href: '/suppliers?action=new' },
    { label: 'Crear Receta', icon: BookOpen, href: '/recipes?action=new' },
    { label: 'Registrar Albarán', icon: ClipboardList, href: '/delivery-notes?action=new' },
  ]

  const alerts = data?.alerts ?? []
  const hasAlerts = alerts.length > 0
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length
  const warningCount = alerts.filter((a) => a.severity === 'warning').length
  const todayData = data?.today

  return (
    <div className="space-y-8">
      <FadeIn>
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">
            Panel de Control
          </h1>
          <p className="text-muted-foreground mt-1">
            Resumen general de {kitchen?.name ?? 'tu cocina'}
          </p>
        </div>
      </FadeIn>

      {/* Stats Grid */}
      <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat: any, idx: number) => {
          const Icon = stat.icon
          return (
            <StaggerItem key={idx}>
              <Link href={stat.href}>
                <Card variant="interactive" className="cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold font-mono mt-1">{stat.value}</p>
                      </div>
                      <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </StaggerItem>
          )
        })}
      </Stagger>

      {/* Estado de la Cocina */}
      <FadeIn delay={0.05}>
        <Card className={hasAlerts ? 'border-amber-200 dark:border-amber-800' : 'border-emerald-200 dark:border-emerald-800'}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              {hasAlerts ? (
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
              )}
              Estado de la Cocina
              {hasAlerts && (
                <div className="flex gap-1.5 ml-auto">
                  {criticalCount > 0 && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                      {criticalCount} crítico{criticalCount > 1 ? 's' : ''}
                    </span>
                  )}
                  {warningCount > 0 && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                      {warningCount} alerta{warningCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!hasAlerts ? (
              <div className="flex items-center gap-3 py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <p className="font-medium text-emerald-700 dark:text-emerald-400">Todo está bajo control</p>
                  <p className="text-sm text-muted-foreground">No hay incidencias que requieran atención</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map((alert, idx) => (
                  <Link key={idx} href={alert.href}>
                    <div className={`flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-muted/50 ${
                      alert.severity === 'critical' ? 'bg-red-50/50 dark:bg-red-950/20' :
                      alert.severity === 'warning' ? 'bg-amber-50/50 dark:bg-amber-950/20' :
                      'bg-blue-50/50 dark:bg-blue-950/20'
                    }`}>
                      <SeverityIcon severity={alert.severity} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium truncate">{alert.title}</p>
                          <SeverityBadge severity={alert.severity} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-4 pt-3 border-t flex justify-end">
              <Link href="/alerts">
                <Button variant="ghost" size="sm">
                  <Bell className="w-4 h-4 mr-1" /> Ver Centro de alertas
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Hoy en tu Cocina */}
      <FadeIn delay={0.1}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              Hoy en tu Cocina
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Summary counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold font-mono">{todayData?.todayDeliveryNotes?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Albaranes hoy</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className={`text-2xl font-bold font-mono ${(todayData?.lowStockCount ?? 0) > 0 ? 'text-amber-600' : ''}`}>
                  {todayData?.lowStockCount ?? 0}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Stock bajo</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold font-mono">{todayData?.totalIngredients ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Ingredientes</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold font-mono">{todayData?.totalRecipes ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Recetas activas</p>
              </div>
            </div>

            {/* Today's deliveries or recent deliveries */}
            {(todayData?.todayDeliveryNotes?.length ?? 0) > 0 ? (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <PackageOpen className="w-4 h-4 text-primary" />
                  Entregas de hoy
                </h4>
                <div className="space-y-2">
                  {(todayData?.todayDeliveryNotes ?? []).map((dn) => (
                    <div key={dn.id} className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{dn.ingredientName}</p>
                        <p className="text-xs text-muted-foreground">{dn.supplierName} — {dn.quantity} {dn.unit}</p>
                      </div>
                      <p className="text-sm font-mono font-medium shrink-0">{formatCurrency(dn.totalPrice, currency)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (todayData?.recentDeliveryNotes?.length ?? 0) > 0 ? (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <PackageOpen className="w-4 h-4 text-primary" />
                  Últimas entregas
                </h4>
                <div className="space-y-2">
                  {(todayData?.recentDeliveryNotes ?? []).map((dn) => (
                    <div key={dn.id} className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{dn.ingredientName}</p>
                        <p className="text-xs text-muted-foreground">
                          {dn.supplierName} — <SafeDate date={dn.date} options={{ dateStyle: 'medium' }} locale="es-ES" />
                        </p>
                      </div>
                      <p className="text-sm font-mono font-medium shrink-0">{formatCurrency(dn.totalPrice, currency)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <ChefHat className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Sin actividad registrada hoy</p>
                <p className="text-xs text-muted-foreground mt-1">
                  La producción prevista y tareas pendientes estarán disponibles en futuras versiones
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      {/* Quick Actions */}
      <FadeIn delay={0.15}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Acciones Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickActions.map((action: any, idx: number) => {
                const Icon = action.icon
                return (
                  <Link key={idx} href={action.href}>
                    <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                      <Icon className="w-5 h-5 text-primary" />
                      <span className="text-xs">{action.label}</span>
                    </Button>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Recipes by Cost */}
        <FadeIn delay={0.2}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Recetas con Mayor Coste
              </CardTitle>
              <Link href="/recipes">
                <Button variant="ghost" size="sm">
                  Ver todas <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {(data?.topRecipes?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No hay recetas aún</p>
              ) : (
                <div className="space-y-3">
                  {(data?.topRecipes ?? []).map((recipe: any, idx: number) => (
                    <div key={recipe?.id ?? idx} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{recipe?.name ?? ''}</p>
                        <p className="text-xs text-muted-foreground">{recipe?.category ?? ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono font-medium">{formatCurrency(recipe?.totalCost ?? 0, currency)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(recipe?.costPerPortion ?? 0, currency)}/porción
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Recent Price Changes */}
        <FadeIn delay={0.3}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Cambios de Precio Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(data?.recentPriceChanges?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Sin cambios de precio recientes</p>
              ) : (
                <div className="space-y-3">
                  {(data?.recentPriceChanges ?? []).map((change: any, idx: number) => (
                    <div key={change?.id ?? idx} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{change?.ingredientName ?? ''}</p>
                        <p className="text-xs text-muted-foreground">
                          <SafeDate date={change?.date} options={{ dateStyle: 'medium' }} locale="es-ES" />
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-medium">
                          {formatCurrency(change?.price ?? 0, currency)}/{change?.unit ?? ''}
                        </span>
                        <Badge variant="secondary" className="text-xs">{change?.source ?? ''}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  )
}
